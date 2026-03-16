import type { Permission, Resource, ScopeType } from '../types';

// ── Helper to build permission objects ──────────────────────
function p(
  resource: Resource,
  action: string,
  label: string,
  description: string,
  scopeType: ScopeType,
): Permission {
  return {
    key: `${resource}.${action}`,
    label,
    description,
    resource,
    action: action as Permission['action'],
    scopeType,
  };
}

// ── Resource display labels ─────────────────────────────────
export const RESOURCE_LABELS: Record<Resource, string> = {
  activity_log: 'Activity Log',
  roles_permissions: 'Roles & Permissions',
  users: 'Users',
  offices: 'Offices',
  divisions: 'Divisions',
  templates: 'Templates',
  operations: 'Operations',
};

// ── All 29 permissions, grouped by resource ─────────────────
export const PERMISSIONS: Permission[] = [
  // Activity Log (1)
  p('activity_log', 'view', 'View', 'View the system activity log with all recorded actions', 'global'),

  // Roles & Permissions (2)
  p('roles_permissions', 'view', 'View', 'View the Roles & Permissions management page', 'global'),
  p('roles_permissions', 'edit', 'Edit', 'Modify role definitions and toggle permissions on/off', 'global'),

  // Users (5)
  p('users', 'view', 'View', 'View the user list and their details within assigned offices', 'office'),
  p('users', 'create', 'Create', 'Create new user accounts in the system', 'global'),
  p('users', 'edit', 'Edit', 'Edit user information and assign roles/offices', 'office'),
  p('users', 'soft_delete', 'Soft Delete', 'Deactivate users (recoverable deletion)', 'office'),
  p('users', 'permanent_delete', 'Permanent Delete', 'Permanently remove users from the system (irreversible)', 'office'),

  // Offices (5)
  p('offices', 'view', 'View', 'View office information and their assigned divisions', 'office'),
  p('offices', 'create', 'Create', 'Create new offices in the system', 'global'),
  p('offices', 'edit', 'Edit', 'Edit office details, managers and division assignments', 'office'),
  p('offices', 'soft_delete', 'Soft Delete', 'Deactivate offices (recoverable deletion)', 'office'),
  p('offices', 'permanent_delete', 'Permanent Delete', 'Permanently remove offices from the system (irreversible)', 'office'),

  // Divisions (5)
  p('divisions', 'view', 'View', 'View division information filtered by division type', 'division'),
  p('divisions', 'create', 'Create', 'Create new division types in the system', 'global'),
  p('divisions', 'edit', 'Edit', 'Edit division details and configuration', 'division'),
  p('divisions', 'soft_delete', 'Soft Delete', 'Deactivate divisions (recoverable deletion)', 'division'),
  p('divisions', 'permanent_delete', 'Permanent Delete', 'Permanently remove divisions from the system (irreversible)', 'division'),

  // Templates (5)
  p('templates', 'view', 'View', 'View templates associated with specific division types', 'division'),
  p('templates', 'create', 'Create', 'Create new templates in the system', 'global'),
  p('templates', 'edit', 'Edit', 'Edit template content and configuration', 'division'),
  p('templates', 'soft_delete', 'Soft Delete', 'Deactivate templates (recoverable deletion)', 'division'),
  p('templates', 'permanent_delete', 'Permanent Delete', 'Permanently remove templates from the system (irreversible)', 'division'),

  // Operations (6)
  p('operations', 'view', 'View', 'View operations within assigned offices and divisions', 'office_division'),
  p('operations', 'create', 'Create', 'Create new operations in assigned offices and divisions', 'office_division'),
  p('operations', 'edit', 'Edit', 'Edit operation details and data', 'office_division'),
  p('operations', 'complete', 'Complete', 'Mark operations as completed or update their status', 'office_division'),
  p('operations', 'soft_delete', 'Soft Delete', 'Deactivate operations (recoverable deletion)', 'office_division'),
  p('operations', 'permanent_delete', 'Permanent Delete', 'Permanently remove operations from the system (irreversible)', 'office_division'),
];

// ── Lookup helpers ──────────────────────────────────────────
export const PERMISSIONS_MAP = new Map(PERMISSIONS.map((p) => [p.key, p]));

export function getPermissionsByResource(resource: Resource): Permission[] {
  return PERMISSIONS.filter((p) => p.resource === resource);
}

export const RESOURCES: Resource[] = [
  'activity_log',
  'roles_permissions',
  'users',
  'offices',
  'divisions',
  'templates',
  'operations',
];
