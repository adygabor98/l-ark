import { getAccessToken } from '../shared/helpers/auth';

const SERVER_HOST = import.meta.env.VITE_SERVER_HOST as string;

export interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiFailure {
    success: false;
    message: string;
    status?: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: BodyInit | null;
    /** Optional progress callback for uploads. Falls back to XMLHttpRequest. */
    onUploadProgress?: (loaded: number, total: number) => void;
    /** When set, the response is parsed as a Blob instead of JSON. */
    responseType?: 'json' | 'blob';
}

const buildHeaders = (init?: Record<string, string>, body?: BodyInit | null): Record<string, string> => {
    const headers: Record<string, string> = { ...init };
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Don't set Content-Type for FormData — the browser must set the boundary itself.
    if (body && !(body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

const formatFailure = (status: number, message: string): ApiFailure => ({
    success: false,
    message,
    status,
});

/**
 * Centralised REST client for the Fastify routes that sit beside Apollo
 * (document upload/download/OTP/grants). Adds the JWT, normalises error
 * shapes, and surfaces upload progress via XMLHttpRequest when requested.
 *
 * Apollo handles the GraphQL surface; this client handles the file-transfer
 * routes that GraphQL can't model cleanly.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const url = `${SERVER_HOST}${path}`;

    if (options.onUploadProgress && options.body instanceof FormData) {
        return uploadWithProgress<T>(url, options);
    }

    try {
        const response = await fetch(url, {
            method: options.method ?? 'GET',
            headers: buildHeaders(options.headers, options.body ?? null),
            body: options.body ?? null,
        });

        if (!response.ok && response.status >= 400) {
            // Try to read the error message from the body, but don't blow up on non-JSON.
            let message = `Request failed (${response.status})`;
            try {
                const errBody = await response.json();
                message = errBody?.message ?? message;
            } catch { /* swallow non-JSON */ }
            return formatFailure(response.status, message);
        }

        if (options.responseType === 'blob') {
            const blob = await response.blob();
            return { success: true, data: blob as unknown as T };
        }

        const json = await response.json();
        if (json && typeof json === 'object' && 'success' in json) {
            // Server responses already use the `{ success, data, message }` envelope.
            return json as ApiResult<T>;
        }
        return { success: true, data: json as T };
    } catch (err) {
        return formatFailure(0, err instanceof Error ? err.message : 'Network error');
    }
}

function uploadWithProgress<T>(url: string, options: RequestOptions): Promise<ApiResult<T>> {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method ?? 'POST', url);

        for (const [k, v] of Object.entries(buildHeaders(options.headers, options.body ?? null))) {
            xhr.setRequestHeader(k, v);
        }

        if (options.onUploadProgress) {
            xhr.upload.onprogress = e => {
                if (e.lengthComputable) options.onUploadProgress!(e.loaded, e.total);
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 400) {
                let message = `Request failed (${xhr.status})`;
                try {
                    const errBody = JSON.parse(xhr.responseText);
                    message = errBody?.message ?? message;
                } catch { /* non-JSON */ }
                resolve(formatFailure(xhr.status, message));
                return;
            }
            try {
                const parsed = JSON.parse(xhr.responseText);
                if (parsed && typeof parsed === 'object' && 'success' in parsed) {
                    resolve(parsed as ApiResult<T>);
                } else {
                    resolve({ success: true, data: parsed as T });
                }
            } catch {
                resolve(formatFailure(xhr.status, 'Invalid JSON response'));
            }
        };
        xhr.onerror = () => resolve(formatFailure(0, 'Network error'));

        xhr.send(options.body as BodyInit);
    });
}

export const apiClient = {
    get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResult<T>> {
        return request<T>(path, { ...options, method: 'GET' });
    },
    post<T>(path: string, body: BodyInit | object | null, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResult<T>> {
        const finalBody = body instanceof FormData || body == null
            ? body
            : JSON.stringify(body);
        return request<T>(path, { ...options, method: 'POST', body: finalBody });
    },
    patch<T>(path: string, body: object | null, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResult<T>> {
        return request<T>(path, {
            ...options,
            method: 'PATCH',
            body: body == null ? null : JSON.stringify(body),
        });
    },
    delete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResult<T>> {
        return request<T>(path, { ...options, method: 'DELETE' });
    },
};
