import {
	useEffect,
	useRef
} from 'react';
import {
	useLazyQuery,
	useMutation,
	type LazyQueryHookOptions,
	type MutationHookOptions,
	type DocumentNode,
	type OperationVariables
} from '@apollo/client';
import {
	sileo
} from 'sileo';

export interface FieldError {
	field: string;
	message: string;
}

/**
 * Extracts field-level errors from an ApolloError.
 * Returns an array of { field, message } pairs parsed from graphQLErrors[].extensions.
 *
 * Usage in a react-hook-form submit handler:
 *   } catch (e) {
 *     extractFieldErrors(e).forEach(({ field, message }) => setError(field, { message }));
 *   }
 */
export const extractFieldErrors = (error: any): FieldError[] => {
	if (!error?.graphQLErrors?.length) return [];

	const result: FieldError[] = [];

	for (const gqlError of error.graphQLErrors) {
		const ext = gqlError.extensions;
		if (!ext) continue;

		// Single-field error: extensions.field + error message
		if (ext.field) {
			result.push({ field: ext.field, message: gqlError.message });
		}

		// Multi-field errors: extensions.errors = [{ field, message }]
		if (Array.isArray(ext.errors)) {
			for (const e of ext.errors) {
				if (e.field && e.message) {
					result.push({ field: e.field, message: e.message });
				}
			}
		}
	}

	return result;
};

/**
 * Formats GraphQL errors into a readable message.
 * When field errors are present they are listed explicitly; otherwise falls back to the raw message.
 */
const formatError = (error: any, fieldErrors?: FieldError[]): string => {
	if (fieldErrors && fieldErrors.length > 0) {
		return fieldErrors.map(({ field, message }) => `${field}: ${message}`).join(' · ');
	}

	if (error.graphQLErrors && error.graphQLErrors.length > 0) {
		return error.graphQLErrors.map((e: any) => e.message).join(', ');
	}

	if (error.networkError) {
		return `Network error: ${error.networkError.message}`;
	}

	return error.message || 'An unexpected error occurred';
};

/**
 * Returns the best display message for a toast from an ApiResponse.
 * When field errors are present, joins their messages; otherwise returns the top-level message.
 *
 * Usage:
 *   onToast({ message: getResponseMessage(response.data?.data), type: ... });
 */
export const getResponseMessage = (data: { message?: string; errors?: Array<{ field: string; message: string }> } | undefined): string => {
	if (data?.errors?.length) {
		return data.errors.map(({ message }) => message).join(' · ');
	}
	return data?.message ?? '';
};

/**
 * Applies field errors from an ApiResponse payload to a react-hook-form setError function.
 * Use this when a mutation resolves with success: false and includes an errors array.
 *
 * Usage:
 *   if (!response.data?.data?.success) {
 *     applyResponseErrors(response.data?.data?.errors, setError);
 *   }
 */
export const applyResponseErrors = (
	errors: Array<{ field: string; message: string }> | undefined,
	setError: (field: any, error: { message: string }) => void
): void => {
	errors?.forEach(({ field, message }) => setError(field, { message }));
};

type WithFieldErrors<T> = T & {
	/** Called when the error contains field-level validation info. Use with react-hook-form's setError. */
	onFieldErrors?: (errors: FieldError[]) => void;
};

/**
 * Custom useLazyQuery wrapper that automatically displays error toasts
 */
export const useLazyQueryWithToast = <TData = any, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode, options?: WithFieldErrors<LazyQueryHookOptions<TData, TVariables>>) => {
	const { onError, onFieldErrors, ...restOptions } = options || {};
	const result = useLazyQuery<TData, TVariables>(query, restOptions);
	const [, { error }] = result;
	const previousErrorRef = useRef(error);

	useEffect(() => {
		// Only show toast if error is new (not the same reference as before)
		if (error && error !== previousErrorRef.current) {
			const fieldErrors = extractFieldErrors(error);

			if (fieldErrors.length > 0 && onFieldErrors) {
				onFieldErrors(fieldErrors);
			}
			sileo.error({ title: 'Something Went Wrong', description: formatError(error, fieldErrors.length > 0 ? fieldErrors : undefined), duration: 4000 });

			if (onError) {
				onError(error);
			}
		}

		previousErrorRef.current = error;
	}, [error, onError, onFieldErrors]);

	return result;
};

/**
 * Custom useMutation wrapper that automatically displays error toasts
 */
export const useMutationWithToast = <TData = any, TVariables extends OperationVariables = OperationVariables>(mutation: DocumentNode, options?: WithFieldErrors<MutationHookOptions<TData, TVariables>>) => {
	const { onError, onFieldErrors, ...restOptions } = options || {};
	const result = useMutation<TData, TVariables>(mutation, restOptions);
	const [, { error }] = result;
	const previousErrorRef = useRef(error);

	useEffect(() => {
		// Only show toast if error is new (not the same reference as before)
		if (error && error !== previousErrorRef.current) {
			const fieldErrors = extractFieldErrors(error);

			if (fieldErrors.length > 0 && onFieldErrors) {
				onFieldErrors(fieldErrors);
			}
			sileo.error({ title: 'Something Went Wrong', description: formatError(error, fieldErrors.length > 0 ? fieldErrors : undefined), duration: 4000 });

			if (onError) {
				onError(error);
			}
		}

		previousErrorRef.current = error;
	}, [error, onError, onFieldErrors]);

	return result;
};
