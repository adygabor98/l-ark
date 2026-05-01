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
    REMOVE_FORM_INSTANCE,
    RENAME_FORM_INSTANCE,
    GET_TEMPLATE_MAPPINGS_FOR_TARGET_VERSION,
    GET_TEMPLATE_MAPPINGS_FOR_SOURCE_VERSION,
    CREATE_TEMPLATE_FIELD_MAPPING,
    DELETE_TEMPLATE_FIELD_MAPPING
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
    FileTemplateExportLayoutInput,
    FileTemplateInstance
} from "@l-ark/types";

interface FormFieldValueInput {
    fieldId: string;
    value: unknown;
}

interface CreateFormInstanceInput {
    templateId: number;
    stepInstanceId: number;
    fieldValues?: FormFieldValueInput[];
}

export interface TemplateFieldMapping {
    id: string;
    sourceVersionId: number;
    sourceFieldStableId: string;
    targetVersionId: number;
    targetFieldStableId: string;
    sourceVersion?: {
        id: string;
        versionNumber: number;
        template?: { id: string; title: string };
        sections?: Array<{ id: string; fields: Array<{ id: string; stableId: string; label: string; type: string }> }>;
    };
    targetVersion?: {
        id: string;
        versionNumber: number;
        template?: { id: string; title: string };
        sections?: Array<{ id: string; fields: Array<{ id: string; stableId: string; label: string; type: string }> }>;
    };
}

interface CreateTemplateFieldMappingInput {
    sourceVersionId: number;
    sourceFieldStableId: string;
    targetVersionId: number;
    targetFieldStableId: string;
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

    formInstance: FileTemplateInstance;
    retrieveFormInstanceById: (variables: { id: number }) => FetchResult<{ data: FileTemplateInstance }>;
    
    createFormInstance: (variables: { input: CreateFormInstanceInput }) => FetchResult<{ data: ApiResponse<number> }>;
    updateFormInstance: (variables: { id: number; input: { fieldValues: FormFieldValueInput[] } }) => FetchResult<{ data: ApiResponse<number> }>;
    publishFormInstance: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    removeFormInstance: (variables: { id: number }) => FetchResult<{ data: ApiResponse<number> }>;
    renameFormInstance: (variables: { id: number; input: { displayName: string | null } }) => FetchResult<{ data: ApiResponse<number> }>;

    templateMappingsForTarget: TemplateFieldMapping[];
    getTemplateMappingsForTargetVersion: (variables: { targetVersionId: number }) => Promise<FetchResult<{ data: TemplateFieldMapping[] }>>;
    getTemplateMappingsForSourceVersion: (variables: { sourceVersionId: number }) => Promise<FetchResult<{ data: TemplateFieldMapping[] }>>;
    createTemplateFieldMapping: (variables: { input: CreateTemplateFieldMappingInput }) => Promise<FetchResult<{ data: TemplateFieldMapping }>>;
    deleteTemplateFieldMapping: (variables: { id: number }) => Promise<FetchResult<{ data: ApiResponse<number> }>>;
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
    const [ savefileTemplateExportLayout ] = useMutationWithToast(SAVE_FILE_TEMPLATE_EXPORT_LAYOUT, { refetchQueries: ['gqlRetrieveFileTemplateById'] });

    /** Retrieve a form instance by ID */
    const [ retrieveFormInstanceById, { data: formInstanceData } ] = useLazyQueryWithToast(RETRIEVE_FORM_INSTANCE, { fetchPolicy: 'network-only' });
    /** Create a new form instance */
    const [ createFormInstance ] = useMutationWithToast(CREATE_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Save field values for a form instance */
    const [ updateFormInstance ] = useMutationWithToast(SAVE_FORM_INSTANCE, { refetchQueries : ['gqlRetrieveInstanceById']});
    /** Submit a form instance */
    const [ publishFormInstance ] = useMutationWithToast(SUBMIT_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Remove a form instance */
    const [ removeFormInstance ] = useMutationWithToast(REMOVE_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });
    /** Rename a form instance (set or clear displayName) */
    const [ renameFormInstance ] = useMutationWithToast(RENAME_FORM_INSTANCE, { refetchQueries: ['gqlRetrieveInstanceById'] });

    /** Field mapping queries */
    const [ getTemplateMappingsForTargetVersion, { data: mappingsForTargetData } ] = useLazyQueryWithToast(GET_TEMPLATE_MAPPINGS_FOR_TARGET_VERSION, { fetchPolicy: 'network-only' });
    const [ getTemplateMappingsForSourceVersion ] = useLazyQueryWithToast(GET_TEMPLATE_MAPPINGS_FOR_SOURCE_VERSION, { fetchPolicy: 'network-only' });
    /** Field mapping mutations */
    const [ createTemplateFieldMapping ] = useMutationWithToast(CREATE_TEMPLATE_FIELD_MAPPING);
    const [ deleteTemplateFieldMapping ] = useMutationWithToast(DELETE_TEMPLATE_FIELD_MAPPING);

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
        retrieveFormInstanceById: (variables: { id: number }) => retrieveFormInstanceById({ variables }) as FetchResult<{ data: FileTemplateInstance }>,

        createFormInstance: (variables: { input: CreateFormInstanceInput }) => createFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        updateFormInstance: (variables: { id: number; input: { fieldValues: FormFieldValueInput[] } }) => updateFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        publishFormInstance: (variables: { id: number }) => publishFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        removeFormInstance: (variables: { id: number }) => removeFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,
        renameFormInstance: (variables: { id: number; input: { displayName: string | null } }) => renameFormInstance({ variables }) as FetchResult<{ data: ApiResponse<number> }>,

        templateMappingsForTarget: mappingsForTargetData?.data ?? [],
        getTemplateMappingsForTargetVersion: (variables: { targetVersionId: number }) => getTemplateMappingsForTargetVersion({ variables }) as Promise<FetchResult<{ data: TemplateFieldMapping[] }>>,
        getTemplateMappingsForSourceVersion: (variables: { sourceVersionId: number }) => getTemplateMappingsForSourceVersion({ variables }) as Promise<FetchResult<{ data: TemplateFieldMapping[] }>>,
        createTemplateFieldMapping: (variables: { input: CreateTemplateFieldMappingInput }) => createTemplateFieldMapping({ variables }) as Promise<FetchResult<{ data: TemplateFieldMapping }>>,
        deleteTemplateFieldMapping: (variables: { id: number }) => deleteTemplateFieldMapping({ variables }) as Promise<FetchResult<{ data: ApiResponse<number> }>>,
    }
}