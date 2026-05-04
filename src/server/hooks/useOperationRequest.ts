import type { FetchResult } from "@apollo/client";
import { RETRIEVE_OPERATION_REQUESTS } from "../api/operation/operation-request.queries";
import { HANDLE_OPERATION_REQUEST } from "../api/operation/operation-instance.mutations";
import { useLazyQueryWithToast, useMutationWithToast } from "./useApolloWithToast";
import type { ApiResponse, OperationRequest } from "@l-ark/types";

interface UseOperationRequestApiResponse {
    requests: OperationRequest[];
    retrieveRequests: (variables?: { status?: string; targetUserId?: string }) => FetchResult<{ data: OperationRequest[] }>;
    handleRequest: (variables: { input: { requestId: number; action: 'APPROVED' | 'REJECTED'; rejectionReason?: string } }) => FetchResult<{ data: ApiResponse }>;
}

export const useOperationRequest = (): UseOperationRequestApiResponse => {
    const [retrieveRequests, { data: requestsData }] = useLazyQueryWithToast(RETRIEVE_OPERATION_REQUESTS, { fetchPolicy: 'cache-and-network' });
    const [handleRequest] = useMutationWithToast(HANDLE_OPERATION_REQUEST, { refetchQueries: ['gqlRetrieveOperationRequests'] });

    return {
        requests: requestsData?.data ?? [],
        retrieveRequests: (variables?: { status?: string; targetUserId?: string }) => retrieveRequests({ variables }) as FetchResult<{ data: OperationRequest[] }>,
        handleRequest: (variables: { input: { requestId: number; action: 'APPROVED' | 'REJECTED'; rejectionReason?: string } }) => handleRequest({ variables }) as FetchResult<{ data: ApiResponse }>,
    };
};
