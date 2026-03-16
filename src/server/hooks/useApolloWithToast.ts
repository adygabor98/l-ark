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

/**
 * Formats GraphQL errors into a readable message
 */
const formatError = (error: any): string => {
	if (error.graphQLErrors && error.graphQLErrors.length > 0) {
		return error.graphQLErrors.map((e: any) => e.message).join(', ');
	}

	if (error.networkError) {
		return `Network error: ${error.networkError.message}`;
	}

	return error.message || 'An unexpected error occurred';
};

/**
 * Custom useLazyQuery wrapper that automatically displays error toasts
 */
export const useLazyQueryWithToast = <TData = any, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode, options?: LazyQueryHookOptions<TData, TVariables>) => {
	const { onError, ...restOptions } = options || {};
	const result = useLazyQuery<TData, TVariables>(query, restOptions);
	const [, { error }] = result;
	const previousErrorRef = useRef(error);

	useEffect(() => {
		// Only show toast if error is new (not the same reference as before)
		if (error && error !== previousErrorRef.current) {
			sileo.error({ title: 'Something Went Wrong', description: formatError(error), duration: 4000 });

			// Call the original onError callback if provided
			if (onError) {
				onError(error);
			}
		}

		previousErrorRef.current = error;
	}, [error, onError]);

	return result;
};

/**
 * Custom useMutation wrapper that automatically displays error toasts
 */
export const useMutationWithToast = <TData = any, TVariables extends OperationVariables = OperationVariables>(mutation: DocumentNode, options?: MutationHookOptions<TData, TVariables>) => {
	const { onError, ...restOptions } = options || {};
	const result = useMutation<TData, TVariables>(mutation, restOptions);
	const [, { error }] = result;
	const previousErrorRef = useRef(error);
	
	useEffect(() => {
		// Only show toast if error is new (not the same reference as before)
		if (error && error !== previousErrorRef.current) {
			sileo.error({ title: 'Something Went Wrong', description: formatError(error), duration: 4000 });

			// Call the original onError callback if provided
			if (onError) {
				onError(error);
			}
		}

		previousErrorRef.current = error;
	}, [error, onError]);

	return result;
};
