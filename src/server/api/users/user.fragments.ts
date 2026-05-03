import {
    gql
} from "@apollo/client";

/**************************************************************************** */
/**************************** USER FRAGMENTS ******************************** */
/**************************************************************************** */

export const USER_LOGIN_FIELDS = gql`
    fragment UserLoginFields on User {
        id
        firstName
        lastName
        dni
        birthDate
        email
        phone
        status
        role {
            id
            name
            code
            permissions
        }
    }
`;

export const USER_DETAIL_FIELDS = gql`
    fragment UserDetailFields on User {
        id
        firstName
        lastName
        dni
        birthDate
        email
        phone
        status
        createdAt
        roleId
        role {
            id
            name
        }

        managedDivisions {
            id
            status
            
            office {
                id
                name
                code
            }
            division {
                code
                name
            }
        }

        offices {
            id
            status
            office {
                id
                code
                name
                address
            }

            user {
                id
            }
        }
    }
`;

export const API_USER_RESPONSE = gql`
    ${USER_DETAIL_FIELDS}
    
    fragment UserApiResponse on ApiResponse {
        success
        message
        data {
            ...UserDetailFields
        }
        errors {
            field
            message
        }
    }
`;