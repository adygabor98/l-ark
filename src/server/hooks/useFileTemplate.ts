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
    UPDATE_FILE_TEMPLATE_BY_ID,
    DUPLICATE_FILE_TEMPLATE,
    ARCHIVE_FILE_TEMPLATE,
    RESTORE_FILE_TEMPLATE,
    DELETE_FILE_TEMPLATE,
    RETRIEVE_FORM_INSTANCE,
    CREATE_FORM_INSTANCE,
    SAVE_FORM_INSTANCE,
    SUBMIT_FORM_INSTANCE,
    REMOVE_FORM_INSTANCE
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

interface FormFieldValueInput {
    fieldId: string;
    value: unknown;
}

interface CreateFormInstanceInput {
    templateId: string;
    stepInstanceId: string;
    fieldValues?: FormFieldValueInput[];
}

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
    duplicateFileTemplate: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    archiveFileTemplate: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    restoreFileTemplate: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    deleteFileTemplate: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;

    savefileTemplateExportLayout: (variables: { templateVersionId: number, input: FileTemplateExportLayoutInput }) => FetchResult<{ data: ApiResponse<number> }>;

    formInstance: any;
    retrieveFormInstance: (variables: { id: number }) => FetchResult<{ data: any }>;
    createFormInstance: (variables: { input: CreateFormInstanceInput }) => FetchResult<{ data: ApiResponse<number> }>;
    saveFormInstance: (variables: { id: number; input: { fieldValues: FormFieldValueInput[] } }) => FetchResult<{ data: ApiResponse<number> }>;
    submitFormInstance: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    removeFormInstance: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
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
    /** Manage to duplicate an existing file template */
    const [ duplicateFileTemplate ] = useMutationWithToast(DUPLICATE_FILE_TEMPLATE, { refetchQueries: ['gqlRetrieveFileTemplates'] });
    /** Manage to archive an existing file template */
    const [ archiveFileTemplate ] = useMutationWithToast(ARCHIVE_FILE_TEMPLATE, { refetchQueries: ['gqlRetrieveFileTemplates'] });
    /** Manage to restore an archived file template back to ACTIVE */
    const [ restoreFileTemplate ] = useMutationWithToast(RESTORE_FILE_TEMPLATE, { refetchQueries: ['gqlRetrieveFileTemplates'] });
    /** Manage to permanently delete a file template */
    const [ deleteFileTemplate ] = useMutationWithToast(DELETE_FILE_TEMPLATE, { refetchQueries: ['gqlRetrieveFileTemplates'] });

    /** Manage to create a new export file template */
    const [savefileTemplateExportLayout] = useMutationWithToast(SAVE_FILE_TEMPLATE_EXPORT_LAYOUT, { refetchQueries: ['gqlRetrieveFileTemplateById'] });

    /** Retrieve a form instance by ID */
    const [retrieveFormInstance, { data: formInstanceData }] = useLazyQueryWithToast(RETRIEVE_FORM_INSTANCE, { fetchPolicy: 'network-only' });
    /** Create a new form instance */
    const [createFormInstance] = useMutationWithToast(CREATE_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Save field values for a form instance */
    const [saveFormInstance] = useMutationWithToast(SAVE_FORM_INSTANCE);
    /** Submit a form instance */
    const [submitFormInstance] = useMutationWithToast(SUBMIT_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Remove a form instance */
    const [removeFormInstance] = useMutationWithToast(REMOVE_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });

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
        duplicateFileTemplate: (variables: { id: number }) => duplicateFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        archiveFileTemplate: (variables: { id: number }) => archiveFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        restoreFileTemplate: (variables: { id: number }) => restoreFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,
        deleteFileTemplate: (variables: { id: number }) => deleteFileTemplate({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,

        savefileTemplateExportLayout: (variables: { templateVersionId: number, input: FileTemplateExportLayoutInput }) => savefileTemplateExportLayout({ variables: variables }) as FetchResult<{ data: ApiResponse<number> }>,

        formInstance: formInstanceData?.data ?? null,
        retrieveFormInstance: (variables: { id: number }) => retrieveFormInstance({ variables }) as FetchResult<{ data: any }>,
        createFormInstance: (variables: { input: CreateFormInstanceInput }) => createFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        saveFormInstance: (variables: { id: number; input: { fieldValues: FormFieldValueInput[] } }) => saveFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        submitFormInstance: (variables: { id: number }) => submitFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        removeFormInstance: (variables: { id: number }) => removeFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>
    }
}