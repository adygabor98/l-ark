import {
    gql
} from "@apollo/client";

/**************************************************************************** */
/*************************** OFFICE FRAGMENTS ******************************* */
/**************************************************************************** */

export const OFFICE_CORE_FIELDS = gql`
    fragment OfficeBasicFields on Office {
        id
        name
        cif
        nameSL
        code
        address
        zipCode
        city
        createdAt
        updatedAt
        deletedAt
        status
    }
`;

export const OFFICE_USERS_FIELDS = gql`
    fragment OfficeUsersFields on Office {
        users {
            id
            status
            
            user {
                id
                firstName
                lastName
                email
                phone
                role {
                    id
                    name
                }
            }
        }
    }
`;

export const OFFICE_DIVISIONS_FIELDS = gql`
    fragment OfficeDivisionsFields on Office {
        divisions {
            id
            status

            division {
                id
                code
                name
            }
            manager {
                id
                firstName
                lastName
                role {
                    id
                    name
                }
            }
        }
    }
`;

export const MUTATION_RESPONSE_FIELDS = gql`
    ${OFFICE_CORE_FIELDS}
    ${OFFICE_USERS_FIELDS}
    ${OFFICE_DIVISIONS_FIELDS}

    fragment MutationResponseFields on ApiResponse {
        success
        message
        data {
            ...OfficeBasicFields
            ...OfficeUsersFields
            ...OfficeDivisionsFields
        }
        errors {
            field
            message
        }
    }
`;