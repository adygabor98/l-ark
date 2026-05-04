import {
    gql
} from "@apollo/client";
import {
    MUTATION_RESPONSE_FIELDS,
    OFFICE_CORE_FIELDS
} from "./office.fragments";

/**************************************************************************** */
/*************************** MUTATIONS OFFICES ****************************** */
/**************************************************************************** */

export const CREATE_OFFICE = gql`
    ${OFFICE_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlCreateOffice($input: OfficeInput!) {
        data: gqlCreateOffice(input: $input) {
            ...MutationResponseFields
            data {
                ...OfficeBasicFields
            }
        }
    }
`;

export const UPDATE_OFFICE_BY_ID = gql`
    ${OFFICE_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlUpdateOffice($id: ID!, $input: OfficeInput!) {
        data: gqlUpdateOffice(id: $id, input: $input) {
            ...MutationResponseFields
            data {
                ...OfficeBasicFields
            }
        }
    }
`;

export const DELETE_OFFICE_BY_ID = gql`
    ${OFFICE_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlRemoveOffice($id: ID!) {
        data: gqlRemoveOffice(id: $id) {
            ...MutationResponseFields
            data {
                ...OfficeBasicFields
            }
        }
    }
`;

export const ACTIVATE_OFFICE_BY_ID = gql`
    ${OFFICE_CORE_FIELDS}
    ${MUTATION_RESPONSE_FIELDS}

    mutation gqlRestoreOffice($id: ID!) {
        data: gqlRestoreOffice(id: $id) {
            ...MutationResponseFields
            data {
                ...OfficeBasicFields
            }
        }
    }
`;
