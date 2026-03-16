import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import { useAgendaStore } from '../store';
import { EMPLOYEES } from '../mock-data';
import { formatTime, toDateString } from '../utils';
import type { Appointment } from '../types';

function getEmployeeColor(employeeIds: string[]): string {
  if (employeeIds.length === 0) return '#6366f1';
  const emp = EMPLOYEES.find((e) => e.id === employeeIds[0]);
  return emp?.color ?? '#6366f1';
}

export const MonthView: React.FC = () => {
  const { currentDate, appointments, openModal, setCurrentDate, setViewMode } =
    useAgendaStore();

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const result: Date[][] = [];
    let day = calStart;
    let week: Date[] = [];

    while (day <= calEnd) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      day = addDays(day, 1);
    }
    return result;
  }, [currentDate]);

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const existing = map.get(a.date) ?? [];
      existing.push(a);
      map.set(a.date, existing);
    }
    return map;
  }, [appointments]);

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode('week');
  };

  return (
    <div className="month-view">
      <div className="month-header-row">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="month-header-cell">
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="month-week-row">
          {week.map((day) => {
            const dateStr = toDateString(day);
            const dayAppts = appointmentMap.get(dateStr) ?? [];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                className={`month-day-cell ${!inMonth ? 'outside' : ''} ${today ? 'is-today' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className={`month-day-number ${today ? 'today-badge' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="month-day-events">
                  {dayAppts.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      className="month-event-chip"
                      style={{ '--accent': getEmployeeColor(appt.employeeIds) } as React.CSSProperties}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(appt);
                      }}
                      title={`${appt.name} (${formatTime(appt.startTime)} – ${formatTime(appt.endTime)})`}
                    >
                      <span className="event-dot" />
                      <span className="event-time">{formatTime(appt.startTime)}</span>
                      <span className="event-label">{appt.name}</span>
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <div className="month-more">+{dayAppts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
