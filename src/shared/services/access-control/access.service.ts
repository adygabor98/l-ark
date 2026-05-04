import type {
    PermissionStructure,
    PermissionPath,
    AuthenticatedUser,
    PermissionCheckOptions
} from './permission.types';

class AccessControlService {
    /**
     * Get a nested value from an object using dot notation path
     * @param obj - The object to traverse
     * @param path - Dot notation path (e.g., "tasks.assignments.view")
     * @returns The boolean value at the path, or undefined if not found
     */
    private getNestedValue(obj: PermissionStructure, path: string): boolean | undefined {
        const keys = path.split('.');
        let current: unknown = obj;

        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return undefined;
            }
            current = (current as Record<string, unknown>)[key];
        }

        return typeof current === 'boolean' ? current : undefined;
    }

    hasPermission(permissions: PermissionStructure | null | undefined, path: PermissionPath): boolean {
        if (!permissions) {
            return false;
        }

        return this.getNestedValue(permissions, path) ?? false;
    }

    hasAnyPermission(permissions: PermissionStructure | null | undefined, paths: PermissionPath[]): boolean {
        if (!permissions || paths.length === 0) {
            return false;
        }

        return paths.some(path => this.hasPermission(permissions, path));
    }

    hasAllPermissions(permissions: PermissionStructure | null | undefined, paths: PermissionPath[]): boolean {
        if (!permissions || paths.length === 0) {
            return false;
        }

        return paths.every(path => this.hasPermission(permissions, path));
    }

    checkPermissions(permissions: PermissionStructure | null | undefined, paths: PermissionPath | PermissionPath[], options: PermissionCheckOptions = {}): boolean {
        const pathArray = Array.isArray(paths) ? paths : [paths];
        const { requireAll = false } = options;

        if (pathArray.length === 0) {
            return true;
        }

        if (requireAll) {
            return this.hasAllPermissions(permissions, pathArray);
        }

        return this.hasAnyPermission(permissions, pathArray);
    }

    isAuthenticated(user: AuthenticatedUser | null | undefined): boolean {
        return user !== null && user !== undefined && typeof user.id !== 'undefined';
    }

    getUserPermissions(user: AuthenticatedUser | null | undefined): PermissionStructure | null {
        return user?.role?.permissions ?? null;
    }

    canAccessRoute(user: AuthenticatedUser | null | undefined, requiredPermissions?: PermissionPath | PermissionPath[], options: PermissionCheckOptions = {}): boolean {
        // First check authentication
        if (!this.isAuthenticated(user)) {
            return false;
        }

        // If no permissions required, allow access (authenticated only route)
        if (!requiredPermissions) {
            return true;
        }

        const permissions = this.getUserPermissions(user);
        return this.checkPermissions(permissions, requiredPermissions, options);
    }
}

// Export singleton instance
export const accessControlService = new AccessControlService();

// Export class for testing purposes
export { AccessControlService };
