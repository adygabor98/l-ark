import React, {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactElement
} from 'react';
import type {
	Role,
	RolePermissions
} from '../types';
import {
	ROLES as DEFAULT_ROLES
} from '../constants/roles';

interface PermissionsContextValue {
	roles: Role[];

	// Role definition mutations
	togglePermission: (roleId: string, permissionKey: string) => void;
	setRolePermissions: (permissions: Record<string, RolePermissions>) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export const PermissionsProvider = ({ children }: { children: React.ReactNode }): ReactElement => {
	/** State to manage the different roles */
	const [roles, setRoles] = useState<Role[]>(() => structuredClone(DEFAULT_ROLES));

	// Toggle a permission on/off for a role (permissionKey = "resource.action", e.g. "users.view")
	const togglePermission = useCallback((roleId: string, permissionKey: string) => {
		const [resource, action] = permissionKey.split('.');

		setRoles((prev) => prev.map((role) => {
			if (role.id !== roleId) return role;

			const current = role.permissions[resource]?.[action] ?? false;

			return {
				...role,
				permissions: {
					...role.permissions,
					[resource]: {
						...role.permissions[resource],
						[action]: !current,
					},
				},
			};
		}));
	}, []);

	const setRolePermissions = useCallback((permissions: Record<string, RolePermissions>) => {
		setRoles((prev) => prev.map((role) => ({
			...role,
			permissions: permissions[role.id] ?? role.permissions,
		})));
	}, []);

	return (
		<PermissionsContext.Provider value={{ roles, togglePermission, setRolePermissions }}>
			{ children }
		</PermissionsContext.Provider>
	);
};

export const usePermissionsContext = (): PermissionsContextValue => {
	const ctx = useContext(PermissionsContext);

	if (!ctx) throw new Error('usePermissionsContext must be used within PermissionsProvider');
	
	return ctx;
}
