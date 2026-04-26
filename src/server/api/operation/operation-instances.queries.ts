import {
    gql
} from "@apollo/client";
import {
    INSTANCE_SUMMARY_FIELDS,
    INSTANCE_DETAIL_FIELDS
} from "./operation.fragments";

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
