import React, { useMemo, useCallback, useRef } from 'react';
import {
  startOfWeek,
  addDays,
  format,
  isToday,
} from 'date-fns';
import { useAgendaStore } from '../store';
import { EMPLOYEES } from '../mock-data';
import {
  timeToMinutes,
  minutesToTime,
  snapToQuarter,
  formatTime,
  toDateString,
  layoutAppointments,
} from '../utils';
import type { Appointment } from '../types';

const HOUR_HEIGHT = 60; // px per hour
const QUARTER_HEIGHT = HOUR_HEIGHT / 4;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getEmployeeColor(employeeIds: string[]): string {
  if (employeeIds.length === 0) return '#6366f1';
  const emp = EMPLOYEES.find((e) => e.id === employeeIds[0]);
  return emp?.color ?? '#6366f1';
}

/** Find which day column + minute offset the pointer is over */
function resolvePointerPosition(
  clientX: number,
  clientY: number,
  weekViewEl: HTMLElement
): { dayIndex: number; minutes: number } | null {
  const columns = weekViewEl.querySelectorAll('.week-day-column');
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const rect = col.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) {
      const slotsEl = col.querySelector('.day-slots');
      if (!slotsEl) return null;
      const slotsRect = slotsEl.getBoundingClientRect();
      const y = clientY - slotsRect.top;
      const minutes = (y / (24 * HOUR_HEIGHT)) * 1440;
      return { dayIndex: i, minutes };
    }
  }
  return null;
}

// ─── Appointment Block ──────────────────────────────────────────────────────

type InteractionMode = 'idle' | 'move' | 'resize-top' | 'resize-bottom';
const DRAG_THRESHOLD = 4;

const OVERLAP_GAP = 2; // px gap between side-by-side blocks

const AppointmentBlock: React.FC<{
  appointment: Appointment;
  column: number;
  totalColumns: number;
  onEdit: (a: Appointment) => void;
  onMoveEnd: (id: string, newDate: string, newStart: string, newEnd: string) => void;
  onResizeEnd: (id: string, newStart: string, newEnd: string) => void;
  weekViewRef: React.RefObject<HTMLDivElement | null>;
  days: Date[];
}> = React.memo(({ appointment, column, totalColumns, onEdit, onMoveEnd, onResizeEnd, weekViewRef, days }) => {
  const startMin = timeToMinutes(appointment.startTime);
  const endMin = timeToMinutes(appointment.endTime);
  const duration = endMin - startMin;
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = Math.max((duration / 60) * HOUR_HEIGHT, QUARTER_HEIGHT);
  const color = getEmployeeColor(appointment.employeeIds);

  const blockRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<InteractionMode>('idle');

  const employees = appointment.employeeIds
    .map((id) => EMPLOYEES.find((e) => e.id === id)?.name)
    .filter(Boolean);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const target = e.target as HTMLElement;
      const isTopHandle = target.classList.contains('resize-handle-top');
      const isBottomHandle = target.classList.contains('resize-handle-bottom');
      const mode: InteractionMode = isTopHandle
        ? 'resize-top'
        : isBottomHandle
          ? 'resize-bottom'
          : 'move';

      const startX = e.clientX;
      const startY = e.clientY;
      const origStartMin = timeToMinutes(appointment.startTime);
      const origEndMin = timeToMinutes(appointment.endTime);
      const origDuration = origEndMin - origStartMin;
      const origDayIndex = days.findIndex(
        (d) => toDateString(d) === appointment.date
      );

      const blockRect = blockRef.current!.getBoundingClientRect();
      const grabOffsetMin = ((e.clientY - blockRect.top) / HOUR_HEIGHT) * 60;

      let committed = false;
      let lastNewStart = origStartMin;
      let lastNewEnd = origEndMin;
      let lastDayIndex = origDayIndex;
      let ghost: HTMLDivElement | null = null;

      const onPointerMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!committed) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
          committed = true;
          interactionRef.current = mode;
          document.body.style.userSelect = 'none';
          document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ns-resize';

          if (mode === 'move') {
            ghost = blockRef.current!.cloneNode(true) as HTMLDivElement;
            ghost.classList.add('appointment-ghost');
            ghost.style.position = 'fixed';
            ghost.style.width = `${blockRect.width}px`;
            ghost.style.pointerEvents = 'none';
            ghost.style.zIndex = '1000';
            ghost.style.opacity = '0.85';
            document.body.appendChild(ghost);
            blockRef.current!.style.opacity = '0.3';
          }
        }

        if (mode === 'move') {
          if (ghost) {
            ghost.style.left = `${ev.clientX - blockRect.width / 2}px`;
            ghost.style.top = `${ev.clientY - grabOffsetMin * (HOUR_HEIGHT / 60)}px`;
          }

          if (weekViewRef.current) {
            const pos = resolvePointerPosition(ev.clientX, ev.clientY, weekViewRef.current);
            if (pos) {
              const rawStart = pos.minutes - grabOffsetMin;
              const snappedStart = snapToQuarter(Math.max(0, Math.min(1440 - origDuration, rawStart)));
              lastNewStart = snappedStart;
              lastNewEnd = snappedStart + origDuration;
              lastDayIndex = pos.dayIndex;
            }
          }
        } else {
          const totalDy = ev.clientY - startY;
          const totalQuarters = Math.round(totalDy / QUARTER_HEIGHT);
          const deltaMin = totalQuarters * 15;

          if (mode === 'resize-top') {
            let newStart = snapToQuarter(Math.max(0, origStartMin + deltaMin));
            if (newStart >= origEndMin) newStart = origEndMin - 15;
            lastNewStart = newStart;
            lastNewEnd = origEndMin;
          } else {
            let newEnd = snapToQuarter(Math.min(1440, origEndMin + deltaMin));
            if (newEnd <= origStartMin) newEnd = origStartMin + 15;
            lastNewStart = origStartMin;
            lastNewEnd = newEnd;
          }

          if (blockRef.current) {
            const newTop = (lastNewStart / 60) * HOUR_HEIGHT;
            const newHeight = Math.max(
              ((lastNewEnd - lastNewStart) / 60) * HOUR_HEIGHT,
              QUARTER_HEIGHT
            );
            blockRef.current.style.top = `${newTop}px`;
            blockRef.current.style.height = `${newHeight}px`;
          }
        }
      };

      const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (ghost) {
          ghost.remove();
          ghost = null;
        }
        if (blockRef.current) {
          blockRef.current.style.opacity = '';
        }

        if (!committed) {
          interactionRef.current = 'idle';
          onEdit(appointment);
          return;
        }

        if (mode === 'move') {
          const newDate = days[lastDayIndex]
            ? toDateString(days[lastDayIndex])
            : appointment.date;
          onMoveEnd(appointment.id, newDate, minutesToTime(lastNewStart), minutesToTime(lastNewEnd));
        } else {
          onResizeEnd(appointment.id, minutesToTime(lastNewStart), minutesToTime(lastNewEnd));
        }

        requestAnimationFrame(() => {
          interactionRef.current = 'idle';
        });
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    },
    [appointment, days, onEdit, onMoveEnd, onResizeEnd, weekViewRef]
  );

  return (
    <div
      ref={blockRef}
      className="appointment-block"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: totalColumns === 1 ? '3px' : `calc(${(column / totalColumns) * 100}% + 1px)`,
        width: totalColumns === 1 ? 'calc(100% - 6px)' : `calc(${100 / totalColumns}% - ${OVERLAP_GAP}px)`,
        right: 'auto',
        '--accent': color,
        touchAction: 'none',
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      title={`${appointment.name}\n${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}\n${employees.join(', ')}`}
    >
      <div className="resize-handle resize-handle-top" />
      <div className="appointment-time">
        {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
      </div>
      <div className="appointment-name">{appointment.name}</div>
      {height > 40 && employees.length > 0 && (
        <div className="appointment-employees">
          {employees.map((name) => (
            <span key={name} className="employee-chip">{name}</span>
          ))}
        </div>
      )}
      <div className="resize-handle resize-handle-bottom" />
    </div>
  );
});

AppointmentBlock.displayName = 'AppointmentBlock';

// ─── Week View ──────────────────────────────────────────────────────────────

export const WeekView: React.FC = () => {
  const {
    currentDate,
    appointments,
    openModal,
    moveAppointment,
  } = useAgendaStore();

  const weekViewRef = useRef<HTMLDivElement>(null);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const day of days) {
      const key = toDateString(day);
      map.set(key, appointments.filter((a) => a.date === key));
    }
    return map;
  }, [days, appointments]);

  const layoutByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof layoutAppointments>>();
    for (const [dateStr, appts] of appointmentsByDay) {
      map.set(dateStr, layoutAppointments(appts));
    }
    return map;
  }, [appointmentsByDay]);

  const handleCellClick = useCallback(
    (day: Date, hour: number, quarter: number) => {
      const startMinutes = hour * 60 + quarter * 15;
      const endMinutes = startMinutes + 60;
      openModal({
        id: '',
        name: '',
        description: '',
        employeeIds: [],
        date: toDateString(day),
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(Math.min(endMinutes, 1440)),
      });
    },
    [openModal]
  );

  const handleEdit = useCallback(
    (appointment: Appointment) => openModal(appointment),
    [openModal]
  );

  const handleMoveEnd = useCallback(
    (id: string, newDate: string, newStart: string, newEnd: string) => {
      moveAppointment(id, newDate, newStart, newEnd);
    },
    [moveAppointment]
  );

  const handleResizeEnd = useCallback(
    (id: string, newStart: string, newEnd: string) => {
      const appt = appointments.find((a) => a.id === id);
      if (!appt) return;
      moveAppointment(id, appt.date, newStart, newEnd);
    },
    [appointments, moveAppointment]
  );

  return (
    <div className="week-view" ref={weekViewRef}>
      {/* Time gutter */}
      <div className="time-gutter">
        <div className="gutter-header" />
        {HOURS.map((h) => (
          <div key={h} className="gutter-hour" style={{ height: `${HOUR_HEIGHT}px` }}>
            <span>{format(new Date(2000, 0, 1, h), 'h a')}</span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day) => {
        const dateStr = toDateString(day);
        const dayLayout = layoutByDay.get(dateStr) ?? [];
        const today = isToday(day);

        return (
          <div
            key={dateStr}
            className={`week-day-column ${today ? 'is-today' : ''}`}
          >
            <div className="day-header">
              <span className="day-name">{format(day, 'EEE')}</span>
              <span className={`day-number ${today ? 'today-badge' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>

            <div className="day-slots">
              {HOURS.map((h) => (
                <div key={h} className="hour-slot" style={{ height: `${HOUR_HEIGHT}px` }}>
                  {[0, 1, 2, 3].map((q) => (
                    <div
                      key={q}
                      className="quarter-slot"
                      onClick={() => handleCellClick(day, h, q)}
                    />
                  ))}
                </div>
              ))}

              {dayLayout.map(({ appointment: appt, column: col, totalColumns: total }) => (
                <AppointmentBlock
                  key={appt.id}
                  appointment={appt}
                  column={col}
                  totalColumns={total}
                  onEdit={handleEdit}
                  onMoveEnd={handleMoveEnd}
                  onResizeEnd={handleResizeEnd}
                  weekViewRef={weekViewRef}
                  days={days}
                />
              ))}

              {today && <CurrentTimeIndicator />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CurrentTimeIndicator: React.FC = () => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * HOUR_HEIGHT;

  return (
    <div className="current-time-line" style={{ top: `${top}px` }}>
      <div className="current-time-dot" />
    </div>
  );
};
