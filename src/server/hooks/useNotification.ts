import {
    useQuery,
    type FetchResult
} from "@apollo/client";
import {
    RETRIEVE_NOTIFICATIONS,
    RETRIEVE_UNREAD_COUNT
} from "../api/notification/notification.queries";
import {
    MARK_NOTIFICATION_AS_READ,
    MARK_ALL_NOTIFICATIONS_AS_READ
} from "../api/notification/notification.mutations";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import type { Notification } from "@l-ark/types";

interface ApiResponse {
    success: boolean;
    message: string;
}

interface UseNotificationResponse {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    refetchNotifications: () => void;
    refetchUnreadCount: () => void;
    retrieveNotifications: (variables?: { unreadOnly?: boolean; limit?: number; offset?: number }) => FetchResult<{ data: Notification[] }>;
    markAsRead: (variables: { id: string }) => FetchResult<{ data: ApiResponse }>;
    markAllAsRead: () => FetchResult<{ data: ApiResponse }>;
}

export const useNotification = (): UseNotificationResponse => {
    /** Poll unread count every 30 seconds */
    const { data: unreadData, refetch: refetchUnreadCount } = useQuery(RETRIEVE_UNREAD_COUNT, {
        pollInterval: 30000,
        fetchPolicy: 'network-only'
    });

    /** Lazy-load full notifications list */
    const [retrieveNotifications, { data: notificationsData, loading, refetch: refetchNotifications }] =
        useLazyQueryWithToast(RETRIEVE_NOTIFICATIONS, { fetchPolicy: 'network-only' });

    /** Mark single as read */
    const [markAsRead] = useMutationWithToast(MARK_NOTIFICATION_AS_READ, {
        refetchQueries: ['gqlRetrieveUnreadNotificationCount', 'gqlRetrieveNotifications']
    });

    /** Mark all as read */
    const [markAllAsRead] = useMutationWithToast(MARK_ALL_NOTIFICATIONS_AS_READ, {
        refetchQueries: ['gqlRetrieveUnreadNotificationCount', 'gqlRetrieveNotifications']
    });

    return {
        notifications: notificationsData?.data ?? [],
        unreadCount: unreadData?.data?.count ?? 0,
        loading,
        refetchNotifications: refetchNotifications ?? (() => {}),
        refetchUnreadCount,
        retrieveNotifications: (variables?: { unreadOnly?: boolean; limit?: number; offset?: number }) =>
            retrieveNotifications({ variables }) as FetchResult<{ data: Notification[] }>,
        markAsRead: (variables: { id: string }) =>
            markAsRead({ variables }) as FetchResult<{ data: ApiResponse }>,
        markAllAsRead: () =>
            markAllAsRead() as FetchResult<{ data: ApiResponse }>,
    };
};
