import {
    useLazyQuery,
    type FetchResult
} from "@apollo/client";
import {
    RETRIEVE_ALL_ROLES, 
    UPDATE_ROLES
} from "../api/roles/role";
import type {
    ApiResponse,
    Role
} from "@l-ark/types";
import {
    useMutationWithToast
} from "./useApolloWithToast";

interface useRoleResponse {
    roles: Array<Role>;
    retrieveRoles: () => FetchResult<{ data: Array<Role> }>;

    updateRoles: (variables: { input: Object }) => FetchResult<{ data: ApiResponse<number> }>
}

export const useRole = (): useRoleResponse => {
    /** Retrieve all the available roles */
    const [ retrieveRoles, { data: rolesData }] = useLazyQuery(RETRIEVE_ALL_ROLES, { fetchPolicy: 'no-cache' });    
    /** Manage to update the information of the roles */
    const [ updateRoles ] = useMutationWithToast(UPDATE_ROLES, { refetchQueries: ['gqlRetrieveRoles'] });

    return {
        roles: rolesData?.data ?? [],
        retrieveRoles: () => retrieveRoles() as FetchResult<{ data: Array<Role> }>,

        updateRoles: (variables: { input: Object }) => updateRoles({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>
    }
}