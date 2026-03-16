import {
    gql
} from "@apollo/client";
import {
    API_FILE_TEMPLATE_GENERIC_RESPONSE,
    EXPORT_LAYOUT_API_RESPONSE,
    EXPORT_LAYOUT_FIELDS,
    FILE_TEMPLATE_DETAIL,
    FILE_TEMPLATES_SUMMARY
} from "./file-template.fragment";

/**************************************************************************** */
/************************* QUERIES FILE TEMPLATE **************************** */
/**************************************************************************** */

export const RETRIEVE_FILE_TEMPLATES = gql`
    ${FILE_TEMPLATES_SUMMARY}

    query gqlRetrieveFileTemplates {
        data: gqlRetrieveFileTemplates {
            ...FileTemplatesSummary
        }
    }
`;

export const RETRIEVE_FILE_TEMPLATE_BY_ID = gql`
    ${FILE_TEMPLATE_DETAIL}

    query gqlRetrieveFileTemplateById($id: ID!) {
        data: gqlRetrieveFileTemplateById(id: $id) {
            ...FileTemplateDetail
        }
    }
`;

export const RETRIEVE_FILE_TEMPLATE_EXPORT_LAYOUT = gql`
    ${EXPORT_LAYOUT_FIELDS}

    query gqlRetrieveFileTemplateExportLayout($templateVersionId: ID!) {
        data: gqlRetrieveFileTemplateExportLayout(templateVersionId: $templateVersionId) {
            ...ExportLayoutFields
        }
    }
`;

/**************************************************************************** */
/************************ MUTATION FILE TEMPLATE **************************** */
/**************************************************************************** */

export const CREATE_FILE_TEMPLATE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlCreateFileTemplate($input: FileTemplateInput!) {
        data: gqlCreateFileTemplate(input: $input) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const UPDATE_FILE_TEMPLATE_BY_ID = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlUpdateFileTemplate($id: ID!, $input: FileTemplateInput!) {
        data: gqlUpdateFileTemplate(id: $id, input: $input) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const PUBLISH_FILE_TEMPLATE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlPublishFileTemplate($id: ID!) {
        data: gqlPublishFileTemplate(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const DELETE_FILE_TEMPLATE_VERSION = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlDeleteFileTemplateVersion($id: ID!) {
        data: gqlDeleteFileTemplateVersion(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const SAVE_FILE_TEMPLATE_EXPORT_LAYOUT = gql`
    ${EXPORT_LAYOUT_API_RESPONSE}

    mutation gqlSaveFileTemplateExportLayout($templateVersionId: ID!, $input: ExportLayoutInput!) {
        data: gqlSaveFileTemplateExportLayout(templateVersionId: $templateVersionId, input: $input) {
            ...ExportLayoutApiResponse
        }
    }
`;
