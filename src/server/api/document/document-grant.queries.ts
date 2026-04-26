import {
    gql
} from "@apollo/client";
import {
    DOCUMENT_GRANT_DETAIL
} from "./document-grant.fragments";

export const LIST_DOCUMENT_GRANTS = gql`
    ${ DOCUMENT_GRANT_DETAIL }

    query gqlListDocumentGrants($documentId: ID!) {
        data: gqlListDocumentGrants(documentId: $documentId) {
            ...DocumentGrantDetail
        }
    }
`;
