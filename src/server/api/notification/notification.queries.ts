import {
    gql
} from "@apollo/client";

export const RETRIEVE_NOTIFICATIONS = gql`
    query gqlRetrieveNotifications($unreadOnly: Boolean, $limit: Int, $offset: Int) {
        data: gqlRetrieveNotifications(unreadOnly: $unreadOnly, limit: $limit, offset: $offset) {
            id
            userId
            type
            title
            message
            instanceId
            instance {
                id
                title
                code
            }
            requestId
            request {
                id
                status
            }
            isRead
            readAt
            createdAt
        }
    }
`;

export const RETRIEVE_UNREAD_COUNT = gql`
    query gqlRetrieveUnreadNotificationCount {
        data: gqlRetrieveUnreadNotificationCount {
            count
        }
    }
`;
