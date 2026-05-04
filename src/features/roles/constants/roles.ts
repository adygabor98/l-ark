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
			activity_log:      { view: true },
			roles_permissions: { view: true, edit: true },
			users:             { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			offices:           { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			divisions:         { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			templates:         { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			operations:        { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			agenda:            { view_all: true, view_mine_and_sub: false, view_mine: false },
		},
	},
	{
		id: UserRole.DIR,
		name: 'Director',
		shortName: 'Dir',
		description: 'Full access to users, offices, divisions, templates and operations within assigned divisions. Agenda shows all persons below (entire office).',
		permissions: {
			activity_log:      { view: false },
			roles_permissions: { view: false, edit: false },
			users:             { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			offices:           { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			divisions:         { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			templates:         { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			operations:        { view: true, create: true, edit: true, soft_delete: true, permanent_delete: true },
			agenda:            { view_all: false, view_mine_and_sub: true, view_mine: false },
		},
	},
	{
		id: UserRole.ADM,
		name: 'Administratiu/va',
		shortName: 'Adm',
		description: 'Administrative role. Manages users, offices, divisions; view-only templates. No operations, no activity log, no roles management. Agenda includes subordinate Comercials.',
		permissions: {
			activity_log:      { view: false },
			roles_permissions: { view: false, edit: false },
			users:             { view: true, create: true, edit: true, soft_delete: true, permanent_delete: false },
			offices:           { view: true, create: true, edit: true, soft_delete: true, permanent_delete: false },
			divisions:         { view: true, create: true, edit: true, soft_delete: true, permanent_delete: false },
			templates:         { view: true, create: false, edit: false, soft_delete: false, permanent_delete: false },
			operations:        { view: false, create: false, edit: false, soft_delete: false, permanent_delete: false },
			agenda:            { view_all: false, view_mine_and_sub: true, view_mine: false },
		},
	},
	{
		id: UserRole.C,
		name: 'Comercials',
		shortName: 'Com',
		description: 'Field worker role. Can create and view own OTHER-type operations. Agenda shows only own entries.',
		permissions: {
			activity_log:      { view: false },
			roles_permissions: { view: false, edit: false },
			users:             { view: false, create: false, edit: false, soft_delete: false, permanent_delete: false },
			offices:           { view: false, create: false, edit: false, soft_delete: false, permanent_delete: false },
			divisions:         { view: false, create: false, edit: false, soft_delete: false, permanent_delete: false },
			templates:         { view: false, create: false, edit: false, soft_delete: false, permanent_delete: false },
			operations:        { view: true, create: true, edit: false, soft_delete: false, permanent_delete: false },
			agenda:            { view_all: false, view_mine_and_sub: false, view_mine: true },
		},
	},
];

export const ROLES_MAP = new Map(ROLES.map((r) => [r.id, r]));
