import {
    gql
} from "@apollo/client";
import {
    MUTATION_RESPONSE_FIELDS
} from "./office.fragments";

/**************************************************************************** */
/*********************** MUTATIONS OFFICE-USER RELATIONS ******************** */
/**************************************************************************** */

export const ASSIGN_USER_TO_OFFICE = gql`
    ${MUTATION_RESPONSE_FIELDS}
    mutation gqlAssignOfficeToUser($idOffice: ID!, $idUser: ID!) {
        data: gqlAssignOfficeToUser(idOffice: $idOffice, idUser: $idUser) {
            ...MutationResponseFields
        }
    }
`;

export const UPDATE_OFFICE_USER_ASSIGNMENT = gql`
    ${MUTATION_RESPONSE_FIELDS}
    mutation gqlUpdateOfficeToUser($idOfficeUser: ID!, $isEnabled: Boolean) {
        data: gqlUpdateOfficeToUser(idOfficeUser: $idOfficeUser, isEnabled: $isEnabled) {
            ...MutationResponseFields
        }
    }
`;
