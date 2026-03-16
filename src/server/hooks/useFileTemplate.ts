import type {
    FetchResult
} from "@apollo/client";
import {
    CREATE_FILE_TEMPLATE,
    DELETE_FILE_TEMPLATE_VERSION,
    PUBLISH_FILE_TEMPLATE,
    RETRIEVE_FILE_TEMPLATE_EXPORT_LAYOUT,
    RETRIEVE_FILE_TEMPLATE_BY_ID,
    RETRIEVE_FILE_TEMPLATES,
    SAVE_FILE_TEMPLATE_EXPORT_LAYOUT,
    UPDATE_FILE_TEMPLATE_BY_ID
} from "../api/template/file-template"
import {
    useLazyQueryWithToast,
    useMutationWithToast
} from "./useApolloWithToast"
import type {
    ApiResponse,
    FileTemplateDetail,
    FileTemplateSummary,
    FileTemplateInput,
    FileTemplateExportLayout,
    FileTemplateExportLayoutInput
} from "@l-ark/types";

interface useFileTemplateResponse {
    fileTemplates: Array<FileTemplateSummary>;
    retrieveFileTemplates: () => FetchResult<{ data: Array<FileTemplateSummary> }>;
    
    fileTemplate: FileTemplateDetail;
    retrieveFileTemplateById: (variables: { id: number }) => FetchResult<{ data: FileTemplateDetail }>;

    fileTemplateExport: FileTemplateExportLayout;
    retrieveFileTemplateExportLayout: (variables: { templateVersionId: number }) => FetchResult<{ data: FileTemplateExportLayout }>;

    createFileTemplate: (variables: { input: FileTemplateInput}) => FetchResult<{ data: ApiResponse<number> }>;
    updateFileTemplate: (variables: { id: number, input: FileTemplateInput}) => FetchResult<{ data: ApiResponse<number> }>;
    publishFileTemplate: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    deleteLatestVersion: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;

    savefileTemplateExportLayout: (variables: { templateVersionId: number, input: FileTemplateExportLayoutInput }) => FetchResult<{ data: ApiResponse<number> }>;
}

export const useFileTemplate = (): useFileTemplateResponse => {
    /** Manage to retrieve the full list of file templates */
    const [retrieveFileTemplates, { data: fileTemplatesData }] = useLazyQueryWithToast(RETRIEVE_FILE_TEMPLATES, { fetchPolicy: 'cache-and-network' });
    /** Manage to retrieve the full information of file templates of a specific id */
    const [retrieveFileTemplateById, { data: fileTemplateData }] = useLazyQueryWithToast(RETRIEVE_FILE_TEMPLATE_BY_ID, { fetchPolicy: 'cache-and-network' });
    /** Manage to retrieve the export layout of a specific file template */
    const [retrieveFileTemplateExportLayout, { data: fileTemplateExportData }] = useLazyQueryWithToast(RETRIEVE_FILE_TEMPLATE_EXPORT_LAYOUT, { fetchPolicy: "network-only" });

    /** Manage to create a new file template */
    const [ createFileTemplate ] = useMutationWithToast(CREATE_FILE_TEMPLATE);
    /** Manage to update an existing file template */
    const [ updateFileTemplate ] = useMutationWithToast(UPDATE_FILE_TEMPLATE_BY_ID, { refetchQueries: ['gqlRetrieveFileTemplateById'] });
    /** Manage to publish an existing file template */
    const [ publishFileTemplate ] = useMutationWithToast(PUBLISH_FILE_TEMPLATE, { refetchQueries: ['gqlRetrieveFileTemplateById'] });
    /** Manage to delete the latest unpublished version of an existing file template */
    const [ deleteLatestVersion ] = useMutationWithToast(DELETE_FILE_TEMPLATE_VERSION, { refetchQueries: ['gqlRetrieveFileTemplateById'] });

    /** Manage to create a new export file template */
    const [savefileTemplateExportLayout] = useMutationWithToast(SAVE_FILE_TEMPLATE_EXPORT_LAYOUT, { refetchQueries: ['gqlRetrieveFileTemplateById'] });

    return {
        fileTemplates: fileTemplatesData?.data ?? [],
        retrieveFileTemplates: () => retrieveFileTemplates() as FetchResult<{ data: Array<FileTemplateSummary> }>,

        fileTemplate: fileTemplateData?.data ?? {},
        retrieveFileTemplateById: (variables: { id: number }) => retrieveFileTemplateById({ variables: variables }) as FetchResult<{ data: FileTemplateDetail }>,

        fileTemplateExport: fileTemplateExportData?.data ?? {},
        retrieveFileTemplateExportLayout: (variables: { templateVersionId: number }) => retrieveFileTemplateExportLayout({ variables: variables }) as FetchResult<{ data: FileTemplateExportLayout }>,

        createFileTemplate: (variables: { input: FileTemplateInput}) => createFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        updateFileTemplate: (variables: { id: number, input: FileTemplateInput}) => updateFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        publishFileTemplate: (variables: { id: number }) => publishFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        deleteLatestVersion: (variables: { id: number }) => deleteLatestVersion({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,

        savefileTemplateExportLayout: (variables: { templateVersionId: number, input: FileTemplateExportLayoutInput }) => savefileTemplateExportLayout({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>
    }
}