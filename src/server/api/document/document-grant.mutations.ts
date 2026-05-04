import {
    gql
} from "@apollo/client";
import {
    API_DOCUMENT_ACCESS_GRANT_RESPONSE
} from "./document-grant.fragments";

export const GRANT_DOCUMENT_ACCESS = gql`
    ${ API_DOCUMENT_ACCESS_GRANT_RESPONSE }

    mutation gqlGrantDocumentAccess($documentId: ID!, $grantedToId: ID!, $expiresAt: String) {
        data: gqlGrantDocumentAccess(documentId: $documentId, grantedToId: $grantedToId, expiresAt: $expiresAt) {
            ...DocumentAccessGrantApiResponse
        }
    }
`;

export const REVOKE_DOCUMENT_ACCESS = gql`
    ${ API_DOCUMENT_ACCESS_GRANT_RESPONSE }

    mutation gqlRevokeDocumentAccess($grantId: ID!) {
        data: gqlRevokeDocumentAccess(grantId: $grantId) {
            ...DocumentAccessGrantApiResponse
        }
    }
`;
