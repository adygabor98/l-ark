import {
    useMemo,
    useCallback
} from 'react';
import {
    useSelector
} from 'react-redux';
import {
    selectUser
} from '../../store/selectors/user.selector';
import {
    accessControlService
} from '../services/access-control/access.service';
import type {
    PermissionPath,
    PermissionStructure,
    PermissionCheckOptions,
    AuthenticatedUser
} from '../services/access-control/permission.types';

/**
 * Hook return type
 */
interface UsePermissionsReturn {
    /** Current user object */
    user: AuthenticatedUser | null;
    /** User's permission structure */
    permissions: PermissionStructure | null;
    /** Whether user is authenticated */
    isAuthenticated: boolean;

    /** Check if user has a specific permission */
    hasPermission: (path: PermissionPath) => boolean;
    /** Check if user has any of the specified permissions */
    hasAnyPermission: (paths: PermissionPath[]) => boolean;
    /** Check if user has all of the specified permissions */
    hasAllPermissions: (paths: PermissionPath[]) => boolean;
    /** Check permissions with options */
    checkPermissions: (paths: PermissionPath | PermissionPath[], options?: PermissionCheckOptions) => boolean;
    /** Check if user can access a route */
    canAccessRoute: (requiredPermissions?: PermissionPath | PermissionPath[], options?: PermissionCheckOptions) => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
    // Get user from Redux store
    const user = useSelector(selectUser) as AuthenticatedUser | null;

    // Memoize permissions extraction
    const permissions = useMemo(() => accessControlService.getUserPermissions(user), [user]);

    // Memoize authentication status
    const isAuthenticated = useMemo(() => accessControlService.isAuthenticated(user), [user]);

    // Memoized permission check functions
    const hasPermission = useCallback((path: PermissionPath): boolean => accessControlService.hasPermission(permissions, path), [permissions]);

    const hasAnyPermission = useCallback((paths: PermissionPath[]): boolean => accessControlService.hasAnyPermission(permissions, paths), [permissions]);

    const hasAllPermissions = useCallback((paths: PermissionPath[]): boolean => accessControlService.hasAllPermissions(permissions, paths), [permissions]);

    const checkPermissions = useCallback((paths: PermissionPath | PermissionPath[], options?: PermissionCheckOptions): boolean => accessControlService.checkPermissions(permissions, paths, options), [permissions]);

    const canAccessRoute = useCallback((requiredPermissions?: PermissionPath | PermissionPath[], options?: PermissionCheckOptions): boolean => {
        return accessControlService.canAccessRoute(user, requiredPermissions, options);
    }, [user]);

    return {
        user,
        permissions,
        isAuthenticated,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        checkPermissions,
        canAccessRoute,
    };
};

export default usePermissions;
