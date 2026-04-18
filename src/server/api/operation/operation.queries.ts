import {
    gql
} from "@apollo/client";
import {
    BLUEPRINT_SUMMARY_FIELDS,
    BLUEPRINT_DETAIL_FIELDS,
    INSTANCE_SUMMARY_FIELDS,
    INSTANCE_DETAIL_FIELDS
} from "./operation.fragments";

/**************************************************************************** */
/*************************** BLUEPRINT QUERIES ****************************** */
/**************************************************************************** */

export const RETRIEVE_BLUEPRINTS = gql`
    ${BLUEPRINT_SUMMARY_FIELDS}

    query gqlRetrieveOperationBlueprints($divisionId: ID, $type: OperationType) {
        data: gqlRetrieveOperationBlueprints(divisionId: $divisionId, type: $type) {
            ...BlueprintSummaryFields
        }
    }
`;

export const RETRIEVE_BLUEPRINT_BY_ID = gql`
    ${BLUEPRINT_DETAIL_FIELDS}

    query gqlRetrieveOperationBlueprintById($id: ID!) {
        data: gqlRetrieveOperationBlueprintById(id: $id) {
            ...BlueprintDetailFields
        }
    }
`;

/**************************************************************************** */
/*************************** INSTANCE QUERIES ******************************* */
/**************************************************************************** */

export const RETRIEVE_INSTANCES = gql`
    ${INSTANCE_SUMMARY_FIELDS}

    query gqlRetrieveInstances($officeId: ID, $divisionId: ID, $status: OperationInstanceStatus, $assignedToId: ID, $createdById: ID) {
        data: gqlRetrieveInstances(officeId: $officeId, divisionId: $divisionId, status: $status, assignedToId: $assignedToId, createdById: $createdById) {
            ...InstanceSummaryFields
        }
    }
`;

export const RETRIEVE_INSTANCE_BY_ID = gql`
    ${INSTANCE_DETAIL_FIELDS}

    query gqlRetrieveInstanceById($id: ID!) {
        data: gqlRetrieveInstanceById(id: $id) {
            ...InstanceDetailFields
        }
    }
`;
