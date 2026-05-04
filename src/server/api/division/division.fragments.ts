import {
    gql
} from "@apollo/client";

/**************************************************************************** */
/************************** DIVISION FRAGMENTS ****************************** */
/**************************************************************************** */

export const DIVISION_CORE_FIELDS = gql`
    fragment DivisionBasicFields on Division {
        id
        name
        code
        status
        deletedAt
        description
    }
`;

export const DIVISION_OFFICES_FIELDS = gql`
    fragment DivisionOfficesFields on Division {
        offices {
            id
            status
            
            office {
                id
                name
                address
                users {
                    id
                }
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

export const DIVISION_ROLES_FIELDS = gql`
    fragment DivisionRolesFields on Division {
        roles {
            id
            roleId
            role {
                id
                name
            }
        }
    }
`;

export const MUTATION_RESPONSE_FIELDS = gql`
    ${DIVISION_CORE_FIELDS}
    ${DIVISION_OFFICES_FIELDS}
    ${DIVISION_ROLES_FIELDS}

    fragment MutationResponseFields on ApiResponse {
        success
        message
        data {
            ...DivisionBasicFields
            ...DivisionOfficesFields
            ...DivisionRolesFields
        }
        errors {
            field
            message
        }
    }
`;