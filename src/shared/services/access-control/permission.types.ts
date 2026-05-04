/**
 * Permission Structure
 * Nested JSON object matching the database format:
 * { resource: { action: boolean } }
 * e.g. { users: { view: true, edit: false }, offices: { view: true } }
 */
export interface PermissionStructure {
    [resource: string]: {
        [action: string]: boolean;
    };
}

/**
 * Permission path in dot notation, e.g. "users.view", "offices.edit"
 */
export type PermissionPath = string;

/**
 * Permission check options
 */
export interface PermissionCheckOptions {
    /** If true, all permissions must be granted. If false (default), any permission grants access */
    requireAll?: boolean;
}

/**
 * Authenticated user type with role and permissions
 */
export interface AuthenticatedUser {
    id: number;
    avatar?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
        id: number;
        name: string;
        type: string;
        code: string;
        permissions: PermissionStructure;
    };
    /** OfficeDivision rows the user manages (he is the director of). */
    managedDivisions?: Array<{
        id: number | string;
        office: { id: number | string };
        division: { id: number | string };
    }>;
}
