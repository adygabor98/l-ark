import {
	useMemo,
	useCallback,
	useRef,
	type ReactElement,
	useEffect,
	type Dispatch,
	type SetStateAction
} from 'react';
import {
	startOfWeek,
	addDays,
	format,
	isToday,
	isSameDay,
	parse,
	parseISO,
} from 'date-fns';
import {
	HOUR_HEIGHT,
	HOURS,
	layoutAppointments,
	minutesToTime,
	toDateString
} from '../utils/agenda.utils';
import {
	useAgenda
} from '../../../server/hooks/useAgenda';
import type {
	ApiResponse,
	Appointment
} from '@l-ark/types';
import type {
	FetchResult
} from '@apollo/client';
import {
	getResponseMessage
} from '../../../server/hooks/useApolloWithToast';
import {
	useToast
} from '../../../shared/hooks/useToast';
import AppointmentBlock from './appointment-block';
import CurrentTimeIndicator from './current-time-indicator';

interface PropTypes {
	currentDate: Date;

	setOpen: Dispatch<SetStateAction<number | null | { date: string, startTime: string, endTime: string }>>;
}

export const WeekView = (props: PropTypes): ReactElement => {
	/*+ Retrieve component properties */
	const { currentDate, setOpen } = props;
	/** Agenda api utilities */
	const { appointments, retrieveAppointments, updateAppointment } = useAgenda();
	/** Toast utilities */
	const { onToast } = useToast();
	/** reference of the html elements */
	const weekViewRef = useRef<HTMLDivElement>(null);
	/** Calculate the start of the week */
	const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
	/** Compute the days */
	const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
	/** Retrieve appointments per day */
	const appointmentsByDay = useMemo(() => {
		const map = new Map<string, Appointment[]>();
		for (const day of days) {
			const key = new Date(day);
			map.set(format(key, 'yyyy-MM-dd'), appointments.filter(appointment => isSameDay(appointment.startAt, key) ));
		}

		return map;
	}, [days, appointments]);
	/** Compute the layout of the appointments per day */
	const layoutByDay = useMemo(() => {
		const map = new Map<string, ReturnType<typeof layoutAppointments>>();
		for (const [dateStr, appts] of appointmentsByDay) {
			map.set(dateStr, layoutAppointments(appts));
		}

		return map;
	}, [appointmentsByDay]);

	useEffect(() => {
		retrieveAppointments({ date: weekStart, type: 'WEEK' });
	}, [weekStart]);

	/** Manage the cell click */
	const handleCellClick = useCallback((day: Date, hour: number, quarter: number) => {
		const startMinutes = hour * 60 + quarter * 15;
		const endMinutes = startMinutes + 60;

		setOpen({ date: format(day, 'yyyy-MM-dd'), startTime: minutesToTime(startMinutes), endTime: minutesToTime(endMinutes)});
	}, [setOpen]);

	/** Manage to edit an appointment */
	const handleEdit = useCallback((appointment: Appointment) => setOpen(appointment.id), [setOpen]);

	/** Manage to handle the change of the schedule of an appointment */
	const handleMoveEnd = useCallback(async (id: string, newDate: string, newStart: string, newEnd: string): Promise<void> => {
		try {
			const response: FetchResult<{ data: ApiResponse }> = await updateAppointment({
				id: parseInt(id),
				input: {
					startAt: parse(`${newDate} ${newStart}`, "yyyy-MM-dd HH:mm", new Date()),
					endAt: parse(`${newDate} ${newEnd}`, "yyyy-MM-dd HH:mm", new Date())
				}
			});
			onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
		} catch ( e: any ) {
			console.error(e);
		}
	}, []);

	/** Manage the resize of an appointment */
	const handleResizeEnd = useCallback(async (id: string, newStart: string, newEnd: string): Promise<void> => {
		const appt = appointments.find((a) => a.id.toString() === id);
		if ( !appt ) return;
		const localDate = format(parseISO(appt.startAt as unknown as string), "yyyy-MM-dd");

		try {
			const response: FetchResult<{ data: ApiResponse }> = await updateAppointment({
				id: parseInt(id),
				input: {
					startAt: parse(`${localDate} ${newStart}`, "yyyy-MM-dd HH:mm", new Date()),
					endAt: parse(`${localDate} ${newEnd}`, "yyyy-MM-dd HH:mm", new Date())
				}
			});
			onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
		} catch ( e: any ) {
			console.error(e);
		}
	}, [appointments]);

	return (
		<div className="week-view" ref={weekViewRef}>
			<div className="time-gutter">
				<div className="gutter-header" />
				{ HOURS.map(h => (
					<div key={h} className="gutter-hour" style={{ height: `${HOUR_HEIGHT}px` }}>
						<span> { format(new Date(2000, 0, 1, h), 'h a') } </span>
					</div>
				))}
			</div>

			{/* Day columns */}
			{ days.map((day) => {
				const dateStr = toDateString(day);
				const dayLayout = layoutByDay.get(dateStr) ?? [];
				const today = isToday(day);

				return (
					<div key={dateStr} className={`week-day-column ${today ? 'is-today' : ''}`}>
						<div className="day-header">
							<span className="day-name"> { format(day, 'EEE') } </span>
							<span className={`day-number ${today ? 'today-badge' : ''}`}> { format(day, 'd') } </span>
						</div>

						<div className="day-slots">
							{ HOURS.map(h => (
								<div key={h} className="hour-slot" style={{ height: `${HOUR_HEIGHT}px` }}>
									{ [0, 1, 2, 3].map((q) => (
										<div key={q} className="quarter-slot" onClick={() => handleCellClick(day, h, q)} />
									))}
								</div>
							))}

							{ dayLayout.map(({ appointment: appt, column: col, totalColumns: total }) => (
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

							{ today && <CurrentTimeIndicator /> }
						</div>
					</div>
				);
			})}
		</div>
	);
};