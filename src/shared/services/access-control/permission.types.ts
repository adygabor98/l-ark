/**
 * Permission Structure
 * Matches the structure defined in roles.management.tsx
 */
export interface PermissionStructure {
    
}

/**
 * Helper type to generate nested key paths with dot notation
 */
type NestedKeyOf<T, Prefix extends string = ''> = {
    [K in keyof T]: T[K] extends boolean
        ? `${Prefix}${K & string}`
        : T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K & string}.`>
        : never;
}[keyof T];

/**
 * Type-safe permission path
 * Generates union type of all valid permission paths like "users.view", "tasks.assignments.create"
 */
export type PermissionPath = NestedKeyOf<PermissionStructure>;

/**
 * Permission path constants for autocomplete and type safety
 */
export const PERMISSION_PATHS = {
    
} as const satisfies Record<string, PermissionPath>;

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
    role: {
        id: number;
        name: string;
        type: string;
        permissions: PermissionStructure;
    };
}
