import {
    gql
} from "@apollo/client";
import {
    API_ROLE_RESPONSE,
    ROLE_FIELDS
} from "./role.fragments";

/**************************************************************************** */
/***************************** QUERIES ROLE ********************************* */
/**************************************************************************** */

export const RETRIEVE_ALL_ROLES = gql`
    ${ROLE_FIELDS}
    
    query gqlRetrieveRoles {
        data: gqlRetrieveRoles {
            ...RoleFields
        }
    }
`;

export const RETRIEVE_PERMISSION_CATALOG = gql`
    query gqlRetrievePermissionCatalog {
        data: gqlRetrievePermissionCatalog {
            key
            resource
            action
            labelKey
            descriptionKey
        }
    }
`;

export const RETRIEVE_ROLE_PERMISSION_HISTORY = gql`
    query gqlRetrieveRolePermissionHistory($roleId: ID!) {
        data: gqlRetrieveRolePermissionHistory(roleId: $roleId) {
            id
            action
            metadata
            createdAt
            userId
        }
    }
`;

/**************************************************************************** */
/***************************** MUTATION ROLE ******************************** */
/**************************************************************************** */

export const UPDATE_ROLES = gql`
    ${API_ROLE_RESPONSE}
    
    mutation gqlUpdateRoleInformation($input: JSON) {
        data: gqlUpdateRoleInformation(input: $input) {
            ...RoleApiResponse
        }
    }
`;

export const RESET_ROLE_PERMISSIONS = gql`
    ${API_ROLE_RESPONSE}

    mutation gqlResetRolePermissions($roleId: ID!) {
        data: gqlResetRolePermissions(roleId: $roleId) {
            ...RoleApiResponse
        }
    }
`;