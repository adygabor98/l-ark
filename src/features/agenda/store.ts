import { create } from 'zustand';
import type { Appointment, ViewMode } from './types';
import { createMockAppointments } from './mock-data';
import { uid } from './utils';

interface AgendaState {
	appointments: Appointment[];
	viewMode: ViewMode;
	currentDate: Date;
	selectedAppointment: Appointment | null;
	modalOpen: boolean;

	setViewMode: (mode: ViewMode) => void;
	setCurrentDate: (date: Date) => void;
	navigateWeek: (dir: 1 | -1) => void;
	navigateMonth: (dir: 1 | -1) => void;
	goToToday: () => void;

	addAppointment: (data: Omit<Appointment, 'id'>) => void;
	updateAppointment: (id: string, data: Partial<Omit<Appointment, 'id'>>) => void;
	deleteAppointment: (id: string) => void;
	moveAppointment: (id: string, newDate: string, newStartTime: string, newEndTime: string) => void;

	openModal: (appointment?: Appointment) => void;
	closeModal: () => void;
}

export const useAgendaStore = create<AgendaState>((set) => ({
	appointments: createMockAppointments(),
	viewMode: 'week',
	currentDate: new Date(),
	selectedAppointment: null,
	modalOpen: false,

	setViewMode: (mode) => set({ viewMode: mode }),

	setCurrentDate: (date) => set({ currentDate: date }),

	navigateWeek: (dir) =>
		set((s) => {
			const d = new Date(s.currentDate);
			d.setDate(d.getDate() + dir * 7);
			return { currentDate: d };
		}),

	navigateMonth: (dir) =>
		set((s) => {
			const d = new Date(s.currentDate);
			d.setMonth(d.getMonth() + dir);
			return { currentDate: d };
		}),

	goToToday: () => set({ currentDate: new Date() }),

	openModal: (appointment) => set({ modalOpen: true, selectedAppointment: appointment ?? null }),
	closeModal: () => set({ modalOpen: false, selectedAppointment: null }),

	//! TO-DO
	addAppointment: (data) =>
		set((s) => ({
			appointments: [...s.appointments, { ...data, id: uid() }],
		})),

	updateAppointment: (id, data) =>
		set((s) => ({
			appointments: s.appointments.map((a) =>
				a.id === id ? { ...a, ...data } : a
			),
		})),

	deleteAppointment: (id) =>
		set((s) => ({
			appointments: s.appointments.filter((a) => a.id !== id),
		})),

	moveAppointment: (id, newDate, newStartTime, newEndTime) =>
		set((s) => ({
			appointments: s.appointments.map((a) =>
				a.id === id
					? { ...a, date: newDate, startTime: newStartTime, endTime: newEndTime }
					: a
			),
		}))
}));
