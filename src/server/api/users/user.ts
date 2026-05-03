import {
    gql
} from "@apollo/client";
import {
    API_USER_RESPONSE,
    USER_DETAIL_FIELDS,
    USER_LOGIN_FIELDS
} from "./user.fragments";

/**************************************************************************** */
/***************************** QUERIES USER ********************************* */
/**************************************************************************** */

export const LOGIN = gql`
    ${USER_LOGIN_FIELDS}
    query gqlLogin($username: String!, $password: String!) {
        data: gqlLogin(username: $username, password: $password) {
            user {
                ...UserLoginFields
            }
            accessToken
        }
    }
`;

export const LOGOUT = gql`
    query gqlLogout {
        code: gqlLogout
    }
`;

export const REFRESH_TOKEN = gql`
    query gqlRefreshToken {
        data: gqlRefreshToken {
            accessToken
        }
    }
`;

export const RETRIEVE_USERS = gql`
    ${USER_LOGIN_FIELDS}

    query gqlRetrieveUsers($idOffice: ID, $idDivision: ID, $role: String, $sourceUser: ID) {
        data: gqlRetrieveUsers(idOffice: $idOffice, idDivision: $idDivision, role: $role, sourceUser: $sourceUser) {
            ...UserLoginFields
        }
    }
`;

export const RETRIEVE_USER_BY_ID = gql`
    ${USER_DETAIL_FIELDS}

    query gqlRetrieveUserById($id: ID!) {
        data: gqlRetrieveUserById(id: $id) {
            ...UserDetailFields
        }
    }
`;

/**************************************************************************** */
/**************************** MUTATIONS USER ******************************** */
/**************************************************************************** */

export const CREATE_USER = gql`
    ${API_USER_RESPONSE}

    mutation gqlCreateUser($input: UserInput!) {
        data: gqlCreateUser(input: $input) {
            ...UserApiResponse
        }
    }
`;

export const UPDATE_USER_BY_ID = gql`
    ${API_USER_RESPONSE}

    mutation gqlUpdateUser($id: ID!, $input: UserInput!) {
        data: gqlUpdateUser(id: $id, input: $input) {
            ...UserApiResponse
        }
    }
`;

export const DEACTIVATE_USER_BY_ID = gql`
    ${API_USER_RESPONSE}

    mutation gqlDeleteUser($id: ID!) {
        data: gqlDeleteUser(id: $id) {
            ...UserApiResponse
        }
    }
`;

export const ACTIVATE_USER_BY_ID = gql`
    ${API_USER_RESPONSE}

    mutation gqlRestoreUser($id: ID!) {
        data: gqlRestoreUser(id: $id) {
            ...UserApiResponse
        }
    }
`;