import { useMemo } from 'react';
import { usePermissionsContext } from '../context/permissions-context';

/**
 * Hook to check whether the current user's role has a given permission.
 * Scope filtering (offices/divisions) is handled by other pages in the platform.
 */
export function usePermissions() {
  const { users, roles, currentUserId } = usePermissionsContext();

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId],
  );

  const currentRole = useMemo(() => {
    if (!currentUser?.roleId) return null;
    return roles.find((r) => r.id === currentUser.roleId) ?? null;
  }, [currentUser, roles]);

  /** Check if the current user's role has a permission enabled. */
  function hasPermission(permissionKey: string): boolean {
    if (!currentRole) return false;
    return currentRole.permissions.includes(permissionKey);
  }

  return { hasPermission, currentUser, currentRole };
}
