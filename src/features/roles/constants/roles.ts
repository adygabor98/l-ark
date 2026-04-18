import type {
	Role
} from '../types';
import {
	UserRole
} from '@l-ark/types';

export const ROLES: Role[] = [
	{
		id: UserRole.DG,
		name: 'Director General',
		shortName: 'DG',
		description: 'Full access to the entire system: offices, divisions, users, templates, roles, operations, activity log and agenda. All actions including permanent deletion.',
		permissions: {
			activity_log: { view: true },
			roles_permissions: { view: true, edit: true },
			users: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			offices: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			divisions: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			templates: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			operations: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			agenda: { view_all: true, view_mine: false, view_mine_and_sub: false },
		},
	},
	{
		id: UserRole.DIR,
		name: 'Director',
		shortName: 'Dir',
		description: 'Full access to users, offices, divisions, templates and operations within assigned divisions. Agenda shows all persons below (entire office).',
		permissions: {
			users: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			offices: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			divisions: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			templates: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			operations: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			agenda: { view_all: false, view_mine: false, view_mine_and_sub: true },
		},
	},
	{
		id: UserRole.ADM,
		name: 'Administratiu/va',
		shortName: 'Adm',
		description: 'Administrative role. Manages users, offices, divisions and templates. No access to operations, activity log or roles & permissions. Agenda scoped to assigned office.',
		permissions: {
			users: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			offices: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			divisions: { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			templates: { view: true },
			agenda: { view_all: false, view_mine: false, view_mine_and_sub: true },
		},
	},
	{
		id: UserRole.C,
		name: 'Comercials',
		shortName: 'Com',
		description: 'Basic employee role. Can view and complete operations in assigned offices. Agenda shows only own entries.',
		permissions: {
			operations: { view: true },
			agenda: { view_all: false, view_mine: true, view_mine_and_sub: false },
		},
	},
];

export const ROLES_MAP = new Map(ROLES.map((r) => [r.id, r]));
