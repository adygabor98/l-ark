import { gql } from "@apollo/client";

export const DOCUMENT_GRANT_DETAIL = gql`
    fragment DocumentGrantDetail on DocumentGrant {
        id
        expiresAt
        createdAt
        grantedTo {
            id
            firstName
            lastName
            email
            role {
                code
            }
        }
        grantedBy {
            id
            firstName
            lastName
        }
    }
`;

export const API_DOCUMENT_ACCESS_GRANT_RESPONSE = gql`
    fragment DocumentAccessGrantApiResponse on ApiResponse {
        success
        message
        errors {
            field
            message
        }
    }
`;
