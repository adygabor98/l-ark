import type {
    PermissionPath
} from './permission.types';

/**
 * Route permission configuration
 */
export interface RoutePermissionConfig {
    /** Permission path(s) required for this route */
    permissions?: PermissionPath | PermissionPath[];
    /** If true, all permissions must be granted. Default: false (any permission grants access) */
    requireAll?: boolean;
    /** If true, route is public (no auth required). Default: false */
    isPublic?: boolean;
}

/**
 * Centralized route permission mapping
 * Maps route paths to their permission requirements
 * Example:
 *  Users management
    '/users': {
        permissions: PERMISSION_PATHS.USERS_VIEW,
    },
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermissionConfig> = {
    // Public routes
    '/': { isPublic: true },
    '/invite/:id/:date': { isPublic: true }
};

/**
 * Navigation item permission configuration
 * Used to filter nav items in sidebar based on permissions
 */
export interface NavPermissionConfig {
    href: string;
    permissions?: PermissionPath | PermissionPath[];
    requireAll?: boolean;
}

/**
 * Navigation permissions mapping
 */
export const NAV_PERMISSIONS: NavPermissionConfig[] = [];

/**
 * Get permission config for a route path
 * Handles dynamic route matching (e.g., /users/:id matches /users/*)
 */
export function getRoutePermissionConfig(path: string): RoutePermissionConfig | undefined {
    // Direct match
    if (ROUTE_PERMISSIONS[path]) {
        return ROUTE_PERMISSIONS[path];
    }

    // Try pattern matching for dynamic routes
    for (const [routePath, config] of Object.entries(ROUTE_PERMISSIONS)) {
        const pattern = routePath.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(path)) {
            return config;
        }
    }

    return undefined;
}
