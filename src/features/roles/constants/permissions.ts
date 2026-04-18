import type {
	Permission,
	Resource
} from '../types';

const p = (resource: Resource, action: string, label: string, description: string): Permission => {
	return { key: `${resource}.${action}`, label, description, resource, action: action as Permission['action']};
}

export const RESOURCE_LABELS: Record<Resource, string> = {
	activity_log: 'Activity Log',
	roles_permissions: 'Roles & Permissions',
	users: 'Users',
	offices: 'Offices',
	divisions: 'Divisions',
	templates: 'Templates',
	operations: 'Operations',
	agenda: 'Agenda',
};

export const PERMISSIONS: Permission[] = [
	// Activity Log (1)
	p('activity_log', 'view', 'View', 'View the system activity log with all recorded actions'),

	// Roles & Permissions (2)
	p('roles_permissions', 'view', 'View', 'View the Roles & Permissions management page'),
	p('roles_permissions', 'edit', 'Edit', 'Modify role definitions and toggle permissions on/off'),

	// Users (5)
	p('users', 'view', 'View', 'View the user list and their details within assigned offices'),
	p('users', 'create', 'Create', 'Create new user accounts in the system'),
	p('users', 'edit', 'Edit', 'Edit user information and assign roles/offices'),
	p('users', 'soft_delete', 'Soft Delete & Restore', 'Deactivate and restore users (recoverable deletion)'),
	p('users', 'permanent_delete', 'Permanent Delete', 'Permanently remove users from the system (irreversible)'),

	// Offices (5)
	p('offices', 'view', 'View', 'View office information and their assigned divisions'),
	p('offices', 'create', 'Create', 'Create new offices in the system'),
	p('offices', 'edit', 'Edit', 'Edit office details, managers and division assignments'),
	p('offices', 'soft_delete', 'Soft Delete & Restore', 'Deactivate and restore offices (recoverable deletion)'),
	p('offices', 'permanent_delete', 'Permanent Delete', 'Permanently remove offices from the system (irreversible)'),

	// Divisions (5)
	p('divisions', 'view', 'View', 'View division information filtered by division type'),
	p('divisions', 'create', 'Create', 'Create new division types in the system'),
	p('divisions', 'edit', 'Edit', 'Edit division details and configuration'),
	p('divisions', 'soft_delete', 'Soft Delete & Restore', 'Deactivate and restore divisions (recoverable deletion)'),
	p('divisions', 'permanent_delete', 'Permanent Delete', 'Permanently remove divisions from the system (irreversible)'),

	// Templates (5)
	p('templates', 'view', 'View', 'View templates associated with specific division types'),
	p('templates', 'create', 'Create', 'Create new templates in the system'),
	p('templates', 'edit', 'Edit', 'Edit template content and configuration'),
	p('templates', 'soft_delete', 'Soft Delete & Restore', 'Deactivate and restore templates (recoverable deletion)'),
	p('templates', 'permanent_delete', 'Permanent Delete', 'Permanently remove templates from the system (irreversible)'),

	// Operations (5)
	p('operations', 'view', 'View', 'View operations within assigned offices and divisions'),
	p('operations', 'create', 'Create', 'Create new operations in assigned offices and divisions'),
	p('operations', 'edit', 'Edit', 'Edit operation details and data'),
	p('operations', 'soft_delete', 'Soft Delete & Restore', 'Deactivate and restore operations (recoverable deletion)'),
	p('operations', 'permanent_delete', 'Permanent Delete', 'Permanently remove operations from the system (irreversible)'),

	// Agenda (3)
	p('agenda', 'view_all', 'View All', 'View the full agenda of the entire organisation'),
	p('agenda', 'view_mine_and_sub', 'View Mine & Sub', 'View your own entries and those of all persons below you'),
	p('agenda', 'view_mine', 'View Mine', 'View only your own agenda entries'),
];

export const PERMISSIONS_MAP = new Map(PERMISSIONS.map((p) => [p.key, p]));

export const getPermissionsByResource = (resource: Resource): Permission[] => PERMISSIONS.filter((p) => p.resource === resource);

export const RESOURCES: Resource[] = [
	'activity_log',
	'roles_permissions',
	'users',
	'offices',
	'divisions',
	'templates',
	'operations',
	'agenda',
];
