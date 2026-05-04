import {
    gql
} from "@apollo/client";
import { MUTATION_RESPONSE_FIELDS } from "./office.fragments";

/**************************************************************************** */
/******************** MUTATIONS OFFICE-DIVISION RELATIONS ******************* */
/**************************************************************************** */

export const ASSIGN_DIVISION_TO_OFFICE = gql`
    ${MUTATION_RESPONSE_FIELDS}
    mutation gqlAssignOfficeToDivision($idOffice: ID!, $idDivision: ID!, $idUser: ID!) {
        data: gqlAssignOfficeToDivision(idOffice: $idOffice, idDivision: $idDivision, idUser: $idUser) {
            ...MutationResponseFields
        }
    }
`;

export const UPDATE_OFFICE_DIVISION_ASSIGNMENT = gql`
    ${MUTATION_RESPONSE_FIELDS}
    mutation gqlUpdateOfficeToDivision($idOfficeDivision: ID!, $idOffice: ID!, $idDivision: ID!, $idUser: ID!, $isEnabled: Boolean) {
        data: gqlUpdateOfficeToDivision(idOfficeDivision: $idOfficeDivision, idOffice: $idOffice, idDivision: $idDivision, idUser: $idUser, isEnabled: $isEnabled) {
            ...MutationResponseFields
        }
    }
`;
