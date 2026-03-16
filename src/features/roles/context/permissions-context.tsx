import React, { createContext, useCallback, useContext, useState } from 'react';
import type { Role, User } from '../types';
import { ROLES as DEFAULT_ROLES } from '../constants/roles';
import { MOCK_USERS } from '../mock/data';

// ── Context value shape ─────────────────────────────────────
interface PermissionsContextValue {
  roles: Role[];
  users: User[];

  // Role definition mutations
  togglePermission: (roleId: string, permissionKey: string) => void;
  setRolePermissions: (permissions: Record<string, string[]>) => void;

  // Current logged-in user (for gating)
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────
export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>(() => structuredClone(DEFAULT_ROLES));
  const [users] = useState<User[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState('user-1'); // DG by default

  // Toggle a permission on/off for a role
  const togglePermission = useCallback((roleId: string, permissionKey: string) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        const has = role.permissions.includes(permissionKey);
        return {
          ...role,
          permissions: has
            ? role.permissions.filter((k) => k !== permissionKey)
            : [...role.permissions, permissionKey],
        };
      }),
    );
  }, []);

  // Bulk-update all role permissions (used by react-hook-form submit)
  const setRolePermissions = useCallback((permissions: Record<string, string[]>) => {
    setRoles((prev) =>
      prev.map((role) => ({
        ...role,
        permissions: permissions[role.id] ?? role.permissions,
      })),
    );
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        roles,
        users,
        togglePermission,
        setRolePermissions,
        currentUserId,
        setCurrentUserId,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

// ── Hook ────────────────────────────────────────────────────
export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissionsContext must be used within PermissionsProvider');
  return ctx;
}
