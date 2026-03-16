// ── Scope types ──────────────────────────────────────────────
export type ScopeType = 'global' | 'office' | 'division' | 'office_division';

export type Resource =
  | 'activity_log'
  | 'roles_permissions'
  | 'users'
  | 'offices'
  | 'divisions'
  | 'templates'
  | 'operations';

export type Action =
  | 'view'
  | 'create'
  | 'edit'
  | 'soft_delete'
  | 'permanent_delete'
  | 'complete';

// ── Permission definition ───────────────────────────────────
export interface Permission {
  key: string;           // e.g. 'users.view'
  label: string;         // e.g. 'View'
  description: string;   // e.g. 'View users list and details'
  resource: Resource;
  action: Action;
  scopeType: ScopeType;
}

// ── Role definition ─────────────────────────────────────────
export interface Role {
  id: string;
  name: string;          // 'Director General'
  shortName: string;     // 'DG'
  description: string;
  permissions: string[]; // permission keys enabled by default
}

// ── User (simplified — role assignment only, scopes managed elsewhere) ──
export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string;       // assigned role id
}
