import type {
	Appointment
} from "@l-ark/types";
import {
	format
} from "date-fns";

export const HOUR_HEIGHT = 60;

export const QUARTER_HEIGHT = HOUR_HEIGHT / 4;

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export type InteractionMode = 'idle' | 'move' | 'resize-top' | 'resize-bottom';

export const DRAG_THRESHOLD = 4;

export const OVERLAP_GAP = 2;

/** Snap minutes to nearest 15-min quarter */
export const snapToQuarter = (minutes: number): number => {
	return Math.round(minutes / 15) * 15;
}

/** Convert "HH:mm" to total minutes from midnight */
export const timeToMinutes = (time: string): number => {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

/** Convert total minutes to "HH:mm" */
export const minutesToTime = (minutes: number): string => {
	const clamped = Math.max(0, Math.min(1440, minutes));
	const h = Math.floor(clamped / 60);
	const m = clamped % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format time for display — e.g. "8:15" */
export const formatTime = (time: string): string => {
	const [h, m] = time.split(':');
	return `${parseInt(h)}:${m}`;
}

/** Generate a simple unique id */
export const uid = (): string => {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Get top-offset percentage for a time within a day (1440 min) */
export const timeToPercent = (time: string): number => {
	return (timeToMinutes(time) / 1440) * 100;
}

/** Get height percentage for a duration */
export const durationToPercent = (start: string, end: string): number => {
	return ((timeToMinutes(end) - timeToMinutes(start)) / 1440) * 100;
}

/** Snap a time string to nearest quarter */
export const snapTime = (time: string): string => {
	const mins = timeToMinutes(time);
	return minutesToTime(snapToQuarter(mins));
}

/** Format date to YYYY-MM-DD */
export const toDateString = (date: Date): string => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export interface LayoutedAppointment {
	appointment: Appointment;
	/** 0-based column index within its overlap cluster */
	column: number;
	/** Total columns in this cluster (1 = no overlap) */
	totalColumns: number;
}

/**
 * Group appointments into clusters where any transitive time overlap
 * connects them. Uses a sweep-line on sorted start times.
 */
const buildOverlapClusters = (appointments: Appointment[]): Appointment[][] => {
	if ( appointments.length === 0 ) return [];

	const sorted = [...appointments].sort((a, b) => {
		const aStartTime = format(a.startAt, 'HH:mm');
		const bStartTime = format(b.startAt, 'HH:mm');
		const diff = timeToMinutes(aStartTime) - timeToMinutes(bStartTime);
		if ( diff !== 0 ) return diff;
		const aEndTime = format(a.endAt, 'HH:mm');
		const bEndTime = format(b.endAt, 'HH:mm');
		return timeToMinutes(bEndTime) - timeToMinutes(aEndTime);
	});

	const clusters: Appointment[][] = [];
	let current: Appointment[] = [sorted[0]];
	const endTimeInitial = format(sorted[0].endAt, 'HH:mm');
	let maxEnd = timeToMinutes(endTimeInitial);

	for (let i = 1; i < sorted.length; i++) {
		const appt = sorted[i];
		const startTimeApointment = format(appt.startAt, 'HH:mm');
		const endTimeAppointment = format(appt.endAt, 'HH:mm');
		const start = timeToMinutes(startTimeApointment);

		if ( start < maxEnd ) {
			current.push(appt);
			maxEnd = Math.max(maxEnd, timeToMinutes(endTimeAppointment));
		} else {
			clusters.push(current);
			current = [appt];
			maxEnd = timeToMinutes(endTimeAppointment);
		}
	}
	clusters.push(current);

	return clusters;
}

/**
 * Greedy column assignment: give each appointment the lowest column
 * index not occupied by any still-active (not yet ended) appointment.
 */
const assignColumns = (cluster: Appointment[]): LayoutedAppointment[] => {
	const assignments: { appointment: Appointment; column: number; endMin: number }[] = [];

	for (const appt of cluster) {
		const startMin = timeToMinutes(format(appt.startAt, 'HH:mm'));

		const occupied = new Set<number>();
		for (const prev of assignments) {
			if (prev.endMin > startMin) {
				occupied.add(prev.column);
			}
		}

		let col = 0;
		while (occupied.has(col)) col++;

		assignments.push({ appointment: appt, column: col, endMin: timeToMinutes(format(appt.endAt, 'HH:mm')) });
	}

	const totalColumns = Math.max(...assignments.map((a) => a.column)) + 1;

	return assignments.map(({ appointment, column }) => ({
		appointment,
		column,
		totalColumns,
	}));
}

/**
 * Compute side-by-side layout positions for a day's appointments.
 * Non-overlapping appointments get column=0, totalColumns=1.
 */
export const layoutAppointments = (appointments: Appointment[]): LayoutedAppointment[] => {
	const clusters = buildOverlapClusters(appointments);
	const result: LayoutedAppointment[] = [];

	for (const cluster of clusters) {
		if (cluster.length === 1) {
			result.push({ appointment: cluster[0], column: 0, totalColumns: 1 });
		} else {
			result.push(...assignColumns(cluster));
		}
	}

	return result;
}

/** Find which day column + minute offset the pointer is over */
export const resolvePointerPosition = (clientX: number, clientY: number, weekViewEl: HTMLElement): { dayIndex: number; minutes: number } | null => {
	const columns = weekViewEl.querySelectorAll('.week-day-column');
	for (let i = 0; i < columns.length; i++) {
		const col = columns[i];
		const rect = col.getBoundingClientRect();

		if ( clientX >= rect.left && clientX <= rect.right ) {
			const slotsEl = col.querySelector('.day-slots');
			if ( !slotsEl ) return null;
			const slotsRect = slotsEl.getBoundingClientRect();
			const y = clientY - slotsRect.top;
			const minutes = (y / (24 * HOUR_HEIGHT)) * 1440;

			return { dayIndex: i, minutes };
		}
	}
	return null;
}