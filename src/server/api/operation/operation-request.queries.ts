import { gql } from "@apollo/client";

export const RETRIEVE_OPERATION_REQUESTS = gql`
    query gqlRetrieveOperationRequests($status: OperationRequestStatus, $targetUserId: ID) {
        data: gqlRetrieveOperationRequests(status: $status, targetUserId: $targetUserId) {
            id
            status
            message
            rejectionReason
            createdAt
            updatedAt
            requestedBy {
                id
                firstName
                lastName
            }
            targetUser {
                id
                firstName
                lastName
            }
            sourceInstance {
                id
                title
                code
            }
            targetBlueprint {
                id
                title
                type
                subType
                code
            }
            createdGlobalInstance {
                id
                title
                code
            }
        }
    }
`;
