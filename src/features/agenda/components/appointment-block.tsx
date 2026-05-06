import React, {
    useCallback,
    useRef,
} from 'react';
import {
    DRAG_THRESHOLD,
    formatTime,
    HOUR_HEIGHT,
    minutesToTime,
    OVERLAP_GAP,
    QUARTER_HEIGHT,
    resolvePointerPosition,
    snapToQuarter,
    timeToMinutes,
    toDateString,
    type InteractionMode
} from '../utils/agenda.utils';
import type {
    Appointment
} from '@l-ark/types';
import {
    format,
    isSameDay
} from 'date-fns';

interface PropTypes {
    appointment: Appointment;
    column: number;
    totalColumns: number;
    weekViewRef: React.RefObject<HTMLDivElement | null>;
    days: Date[];

    onEdit: (a: Appointment) => void;
    onMoveEnd: (id: string, newDate: string, newStart: string, newEnd: string) => void;
    onResizeEnd: (id: string, newStart: string, newEnd: string) => void;
}

const AppointmentBlock = React.memo((props: PropTypes) => {
    /** Retrieve component utilities */
    const { appointment, column, totalColumns, onEdit, onMoveEnd, onResizeEnd, weekViewRef, days } = props;
    /** Compute the start minute */
    const startMin = timeToMinutes(format(appointment.startAt, 'HH:mm'));
    /** Compute the end minute */
    const endMin = timeToMinutes(format(appointment.endAt, 'HH:mm'));
    /** Compute the durantion slot */
    const duration = endMin - startMin;
    /** Position of the block */
    const top = (startMin / 60) * HOUR_HEIGHT;
    /** Calculate the height of the block */
    const height = Math.max((duration / 60) * HOUR_HEIGHT, QUARTER_HEIGHT);
    /** Reference of the html elements */
    const blockRef = useRef<HTMLDivElement>(null);
    const interactionRef = useRef<InteractionMode>('idle');

    /** Manage the action when the users end dragging, clicking or resizing */
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if ( e.button !== 0 ) return;
        e.stopPropagation();
        e.preventDefault();

        const target = e.target as HTMLElement;
        const isTopHandle = target.classList.contains('resize-handle-top');
        const isBottomHandle = target.classList.contains('resize-handle-bottom');
        const mode: InteractionMode = isTopHandle ? 'resize-top' : isBottomHandle ? 'resize-bottom' : 'move';

        const startX = e.clientX;
        const startY = e.clientY;
        const origStartMin = timeToMinutes(format(appointment.startAt, 'HH:mm'));
        const origEndMin = timeToMinutes(format(appointment.endAt, 'HH:mm'));
        const origDuration = origEndMin - origStartMin;
        const origDayIndex = days.findIndex(d => isSameDay(d, appointment.startAt));

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

            if ( !committed ) {
                if ( Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD ) return;

                committed = true;
                interactionRef.current = mode;
                document.body.style.userSelect = 'none';
                document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ns-resize';

                if ( mode === 'move' ) {
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

            if ( mode === 'move' ) {
                if ( ghost ) {
                    ghost.style.left = `${ev.clientX - blockRect.width / 2}px`;
                    ghost.style.top = `${ev.clientY - grabOffsetMin * (HOUR_HEIGHT / 60)}px`;
                }

                if ( weekViewRef.current ) {
                    const pos = resolvePointerPosition(ev.clientX, ev.clientY, weekViewRef.current);
                    if ( pos ) {
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

                if ( mode === 'resize-top' ) {
                    let newStart = snapToQuarter(Math.max(0, origStartMin + deltaMin));
                    if ( newStart >= origEndMin ) newStart = origEndMin - 15;

                    lastNewStart = newStart;
                    lastNewEnd = origEndMin;
                } else {
                    let newEnd = snapToQuarter(Math.min(1440, origEndMin + deltaMin));
                    if ( newEnd <= origStartMin ) newEnd = origStartMin + 15;

                    lastNewStart = origStartMin;
                    lastNewEnd = newEnd;
                }

                if ( blockRef.current ) {
                    const newTop = (lastNewStart / 60) * HOUR_HEIGHT;
                    const newHeight = Math.max(((lastNewEnd - lastNewStart) / 60) * HOUR_HEIGHT, QUARTER_HEIGHT);
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

            if ( ghost ) {
                ghost.remove();
                ghost = null;
            }

            if ( blockRef.current ) {
                blockRef.current.style.opacity = '';
            }

            if ( !committed ) {
                interactionRef.current = 'idle';
                onEdit(appointment);
                return;
            }

            if ( mode === 'move' ) {
                const newDate = days[lastDayIndex] ? toDateString(days[lastDayIndex]) : format(appointment.startAt, 'dd-MM-yyyy');
                onMoveEnd(appointment.id.toString(), newDate, minutesToTime(lastNewStart), minutesToTime(lastNewEnd));
            } else {
                onResizeEnd(appointment.id.toString(), minutesToTime(lastNewStart), minutesToTime(lastNewEnd));
            }

            requestAnimationFrame(() => { interactionRef.current = 'idle'; });
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }, [appointment, days, onEdit, onMoveEnd, onResizeEnd, weekViewRef]);

    console.log(appointment)
    return (
        <div ref={blockRef} className="appointment-block flex flex-col" onPointerDown={handlePointerDown}
            title={`${appointment.name}\n${formatTime(format(appointment.startAt, 'HH:mm'))} - ${formatTime(format(appointment.endAt, 'HH:mm'))}\n${appointment.users.map(user => `${user.user.firstName} ${user.user.lastName}`).join(', ')}`}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                left: totalColumns === 1 ? '3px' : `calc(${(column / totalColumns) * 100}% + 1px)`,
                width: totalColumns === 1 ? 'calc(100% - 6px)' : `calc(${100 / totalColumns}% - ${OVERLAP_GAP}px)`,
                right: 'auto',
                '--accent': 'dimgray',
                touchAction: 'none',
            } as React.CSSProperties}
        >
            <div className="resize-handle resize-handle-top" />
            <div className="appointment-time mt-2">
                { formatTime(format(appointment.startAt, 'HH:mm'))} - {formatTime(format(appointment.endAt, 'HH:mm')) }
            </div>
            <div className="appointment-name"> { appointment.name } </div>
            { height > 40 && appointment.users.length > 0 &&
                <div className="appointment-employees">
                    { appointment.users.map(user => <span key={user.id} className="employee-chip"> { user.user.firstName } { user.user.lastName } </span> )}
                </div>
            }
            <div className="resize-handle resize-handle-bottom" />
        </div>
    );
});

export default AppointmentBlock;