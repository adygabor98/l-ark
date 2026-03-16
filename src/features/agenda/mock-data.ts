import type { Employee, Appointment } from './types';
import { toDateString } from './utils';

export const EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Alice Johnson', color: '#6366f1' },
  { id: 'emp2', name: 'Bob Smith', color: '#f59e0b' },
  { id: 'emp3', name: 'Carol White', color: '#10b981' },
  { id: 'emp4', name: 'David Brown', color: '#ef4444' },
  { id: 'emp5', name: 'Eva Martinez', color: '#8b5cf6' },
];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function createMockAppointments(): Appointment[] {
  const today = new Date();
  const monday = getMonday(today);

  return [
    {
      id: 'mock1',
      name: 'Sprint Planning',
      description: 'Bi-weekly sprint planning session for Q1 deliverables',
      employeeIds: ['emp1', 'emp2', 'emp3'],
      date: toDateString(monday),
      startTime: '09:00',
      endTime: '10:30',
    },
    {
      id: 'mock2',
      name: 'Design Review',
      description: 'Review new UI mockups for the dashboard',
      employeeIds: ['emp1', 'emp4'],
      date: toDateString(monday),
      startTime: '14:00',
      endTime: '15:00',
    },
    {
      id: 'mock3',
      name: 'Team Standup',
      description: 'Daily standup — progress updates and blockers',
      employeeIds: ['emp1', 'emp2', 'emp3', 'emp4', 'emp5'],
      date: toDateString(addDays(monday, 1)),
      startTime: '09:00',
      endTime: '09:15',
    },
    {
      id: 'mock4',
      name: 'Client Call',
      description: 'Quarterly review call with ACME Corp',
      employeeIds: ['emp2', 'emp5'],
      date: toDateString(addDays(monday, 1)),
      startTime: '11:00',
      endTime: '12:00',
    },
    {
      id: 'mock5',
      name: '1:1 with Manager',
      description: 'Performance check-in and goal setting',
      employeeIds: ['emp3'],
      date: toDateString(addDays(monday, 2)),
      startTime: '10:00',
      endTime: '10:45',
    },
    {
      id: 'mock6',
      name: 'Workshop: React Patterns',
      description: 'Internal workshop on advanced React patterns',
      employeeIds: ['emp1', 'emp2', 'emp4'],
      date: toDateString(addDays(monday, 2)),
      startTime: '14:00',
      endTime: '16:00',
    },
    {
      id: 'mock7',
      name: 'Lunch & Learn',
      description: 'Presentation on new CI/CD pipeline improvements',
      employeeIds: ['emp1', 'emp3', 'emp5'],
      date: toDateString(addDays(monday, 3)),
      startTime: '12:00',
      endTime: '13:00',
    },
    {
      id: 'mock8',
      name: 'Code Review Session',
      description: 'Review PRs for the payment module',
      employeeIds: ['emp2', 'emp4'],
      date: toDateString(addDays(monday, 3)),
      startTime: '15:30',
      endTime: '16:30',
    },
    {
      id: 'mock9',
      name: 'Retrospective',
      description: 'Sprint retrospective — what went well and improvements',
      employeeIds: ['emp1', 'emp2', 'emp3', 'emp4', 'emp5'],
      date: toDateString(addDays(monday, 4)),
      startTime: '16:00',
      endTime: '17:00',
    },
    {
      id: 'mock10',
      name: 'Early Morning Sync',
      description: 'Quick sync with the overseas team',
      employeeIds: ['emp1', 'emp5'],
      date: toDateString(addDays(monday, 4)),
      startTime: '07:30',
      endTime: '08:00',
    },
  ];
}
