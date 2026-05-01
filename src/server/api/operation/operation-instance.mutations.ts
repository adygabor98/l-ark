import {
    gql
} from "@apollo/client";
import {
    API_OPERATION_RESPONSE
} from "./operation.fragments";

/**************************************************************************** */
/************************** INSTANCE MUTATIONS ****************************** */
/**************************************************************************** */

export const CREATE_OPERATION_INSTANCE = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlCreateOperationInstance($input: OperationInstanceInput!) {
        data: gqlCreateOperationInstance(input: $input) {
            ...OperationApiResponse
        }
    }
`;

export const LINK_OPERATION_INSTANCES = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlLinkOperationInstances($input: LinkOperationInstancesInput!) {
        data: gqlLinkOperationInstances(input: $input) {
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
            entityId
        }
    }
`;

export const UNLINK_OPERATION_INSTANCES = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlUnlinkOperationInstances($input: UnlinkOperationInstancesInput!) {
        data: gqlUnlinkOperationInstances(input: $input) {
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

export const MANAGE_SHARED_DOCUMENTS = gql`
    ${API_OPERATION_RESPONSE}

    mutation gqlManageSharedDocuments($input: ManageSharedDocumentsInput!) {
        data: gqlManageSharedDocuments(input: $input) {
            ...OperationApiResponse
        }
    }
`;
