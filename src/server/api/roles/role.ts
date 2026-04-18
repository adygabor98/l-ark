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