import type { User } from '../types';

// ── Users (for demo/testing the "Viewing as" switcher) ──────
export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Carlos Martínez', email: 'carlos.martinez@company.com', roleId: 'dg' },
  { id: 'user-2', name: 'Ana García', email: 'ana.garcia@company.com', roleId: 'sub_dg' },
  { id: 'user-3', name: 'María López', email: 'maria.lopez@company.com', roleId: 'dg_fin' },
  { id: 'user-4', name: 'Pedro Sánchez', email: 'pedro.sanchez@company.com', roleId: 'dg_immo' },
  { id: 'user-5', name: 'Laura Fernández', email: 'laura.fernandez@company.com', roleId: 'coord' },
  { id: 'user-6', name: 'Javier Ruiz', email: 'javier.ruiz@company.com', roleId: 'coord_fin' },
  { id: 'user-7', name: 'Isabel Torres', email: 'isabel.torres@company.com', roleId: 'commerciales' },
  { id: 'user-8', name: 'Miguel Navarro', email: 'miguel.navarro@company.com' },
];
