export interface Employee {
  id: string;
  name: string;
  color: string;
}

export interface Appointment {
  id: string;
  name: string;
  description: string;
  employeeIds: string[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export type ViewMode = 'week' | 'month';
