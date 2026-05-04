import {
    gql
} from "@apollo/client";
import {
    MUTATION_RESPONSE_FIELDS,
    DIVISION_CORE_FIELDS
} from "./division.fragments";

/**************************************************************************** */
/************************** MUTATIONS DIVISIONS ***************************** */
/**************************************************************************** */

export const CREATE_DIVISION = gql`
    ${DIVISION_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlCreateDivision($input: DivisionInput!) {
        data: gqlCreateDivision(input: $input) {
            ...MutationResponseFields
        }
    }
`;

export const UPDATE_DIVISION_BY_ID = gql`
    ${DIVISION_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlUpdateDivision($id: ID!, $input: DivisionInput!) {
        data: gqlUpdateDivision(id: $id, input: $input) {
            ...MutationResponseFields
        }
    }
`;

export const DERESTORE_DIVISION_BY_ID = gql`
    ${DIVISION_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlRemoveDivision($id: ID!) {
        data: gqlRemoveDivision(id: $id) {
            ...MutationResponseFields
        }
    }
`;

export const RESTORE_DIVISION_BY_ID = gql`
    ${DIVISION_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlRestoreDivision($id: ID!) {
        data: gqlRestoreDivision(id: $id) {
            ...MutationResponseFields
        }
    }
`;
