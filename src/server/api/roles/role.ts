import {
    gql
} from "@apollo/client";
import {
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