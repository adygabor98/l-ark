import { gql } from "@apollo/client";

export const SHARED_DOCUMENT_DETAIL = gql`
    fragment SharedDocumentDetail on SharedDocument {
        id
        expiresAt
        createdAt
        grantedBy {
            id
            firstName
            lastName
            email
        }
        document {
            id
            fileName
            mimeType
            fileSize
            createdAt
            uploadedBy {
                id
                firstName
                lastName
            }
            stepInstance {
                id
                instance {
                    id
                    title
                    code
                }
            }
        }
    }
`;

export const LIST_DOCUMENTS_SHARED_WITH_ME = gql`
    ${ SHARED_DOCUMENT_DETAIL }

    query gqlListDocumentsSharedWithMe {
        data: gqlListDocumentsSharedWithMe {
            ...SharedDocumentDetail
        }
    }
`;
