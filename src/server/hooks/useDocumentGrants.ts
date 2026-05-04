import type {
    ApiResponse,
    DocumentGrantDetail,
    SharedDocumentDetail
} from "@l-ark/types";
import {
    LIST_DOCUMENT_GRANTS
} from "../api/document/document-grant.queries";
import {
    LIST_DOCUMENTS_SHARED_WITH_ME
} from "../api/document/document-shared.queries";
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

   sharedDocuments: SharedDocumentDetail[];
   retrieveSharedDocuments: () => FetchResult<{ data: SharedDocumentDetail[] }>;

   grantDocumentAccess: (variables: { documentId: number, grantedToId: string, expiresAt: string | null }) => FetchResult<{ data: ApiResponse }>
   revokeDocumentAccess: (variables: { grantId: number }) => FetchResult<{ data: ApiResponse }>
}

export const useDocumentGrants = (): useDocumentGrantResponse => {
    /** Retrieve all the grants for a specific document */
    const [ retrieveGrantsBydocumentId, { data: grantsData }] = useLazyQueryWithToast(LIST_DOCUMENT_GRANTS, { fetchPolicy: 'cache-and-network' });

    /** Retrieve all the documents shared with the current user */
    const [ retrieveSharedDocuments, { data: sharedDocumentsData }] = useLazyQueryWithToast(LIST_DOCUMENTS_SHARED_WITH_ME, { fetchPolicy: 'cache-and-network' });

    const [ grantDocumentAccess ] = useMutationWithToast(GRANT_DOCUMENT_ACCESS, { refetchQueries: ['gqlListDocumentGrants', 'gqlListDocumentsSharedWithMe'] });
    const [ revokeDocumentAccess ] = useMutationWithToast(REVOKE_DOCUMENT_ACCESS, { refetchQueries: ['gqlListDocumentGrants', 'gqlListDocumentsSharedWithMe'] });
    return {
        grants: grantsData?.data ?? [],
        retrieveGrantsBydocumentId: (variables: { documentId: number }) => retrieveGrantsBydocumentId({ variables: variables }) as FetchResult<{ data: DocumentGrantDetail[] }>,

        sharedDocuments: sharedDocumentsData?.data ?? [],
        retrieveSharedDocuments: () => retrieveSharedDocuments() as FetchResult<{ data: SharedDocumentDetail[] }>,

        grantDocumentAccess: (variables: { documentId: number, grantedToId: string, expiresAt: string | null }) => grantDocumentAccess({ variables: variables }) as FetchResult<{ data: ApiResponse }>,
        revokeDocumentAccess: (variables: { grantId: number }) => revokeDocumentAccess({ variables: variables }) as FetchResult<{ data: ApiResponse }>
    };
}