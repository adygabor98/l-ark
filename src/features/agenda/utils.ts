
/** Snap minutes to nearest 15-min quarter */
export function snapToQuarter(minutes: number): number {
	return Math.round(minutes / 15) * 15;
}

/** Convert "HH:mm" to total minutes from midnight */
export function timeToMinutes(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
}

/** Convert total minutes to "HH:mm" */
export function minutesToTime(minutes: number): string {
	const clamped = Math.max(0, Math.min(1440, minutes));
	const h = Math.floor(clamped / 60);
	const m = clamped % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format time for display — e.g. "8:15" */
export function formatTime(time: string): string {
	const [h, m] = time.split(':');
	return `${parseInt(h)}:${m}`;
}

/** Generate a simple unique id */
export function uid(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Get top-offset percentage for a time within a day (1440 min) */
export function timeToPercent(time: string): number {
	return (timeToMinutes(time) / 1440) * 100;
}

/** Get height percentage for a duration */
export function durationToPercent(start: string, end: string): number {
	return ((timeToMinutes(end) - timeToMinutes(start)) / 1440) * 100;
}

/** Snap a time string to nearest quarter */
export function snapTime(time: string): string {
	const mins = timeToMinutes(time);
	return minutesToTime(snapToQuarter(mins));
}

/** Format date to YYYY-MM-DD */
export function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/* ===== Overlap layout ===== */

import type { Appointment } from './types';

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
function buildOverlapClusters(appointments: Appointment[]): Appointment[][] {
	if ( appointments.length === 0 ) return [];

	const sorted = [...appointments].sort((a, b) => {
		const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
		if ( diff !== 0 ) return diff;
		return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
	});

	const clusters: Appointment[][] = [];
	let current: Appointment[] = [sorted[0]];
	let maxEnd = timeToMinutes(sorted[0].endTime);

	for (let i = 1; i < sorted.length; i++) {
		const appt = sorted[i];
		const start = timeToMinutes(appt.startTime);

		if ( start < maxEnd ) {
			current.push(appt);
			maxEnd = Math.max(maxEnd, timeToMinutes(appt.endTime));
		} else {
			clusters.push(current);
			current = [appt];
			maxEnd = timeToMinutes(appt.endTime);
		}
	}
	clusters.push(current);

	return clusters;
}

/**
 * Greedy column assignment: give each appointment the lowest column
 * index not occupied by any still-active (not yet ended) appointment.
 */
function assignColumns(cluster: Appointment[]): LayoutedAppointment[] {
	const assignments: { appointment: Appointment; column: number; endMin: number }[] = [];

	for (const appt of cluster) {
		const startMin = timeToMinutes(appt.startTime);

		const occupied = new Set<number>();
		for (const prev of assignments) {
			if (prev.endMin > startMin) {
				occupied.add(prev.column);
			}
		}

		let col = 0;
		while (occupied.has(col)) col++;

		assignments.push({ appointment: appt, column: col, endMin: timeToMinutes(appt.endTime) });
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
export function layoutAppointments(appointments: Appointment[]): LayoutedAppointment[] {
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
