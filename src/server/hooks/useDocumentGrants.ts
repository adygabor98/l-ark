import type {
    ApiResponse,
    DocumentGrantDetail
} from "@l-ark/types";
import {
    LIST_DOCUMENT_GRANTS
} from "../api/document/document-grant.queries";
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast";
import type {
    FetchResult
} from "@apollo/client";
import {
    GRANT_DOCUMENT_ACCESS,
    REVOKE_DOCUMENT_ACCESS
} from "../api/document/document-grant.mutations";

interface useDocumentGrantResponse {
   grants: DocumentGrantDetail[];
   retrieveGrantsBydocumentId: (variables: { documentId: number }) => FetchResult<{ data: DocumentGrantDetail[] }>;

   grantDocumentAccess: (variables: { documentId: number, grantedToId: string, expiresAt: string | null }) => FetchResult<{ data: ApiResponse }>
   revokeDocumentAccess: (variables: { grantId: number }) => FetchResult<{ data: ApiResponse }>
}

export const useDocumentGrants = (): useDocumentGrantResponse => {
    /** Retrieve all the grants for a specific document */
    const [ retrieveGrantsBydocumentId, { data: grantsData }] = useLazyQueryWithToast(LIST_DOCUMENT_GRANTS, { fetchPolicy: 'cache-and-network' });
    
    const [ grantDocumentAccess ] = useMutationWithToast(GRANT_DOCUMENT_ACCESS, { refetchQueries: ['gqlListDocumentGrants'] });
    const [ revokeDocumentAccess ] = useMutationWithToast(REVOKE_DOCUMENT_ACCESS, { refetchQueries: ['gqlListDocumentGrants'] });
    return {
        grants: grantsData?.data ?? [],
        retrieveGrantsBydocumentId: (variables: { documentId: number }) => retrieveGrantsBydocumentId({ variables: variables }) as FetchResult<{ data: DocumentGrantDetail[] }>,

        grantDocumentAccess: (variables: { documentId: number, grantedToId: string, expiresAt: string | null }) => grantDocumentAccess({ variables: variables }) as FetchResult<{ data: ApiResponse }>,
        revokeDocumentAccess: (variables: { grantId: number }) => revokeDocumentAccess({ variables: variables }) as FetchResult<{ data: ApiResponse }>
    };
}