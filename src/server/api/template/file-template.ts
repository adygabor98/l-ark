import {
    gql
} from "@apollo/client";
import {
    API_FILE_TEMPLATE_GENERIC_RESPONSE,
    EXPORT_LAYOUT_API_RESPONSE,
    EXPORT_LAYOUT_FIELDS,
    FILE_TEMPLATE_DETAIL,
    FILE_TEMPLATES_SUMMARY,
    FORM_INSTANCE_DETAIL
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

export const DUPLICATE_FILE_TEMPLATE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlDuplicateFileTemplate($id: ID!) {
        data: gqlDuplicateFileTemplate(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const ARCHIVE_FILE_TEMPLATE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlArchiveFileTemplate($id: ID!) {
        data: gqlArchiveFileTemplate(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const RESTORE_FILE_TEMPLATE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlRestoreFileTemplate($id: ID!) {
        data: gqlRestoreFileTemplate(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const DELETE_FILE_TEMPLATE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlDeleteFileTemplate($id: ID!) {
        data: gqlDeleteFileTemplate(id: $id) {
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

/**************************************************************************** */
/************************ FORM INSTANCE QUERIES ***************************** */
/**************************************************************************** */

export const RETRIEVE_FORM_INSTANCE = gql`
    ${FORM_INSTANCE_DETAIL}

    query gqlRetrieveFormInstance($id: ID!) {
        data: gqlRetrieveFormInstance(id: $id) {
            ...FormInstanceDetail
        }
    }
`;

/**************************************************************************** */
/************************ FORM INSTANCE MUTATIONS *************************** */
/**************************************************************************** */

export const CREATE_FORM_INSTANCE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlCreateFormInstance($input: CreateFormInstanceInput!) {
        data: gqlCreateFormInstance(input: $input) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const SAVE_FORM_INSTANCE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlUpdateFormInstance($id: ID!, $input: SaveFormInstanceInput!) {
        data: gqlUpdateFormInstance(id: $id, input: $input) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const SUBMIT_FORM_INSTANCE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlPublishFormInstance($id: ID!) {
        data: gqlPublishFormInstance(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const REMOVE_FORM_INSTANCE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlRemoveFormInstance($id: ID!) {
        data: gqlRemoveFormInstance(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

export const RENAME_FORM_INSTANCE = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlRenameFormInstance($id: ID!, $input: RenameFormInstanceInput!) {
        data: gqlRenameFormInstance(id: $id, input: $input) {
            ...FileTemplateApiGenericResponse
        }
    }
`;

/**************************************************************************** */
/******************* TEMPLATE FIELD MAPPING QUERIES ************************* */
/**************************************************************************** */

const TEMPLATE_FIELD_MAPPING_FIELDS = gql`
    fragment TemplateFieldMappingFields on TemplateFieldMapping {
        id
        sourceVersionId
        sourceFieldStableId
        targetVersionId
        targetFieldStableId
        sourceVersion {
            id
            versionNumber
            template {
                id
                title
            }
            sections {
                id
                fields {
                    id
                    stableId
                    label
                    type
                }
            }
        }
        targetVersion {
            id
            versionNumber
            template {
                id
                title
            }
            sections {
                id
                fields {
                    id
                    stableId
                    label
                    type
                }
            }
        }
    }
`;

export const GET_TEMPLATE_MAPPINGS_FOR_TARGET_VERSION = gql`
    ${TEMPLATE_FIELD_MAPPING_FIELDS}

    query gqlGetTemplateMappingsForTargetVersion($targetVersionId: ID!) {
        data: gqlGetTemplateMappingsForTargetVersion(targetVersionId: $targetVersionId) {
            ...TemplateFieldMappingFields
        }
    }
`;

export const GET_TEMPLATE_MAPPINGS_FOR_SOURCE_VERSION = gql`
    ${TEMPLATE_FIELD_MAPPING_FIELDS}

    query gqlGetTemplateMappingsForSourceVersion($sourceVersionId: ID!) {
        data: gqlGetTemplateMappingsForSourceVersion(sourceVersionId: $sourceVersionId) {
            ...TemplateFieldMappingFields
        }
    }
`;

/**************************************************************************** */
/****************** TEMPLATE FIELD MAPPING MUTATIONS ************************ */
/**************************************************************************** */

export const CREATE_TEMPLATE_FIELD_MAPPING = gql`
    ${TEMPLATE_FIELD_MAPPING_FIELDS}

    mutation gqlCreateTemplateFieldMapping($input: CreateTemplateFieldMappingInput!) {
        data: gqlCreateTemplateFieldMapping(input: $input) {
            ...TemplateFieldMappingFields
        }
    }
`;

export const DELETE_TEMPLATE_FIELD_MAPPING = gql`
    ${API_FILE_TEMPLATE_GENERIC_RESPONSE}

    mutation gqlDeleteTemplateFieldMapping($id: ID!) {
        data: gqlDeleteTemplateFieldMapping(id: $id) {
            ...FileTemplateApiGenericResponse
        }
    }
`;
