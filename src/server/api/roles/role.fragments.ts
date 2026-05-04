import {
    gql
} from "@apollo/client";

/**************************************************************************** */
/**************************** ROLE FRAGMENTS ******************************** */
/**************************************************************************** */

export const ROLE_FIELDS = gql`
    fragment RoleFields on Role {
        id
        code
        name
        permissions
    }
`;


export const API_ROLE_RESPONSE = gql`    
    fragment RoleApiResponse on ApiResponse {
        success
        message
        errors {
            field
            message
        }
    }
`;