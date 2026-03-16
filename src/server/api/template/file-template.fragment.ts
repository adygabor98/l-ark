import {
    gql
} from "@apollo/client";

export const FILE_TEMPLATES_SUMMARY = gql`
    fragment FileTemplatesSummary on FileTemplate {
        id
        title
        description

        status
        updatedAt

        createdBy {
            id
            firstName
            lastName
        }

        versions {
            id
            versionNumber
            status
        }

        divisions {
            id
            division {
                id
                name
            }
        }
    }
`;

export const FILE_TEMPLATE_DETAIL = gql`
    fragment FileTemplateDetail on FileTemplate {
        id
        title
        description
        status

        versions {
            id
            templateId
            versionNumber
            isLatest

            sections {
                id
                title
                description
                sortOrder

                fields {
                    id
                    type
                    label
                    required
                    sortOrder

                    placeholder
                    helpText
                    width

                    format
                    multiple

                    options
                    columns
                }
            }
        }

        divisions {
            id
            divisionId
            division {
                id
                name
            }
        }
    }
`;

export const API_FILE_TEMPLATE_RESPONSE = gql`
    ${FILE_TEMPLATE_DETAIL}
    
    fragment FileTemplateApiResponse on ApiResponse {
        success
        message
        data {
            ...FileTemplateDetail
        }
        errors {
            field
            message
        }
    }
`;

export const API_FILE_TEMPLATE_GENERIC_RESPONSE = gql`
    
    fragment FileTemplateApiGenericResponse on ApiResponse {
        success
        message
        errors {
            field
            message
        }
    }
`;

export const EXPORT_LAYOUT_FIELDS = gql`
    fragment ExportLayoutFields on TemplateExportLayout {
        id
        templateVersionId
        layoutData
        createdAt
        updatedAt
    }
`;

export const EXPORT_LAYOUT_API_RESPONSE = gql`
    fragment ExportLayoutApiResponse on ApiResponse {
        success
        message
        errors {
            field
            message
        }
    }
`;