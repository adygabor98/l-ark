import {
    gql
} from "@apollo/client";
import {
    API_OPERATION_RESPONSE
} from "./operation.fragments";

/**************************************************************************** */
/************************** BLUEPRINT MUTATIONS ***************************** */
/**************************************************************************** */

export const CREATE_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlCreateOperationBlueprint($input: OperationBlueprintInput!) {
        data: gqlCreateOperationBlueprint(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const UPDATE_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlUpdateOperationBlueprint($id: ID!, $input: OperationBlueprintInput!) {
        data: gqlUpdateOperationBlueprint(id: $id, input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const ACTIVATE_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlActivateOperationBlueprint($id: ID!) {
        data: gqlActivateOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const ARCHIVE_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlArchiveOperationBlueprint($id: ID!) {
        data: gqlArchiveOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const RESTORE_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlRestoreOperationBlueprint($id: ID!) {
        data: gqlRestoreOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const DELETE_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlRemoveOperationBlueprint($id: ID!) {
        data: gqlRemoveOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const PUBLISH_OPERATION_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlPublishOperationBlueprint($id: ID!) {
        data: gqlPublishOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const DELETE_OPERATION_BLUEPRINT_VERSION = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlDeleteOperationBlueprintVersion($id: ID!) {
        data: gqlDeleteOperationBlueprintVersion(id: $id) {
            ...OperationApiResponse
        }
    }
`;