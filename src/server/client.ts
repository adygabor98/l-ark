import {
    navigateTo
} from '../shared/hooks/useGNavigate';
import {
    ApolloClient,
    InMemoryCache,
    Observable,
    createHttpLink
} from '@apollo/client';
import {
    setContext
} from '@apollo/client/link/context';
import {
    onError
} from '@apollo/client/link/error';
import {
    getAccessToken,
    refreshAccessToken,
    removeAccessToken } from '../shared/helpers/auth';
import {
    removeUser
} from '../store/actions/user.actions';
import {
    store
} from '../store/store';

const authLink = setContext(async (_, { headers }) => {
    const token = getAccessToken();
    const lang = localStorage.getItem('lang');
    
    return {
        headers: {
            ...headers,
            language: lang && lang !== 'undefined' ? lang : '',
            authorization: token && token !== 'undefined' ? `Bearer ${token}` : ''
        }
    };
});

// Track if we're currently refreshing to prevent multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const forceLogout = () => {
    isRefreshing = false;
    processQueue(new Error('Session expired'), null);
    removeAccessToken();
    store.dispatch(removeUser());
    navigateTo('/');
};

const isAuthError = (message: string, code?: any): boolean =>
    message.includes('Unauthorized') ||
    message.includes('Invalid or expired token') ||
    message.includes('Context creation failed') ||
    message.includes('jwt expired') ||
    message.includes('El token') ||
    code === 'UNAUTHORIZED';

const errorLink = onError((errorResponse) => {
    const { operation, forward } = errorResponse;
    const graphQLErrors = errorResponse['graphQLErrors' as keyof typeof errorResponse] as any;
    const networkError = errorResponse['networkError' as keyof typeof errorResponse] as any;

    // Handle network-level auth errors (HTTP 500 from context creation failures)
    if (networkError) {
        const statusCode = networkError?.statusCode;
        const resultMessage = networkError?.result?.errors?.[0]?.message || '';
        const fallbackMessage = networkError?.message || '';
        const errorMessage = resultMessage || fallbackMessage;

        if (statusCode === 401 || isAuthError(errorMessage)) {
            console.error('Network auth error, forcing logout:', errorMessage);
            forceLogout();
            return;
        }
    }

    if (graphQLErrors) {
        for (const { message, extensions, path } of graphQLErrors) {
            console.error(`[GraphQL error]: Message: ${message}, Code: ${extensions?.code}, Path: ${path}`);

            // Any error from the refresh token operation means the session is fully expired — force logout
            if (operation.operationName === 'gqlRefreshToken') {
                console.error('Refresh token operation failed, forcing logout');
                forceLogout();
                return;
            }

            // Forbidden access — surface the user to the unauthorized page.
            // Avoid hijacking the app on routine permission probes from list
            // queries by routing only when the failure originated from a detail
            // / mutation path (single-record loads or write operations).
            if (extensions?.code === 'FORBIDDEN') {
                const opName = operation.operationName ?? '';
                const isDetailOrMutation =
                    /detail|byId|ById$|create|update|delete|launch|complete|publish|archive|restore|grant/i.test(opName);
                if (isDetailOrMutation) {
                    navigateTo('/unauthorized');
                    return;
                }
            }

            // Handle authentication errors and token expiration for all other operations
            if (isAuthError(message, extensions?.code)) {
                if (!isRefreshing) {
                    isRefreshing = true;

                    return new Observable(observer => {
                        refreshAccessToken()
                            .then((newToken) => {
                                if (newToken) {
                                    processQueue(null, newToken);
                                    operation.setContext(({ headers = {} }) => ({
                                        headers: {
                                            ...headers,
                                            authorization: `Bearer ${newToken}`
                                        }
                                    }));

                                    const subscriber = forward(operation).subscribe({
                                        next: observer.next.bind(observer),
                                        error: observer.error.bind(observer),
                                        complete: observer.complete.bind(observer),
                                    });

                                    return () => {
                                        if (subscriber) subscriber.unsubscribe();
                                    };
                                } else {
                                    throw new Error('Token refresh returned null');
                                }
                            })
                            .catch((err) => {
                                console.error('Token refresh failed in error link:', err);
                                forceLogout();
                                observer.error(err);
                            })
                            .finally(() => {
                                isRefreshing = false;
                            });
                    });
                } else {
                    // Already refreshing — queue this request
                    return new Observable(observer => {
                        failedQueue.push({
                            resolve: (token: string) => {
                                operation.setContext(({ headers = {} }) => ({
                                    headers: {
                                        ...headers,
                                        authorization: `Bearer ${token}`
                                    }
                                }));

                                const subscriber = forward(operation).subscribe({
                                    next: observer.next.bind(observer),
                                    error: observer.error.bind(observer),
                                    complete: observer.complete.bind(observer),
                                });

                                return () => {
                                    if (subscriber) subscriber.unsubscribe();
                                };
                            },
                            reject: (error: any) => {
                                observer.error(error);
                            }
                        });
                    });
                }
            }
        }
    }
});

const httpLink = createHttpLink({
    uri: `${import.meta.env.VITE_SERVER_HOST}/graphql`,
    credentials: 'include'
});

const link = authLink.concat(errorLink).concat(httpLink);

export const apolloClient = new ApolloClient({
    link,
    cache: new InMemoryCache({})
});