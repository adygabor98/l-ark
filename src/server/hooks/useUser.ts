import {
    useLazyQuery,
    type FetchResult
} from "@apollo/client";
import {
    setAccessToken,
    removeAccessToken
} from "../../shared/helpers/auth";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import {
    ACTIVATE_USER_BY_ID,
    CREATE_USER,
    DEACTIVATE_USER_BY_ID,
    LOGIN,
    LOGOUT,
    RETRIEVE_USER_BY_ID,
    RETRIEVE_USERS,
    UPDATE_USER_BY_ID
} from "../api/users/user";
import type {
    ApiResponse,
    UserBasic,
    UserDetail,
    UserInput
} from "@l-ark/types";

interface useUserResponse {
    login: (username: string, password: string) => Promise<{ success: boolean; errorMessage?: string, user?: any }>;
    logout: () => Promise<number>;

    users: UserBasic[];
    retrieveUsers: (variables: { idOffice?: number, $idDivision?: number, role?: string }) => FetchResult<{ data: Array<UserBasic> }>;

    user: UserDetail;
    retrieveUserById: (variables: { id: string }) => FetchResult<{ data: UserDetail }>;

    createUser: (variables: { input: UserInput }) => FetchResult<{ data: ApiResponse<UserDetail> }>;
    updateUserById: (variables: { id: string, input: UserInput }) => FetchResult<{ data: ApiResponse<UserDetail> }>;
    deactivateUserById: (variables: { id: string }) => FetchResult<{ data: ApiResponse<UserDetail> }>;
    activateUserById: (variables: { id: string }) => FetchResult<{ data: ApiResponse<UserDetail> }>;
}

export const useUser = (): useUserResponse => {
    /** Perform the login action */
    const [ login ] = useLazyQuery(LOGIN, { fetchPolicy: 'no-cache' });
    /** Perform the logout action */
    const [ logout ] = useLazyQueryWithToast(LOGOUT);
    /** Manage to retrieve the list of users */
    const [ retrieveUsers, { data: usersList } ] = useLazyQueryWithToast(RETRIEVE_USERS, { fetchPolicy: 'cache-and-network' });
    /** Manage to retrieve an user by id */
    const [ retrieveUserById, { data: userData } ] = useLazyQueryWithToast(RETRIEVE_USER_BY_ID, { fetchPolicy: 'cache-and-network' });
    
    /** Manage to create a new user */
    const [ createUser ] = useMutationWithToast(CREATE_USER, { refetchQueries: ['gqlRetrieveUsers'] });
    /** Manage to update an user by id */
    const [ updateUserById ] = useMutationWithToast(UPDATE_USER_BY_ID, { refetchQueries: ['gqlRetrieveUserById', 'gqlRetrieveUsers'] });
    /** Manage to deactivate an user by id */
    const [ deactivateUserById ] = useMutationWithToast(DEACTIVATE_USER_BY_ID, { refetchQueries: ['gqlRetrieveUserById', 'gqlRetrieveUsers'] });
    /** Manage to activate an user by id */
    const [ activateUserById ] = useMutationWithToast(ACTIVATE_USER_BY_ID, { refetchQueries: ['gqlRetrieveUserById', 'gqlRetrieveUsers'] });
    
    /** Manage to login the current user */
    const onLogin = async (username: string, password: string): Promise<{ success: boolean; errorMessage?: string, user?: any }> => {
        try {
            const response = await login({ variables: { username, password } });

            // Check for errors in the response
            if ( response.error ) {
                // Extract the error message from the GraphQL error
                const errorMessage = response.error.message || 'Something went wrong.';
                throw new Error(errorMessage);
            }

            // Check if data exists
            if ( response.data ) {
                setAccessToken(response.data.data.accessToken);
                const { __typename, ...rest } = response.data.data.user;
                return { success: true, user: rest };
            }

            throw new Error();
        } catch ( error: any ) {
            // Handle network errors or unexpected errors
            const errorMessage = error.message || 'Something went wrong.';
            throw new Error(errorMessage);
        }
    }

    /** Manage to logout the current user */
    const onLogout = async (): Promise<number> => {
        try {
            const response = await logout();
            removeAccessToken();
            return response?.data?.code ?? 0;
        } catch (error) {
            console.error('Logout failed:', error);
            removeAccessToken();
            return 0;
        }
    }

    return {
        login: onLogin,
        logout: onLogout,

        users: usersList?.data ?? [],
        retrieveUsers: (variables: { idOffice?: number, $idDivision?: number, role?: string }) => retrieveUsers({ variables: variables }) as FetchResult<{ data: Array<UserBasic> }>,

        user: userData?.data ?? {},
        retrieveUserById: (variables: { id: string }) => retrieveUserById({ variables: variables }) as FetchResult<{ data: UserDetail }>,

        createUser: (variables: { input: UserInput }) => createUser({ variables: variables }) as FetchResult<{ data: ApiResponse<UserDetail> }>,
        updateUserById: (variables: { id: string, input: UserInput }) => updateUserById({ variables: variables }) as FetchResult<{ data: ApiResponse<UserDetail> }>,
        deactivateUserById: (variables: { id: string }) => deactivateUserById({ variables: variables }) as FetchResult<{ data: ApiResponse<UserDetail> }>,
        activateUserById: (variables: { id: string }) => activateUserById({ variables: variables }) as FetchResult<{ data: ApiResponse<UserDetail> }>
    }
}