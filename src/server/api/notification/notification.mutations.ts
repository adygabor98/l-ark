import {
    gql
} from "@apollo/client";

export const MARK_NOTIFICATION_AS_READ = gql`
    mutation gqlMarkNotificationAsRead($id: ID!) {
        data: gqlMarkNotificationAsRead(id: $id) {
            success
            message
        }
    }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
    mutation gqlMarkAllNotificationsAsRead {
        data: gqlMarkAllNotificationsAsRead {
            success
            message
        }
    }
`;
