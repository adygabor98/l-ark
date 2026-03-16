import {
    gql
} from "@apollo/client";
import {
    OFFICE_CORE_FIELDS,
    OFFICE_USERS_FIELDS,
    OFFICE_DIVISIONS_FIELDS
} from "./office.fragments";

/**************************************************************************** */
/**************************** QUERIES OFFICES ******************************* */
/**************************************************************************** */

export const RETRIEVE_OFFICES = gql`
    ${OFFICE_CORE_FIELDS}
    ${OFFICE_USERS_FIELDS}

    query gqlRetrieveOffices( $idUser: ID, $idDivision: ID) {
        data: gqlRetrieveOffices(idUser: $idUser, idDivision: $idDivision) {
            ...OfficeBasicFields
            ...OfficeUsersFields
        }
    }
`;

export const RETRIEVE_OFFICE_BY_ID = gql`
    ${OFFICE_CORE_FIELDS}
    ${OFFICE_USERS_FIELDS}
    ${OFFICE_DIVISIONS_FIELDS}

    query gqlRetrieveOfficeById($id: ID!) {
        data: gqlRetrieveOfficeById(id: $id) {
            ...OfficeBasicFields
            ...OfficeUsersFields
            ...OfficeDivisionsFields
        }
    }
`;

export const CHECK_MULTIPLE_OFFICE_ASSIGNMENTS = gql`
    query gqlCheckMultipleAssignments($idUser: ID!, $idOffice: ID!) {
        data: gqlCheckMultipleAssignments(idUser: $idUser, idOffice: $idOffice)
    }
`;