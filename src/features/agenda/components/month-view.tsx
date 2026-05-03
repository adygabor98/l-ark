import {
	useEffect,
	useMemo,
	type Dispatch,
	type ReactElement,
	type SetStateAction
} from 'react';
import {
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	addDays,
	isSameMonth,
	isToday,
	format
} from 'date-fns';
import {
	toDateString
} from '../utils/agenda.utils';
import {
	useAgenda
} from '../../../server/hooks/useAgenda';
import {
	AgendaViewMode
} from '../../../constants';
import type {
	Appointment
} from '@l-ark/types';


interface PropTypes {
	currentDate: Date;

	setCurrentDate: Dispatch<SetStateAction<Date>>;
	setOpen: Dispatch<SetStateAction<number | null | { date: string, startTime: string, endTime: string }>>;
	setViewMode: Dispatch<SetStateAction<AgendaViewMode>>;
}

export const MonthView = (props: PropTypes): ReactElement => {
	/** Retrieve component properties */
	const { currentDate, setCurrentDate, setOpen, setViewMode } = props;
	/** Agenda api utilities */
	const { appointments, retrieveAppointments } = useAgenda();
	/** Compute weeks information */
	const weeks = useMemo((): Date[][] => {
		const monthStart = startOfMonth(currentDate);
		const monthEnd = endOfMonth(currentDate);
		const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

		const result: Date[][] = [];
		let day = calStart;
		let week: Date[] = [];

		while (day <= calEnd) {
			week.push(day);
			if ( week.length === 7 ) {
				result.push(week);
				week = [];
			}
			day = addDays(day, 1);
		}
		return result;
	}, [currentDate]);
	/** Compute appointments per day */
	const appointmentMap = useMemo((): Map<string, Appointment[]> => {
		const map = new Map<string, Appointment[]>();
		for (const a of appointments) {
			const existing = map.get(format(a.startAt, 'yyyy-MM-dd')) ?? [];
			existing.push(a);
			map.set(format(a.startAt, 'yyyy-MM-dd'), existing);
		}
		return map;
	}, [appointments]);

	useEffect(() => {
	  	retrieveAppointments({ date: currentDate, type: 'MONTH'});
	}, [currentDate])

	/** Manage the click of a specific day */
	const handleDayClick = (day: Date): void => {
		setCurrentDate(day);
		setViewMode(AgendaViewMode.WEEK);
	};

	return (
		<div className="month-view">
			<div className="month-header-row">
				{ ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
					<div key={d} className="month-header-cell"> { d } </div>
				))}
			</div>

			{ weeks.map((week, wi) => (
				<div key={wi} className="month-week-row">
					{ week.map((day) => {
						const dateStr = toDateString(day);
						const dayAppts = appointmentMap.get(dateStr) ?? [];
						const inMonth = isSameMonth(day, currentDate);
						const today = isToday(day);

						return (
							<div key={dateStr} className={`month-day-cell ${!inMonth ? 'outside' : ''} ${today ? 'is-today' : ''}`} style={{ '--accent': 'dimgray' } as React.CSSProperties} onClick={() => handleDayClick(day)}>
								<div className={`month-day-number ${today ? 'today-badge' : ''}`}>
									{ format(day, 'd') }
								</div>
								<div className="month-day-events">
									{ dayAppts.slice(0, 3).map(appt => (
										<div key={appt.id} className="month-event-chip flex gap-3!"  onClick={(e) => { e.stopPropagation(); setOpen(appt.id); }}>
											<span className="event-dot" />
											<div className='flex flex-col'>
												<span className="event-time"> { format(appt.startAt, 'HH:mm') } </span>
												<span className="event-time"> { format(appt.endAt, 'HH:mm') } </span>
											</div>
											<div className='flex flex-col'>
												<span className="event-label font-[Lato-Bold]"> { appt.name } </span>
												<span className="event-label font-[Lato-Light]"> { appt.description } </span>
											</div>
										</div>
									))}
									{ dayAppts.length > 3 && <div className="month-more"> +{ dayAppts.length - 3 } more </div> }
								</div>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
};
