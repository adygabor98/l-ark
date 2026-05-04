import {
    REFRESH_TOKEN
} from "../../server/api/users/user";
import {
    apolloClient
} from "../../server/client";

// Use consistent token key across the application
const TOKEN_KEY = 'access-token';

let accessToken: string | null = localStorage.getItem(TOKEN_KEY);

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string) => {
    accessToken = token;
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeAccessToken = (): void => {
    accessToken = null;
    localStorage.removeItem(TOKEN_KEY);
};

/**
 * Manually refresh the access token using the refresh token
 * @returns Promise<string | null> - new access token or null if refresh failed
 */
export const refreshAccessToken = async (): Promise<string | null> => {
    try {
        const { data } = await apolloClient.query({
            query: REFRESH_TOKEN,
            fetchPolicy: 'no-cache'
        });

        if (data?.data?.accessToken) {
            const newToken = data.data.accessToken;
            setAccessToken(newToken);
            return newToken;
        }

        throw new Error('No access token in response');
    } catch (error) {
        console.error('Token refresh failed:', error);
        removeAccessToken();
        throw error;
    }
};

/**
 * Decode JWT token and extract payload
 * @param token - JWT token string
 * @returns decoded token payload or null if invalid
 */
export const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

/**
 * Check if token is expired or will expire soon
 * @param bufferSeconds - number of seconds before expiration to consider token expired (default: 30)
 * @returns true if token is expired or will expire within buffer time
 */
export const isTokenExpired = (bufferSeconds: number = 30): boolean => {
    const token = getAccessToken();

    if (!token) {
        return true;
    }

    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
        return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;

    // Token is expired if current time + buffer is greater than expiration time
    return (currentTime + bufferSeconds) >= expirationTime;
};

/**
 * Get remaining time until token expiration in milliseconds
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export const getTokenExpirationTime = (): number => {
    const token = getAccessToken();

    if (!token) {
        return 0;
    }

    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) {
        return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;
    const remainingSeconds = expirationTime - currentTime;

    return remainingSeconds > 0 ? remainingSeconds * 1000 : 0;
};