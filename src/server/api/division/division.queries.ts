import {
    gql
} from "@apollo/client";
import {
    DIVISION_CORE_FIELDS,
    DIVISION_OFFICES_FIELDS,
    DIVISION_ROLES_FIELDS
} from "./division.fragments";

/**************************************************************************** */
/**************************** QUERIES OFFICES ******************************* */
/**************************************************************************** */

export const RETRIEVE_DIVISIONS = gql`
    ${DIVISION_CORE_FIELDS}
    ${DIVISION_OFFICES_FIELDS}

    query gqlRetrieveDivisions($idOffice: ID) {
        data: gqlRetrieveDivisions(idOffice: $idOffice) {
            ...DivisionBasicFields
            ...DivisionOfficesFields
        }
    }
`;

export const RETRIEVE_DIVISION_BY_ID = gql`
    ${DIVISION_CORE_FIELDS}
    ${DIVISION_OFFICES_FIELDS}
    ${DIVISION_ROLES_FIELDS}
    
    query gqlRetrieveDivisionById($id: ID!) {
        data: gqlRetrieveDivisionById(id: $id) {
            ...DivisionBasicFields
            ...DivisionOfficesFields
            ...DivisionRolesFields
        }
    }
`;