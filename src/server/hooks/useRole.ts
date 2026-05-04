import {
    useLazyQuery,
    type FetchResult
} from "@apollo/client";
import {
    RETRIEVE_ALL_ROLES,
    RETRIEVE_PERMISSION_CATALOG,
    RETRIEVE_ROLE_PERMISSION_HISTORY,
    RESET_ROLE_PERMISSIONS,
    UPDATE_ROLES
} from "../api/roles/role";
import type {
    ApiResponse,
    PermissionCatalogEntry,
    Role
} from "@l-ark/types";
import {
    useMutationWithToast
} from "./useApolloWithToast";

export interface RolePermissionAuditEntry {
    id: string;
    action: string;
    metadata: string | null;
    createdAt: string | null;
    userId: string | null;
}

interface useRoleResponse {
    roles: Array<Role>;
    retrieveRoles: () => FetchResult<{ data: Array<Role> }>;
    retrievePermissionCatalog: () => Promise<{ data?: { data?: Array<PermissionCatalogEntry> } }>;
    retrieveRolePermissionHistory: (variables: { roleId: string }) => Promise<{ data?: { data?: Array<RolePermissionAuditEntry> } }>;

    updateRoles: (variables: { input: Object }) => FetchResult<{ data: ApiResponse<number> }>;
    resetRolePermissions: (variables: { roleId: string }) => FetchResult<{ data: ApiResponse<number> }>;
}

export const useRole = (): useRoleResponse => {
    /** Retrieve all the available roles */
    const [ retrieveRoles, { data: rolesData }] = useLazyQuery(RETRIEVE_ALL_ROLES, { fetchPolicy: 'no-cache' });    
    /** Retrieve the catalog of all permission keys */
    const [ retrievePermissionCatalog ] = useLazyQuery(RETRIEVE_PERMISSION_CATALOG, { fetchPolicy: 'no-cache' });
    /** Retrieve the audit history of permission changes for a role */
    const [ retrieveRolePermissionHistory ] = useLazyQuery(RETRIEVE_ROLE_PERMISSION_HISTORY, { fetchPolicy: 'no-cache' });

    /** Manage to update the information of the roles */
    const [ updateRoles ] = useMutationWithToast(UPDATE_ROLES, { refetchQueries: ['gqlRetrieveRoles'] });
    /** Reset a role's permissions to the seeded defaults */
    const [ resetRolePermissions ] = useMutationWithToast(RESET_ROLE_PERMISSIONS, { refetchQueries: ['gqlRetrieveRoles'] });

    return {
        roles: rolesData?.data ?? [],
        retrieveRoles: () => retrieveRoles() as FetchResult<{ data: Array<Role> }>,
        retrievePermissionCatalog: () => retrievePermissionCatalog() as Promise<{ data?: { data?: Array<PermissionCatalogEntry> } }>,
        retrieveRolePermissionHistory: (variables: { roleId: string }) => retrieveRolePermissionHistory({ variables }) as Promise<{ data?: { data?: Array<RolePermissionAuditEntry> } }>,

        updateRoles: (variables: { input: Object }) => updateRoles({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        resetRolePermissions: (variables: { roleId: string }) => resetRolePermissions({ variables }) as FetchResult<{ data: ApiResponse<number> }>
    }
}