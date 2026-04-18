import {
    gql
} from "@apollo/client";
import {
    API_OPERATION_RESPONSE
} from "./operation.fragments";

/**************************************************************************** */
/************************** BLUEPRINT MUTATIONS ***************************** */
/**************************************************************************** */

export const CREATE_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlCreateOperationBlueprint($input: OperationBlueprintInput!) {
        data: gqlCreateOperationBlueprint(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const UPDATE_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlUpdateOperationBlueprint($id: ID!, $input: OperationBlueprintInput!) {
        data: gqlUpdateOperationBlueprint(id: $id, input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const ACTIVATE_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlActivateOperationBlueprint($id: ID!) {
        data: gqlActivateOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const ARCHIVE_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlArchiveOperationBlueprint($id: ID!) {
        data: gqlArchiveOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const RESTORE_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlRestoreOperationBlueprint($id: ID!) {
        data: gqlRestoreOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const REMOVE_BLUEPRINT = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlRemoveOperationBlueprint($id: ID!) {
        data: gqlRemoveOperationBlueprint(id: $id) {
            ...OperationApiResponse
        }
    }
`;

/**************************************************************************** */
/************************** INSTANCE MUTATIONS ****************************** */
/**************************************************************************** */

export const CREATE_INSTANCE = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlCreateInstance($input: OperationInstanceInput!) {
        data: gqlCreateInstance(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const UPDATE_INSTANCE_STATUS = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlUpdateInstanceStatus($id: ID!, $status: OperationInstanceStatus!) {
        data: gqlUpdateInstanceStatus(id: $id, status: $status) {
            ...OperationApiResponse
        }
    }
`;

export const UPDATE_STEP_INSTANCE = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlUpdateStepInstance($id: ID!, $input: UpdateStepInstanceInput!) {
        data: gqlUpdateStepInstance(id: $id, input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const LINK_INSTANCES = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlLinkInstances($input: LinkInstancesInput!) {
        data: gqlLinkInstances(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const CLOSE_OPERATION = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlCloseOperation($input: ClosureDecisionInput!) {
        data: gqlCloseOperation(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const UPDATE_PAYMENT_STATUS = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlUpdatePaymentStatus($instanceId: ID!, $status: String!) {
        data: gqlUpdatePaymentStatus(instanceId: $instanceId, status: $status) {
            ...OperationApiResponse
        }
    }
`;

export const REMOVE_INSTANCE = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlRemoveInstance($id: ID!) {
        data: gqlRemoveInstance(id: $id) {
            ...OperationApiResponse
        }
    }
`;

export const EXECUTE_OPEN_OPERATION_STEP = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlExecuteOpenOperationStep($input: ExecuteOpenOperationInput!) {
        data: gqlExecuteOpenOperationStep(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const SELECT_DOCUMENTS_TO_SHARE = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlSelectDocumentsToShare($input: SelectDocumentsToShareInput!) {
        data: gqlSelectDocumentsToShare(input: $input) {
            ...OperationApiResponse
        }
    }
`;
