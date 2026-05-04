import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    Download,
    FileText,
    Link2,
    Loader2,
    Save,
    SendHorizontal,
    X
} from 'lucide-react';
import ImportFormDataModal from './import-form-data-modal';
import {
    useFileTemplate
} from '../../../../server/hooks/useFileTemplate';
import {
    useForm,
    useFormState,
    useWatch
} from 'react-hook-form';
import type {
    FetchResult
} from '@apollo/client';
import {
    FormInstanceStatus,
    type ApiResponse,
    type FileTemplateInstance
} from '@l-ark/types';
import {
    useToast
} from '../../../../shared/hooks/useToast';
import {
    getResponseMessage
} from '../../../../server/hooks/useApolloWithToast';
import {
    FIELD_WIDTH_MAP,
    TemplateComponents,
    type FieldWidth
} from '../../../../models/template.models';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import Button from '../../../../shared/components/button';
import Field from '../../../../shared/components/field';

const FIELD_TYPE_MAP: Record<string, string> = {
    TEXTAREA: 'textarea', NUMBER: 'number', CURRENCY: 'number',
    PERCENTAGE: 'number', DATE: 'date', DATE_TIME: 'date',
    BOOLEAN: 'toggle-switch', CHECKBOX: 'checkbox', RADIO_GROUP: 'radio',
    SELECT: 'select', FILE: 'image', ADDRESS: 'textarea', TABLE: 'table',
    SIGNATURE: 'signature'
};

const toFieldType = (t: string) => FIELD_TYPE_MAP[t] ?? 'text';

const toSuffix = (t: string) => t === TemplateComponents.CURRENCY ? '€' : t === TemplateComponents.PERCENTAGE ? '%' : undefined;

interface PropTypes {
	templateId: number;
	stepInstanceId: number;
	formInstanceId?: number;
	readOnly?: boolean;

	onClose: Dispatch<SetStateAction<{ templateId: number; stepInstanceId: number; formInstanceId?: number } | null>>;
	onSaved?: () => void;
}

const FillOutFileTemplate = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { templateId, formInstanceId, stepInstanceId, readOnly, onClose } = props;
    /** File template api utilities */
    const { fileTemplate, retrieveFileTemplateById, retrieveFormInstanceById, createFormInstance, updateFormInstance, publishFormInstance, getTemplateMappingsForTargetVersion } = useFileTemplate();
    /** My workspace utilities (shared via context) */
    const { instance, refreshInstance } = useWorkspaceInstanceContext();
    /** Form definition */
    const { control, reset, getValues, setError, setValue } = useForm({ mode: 'onBlur' });
    const { errors } = useFormState({ control });
    /** Watched values of the formulary */
    const formValues = useWatch({ control });
    /** Manage the loading of the initial data */
    const [ loading, setLoading ] = useState(true);
    /** Manage the status of the submitting process */
    const [submitting, setSubmitting] = useState<boolean>(false);
    /** Manage to store the status of the file template instance */
	const [formStatus, setFormStatus] = useState<string | null>(null);
    /** Loaded form instance — holds the locked templateVersion for existing forms */
    const [formInstance, setFormInstance] = useState<FileTemplateInstance | null>(null);
    /** State to manage the active section */
    const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
    /** Toast utilities */
    const { onToast } = useToast();
    /** stableIds of fields that are auto-filled via a field mapping (read-only in this form) */
    const [lockedFieldStableIds, setLockedFieldStableIds] = useState<Set<string>>(new Set());
    /** Controls visibility of the ad-hoc import modal */
    const [showImportModal, setShowImportModal] = useState(false);
    /** Active version: locked version for existing form instances, latest version for new ones */
    const activeVersion = useMemo(() => {
        if ( formInstance?.templateVersion ) return formInstance.templateVersion;
        if ( !fileTemplate?.versions ) return null;

        return fileTemplate.versions.find(v => v.isLatest) ?? fileTemplate.versions[0] ?? null;
    }, [formInstance, fileTemplate]);
    /** Manage to memorize all the sections of the file template */
    const sections = useMemo(() => {
        if ( !activeVersion?.sections ) return [];
        return [...activeVersion.sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }, [activeVersion]);
    /** MAnage to calculate the filled fields per section for progress */
    const sectionProgress = useCallback((section: any): { filled: number; total: number } => {
        const fields = (section.fields ?? []).filter((f: any) => f.type !== 'DESCRIPTION');
        const filled = fields.filter((f: any) => {
            const val = formValues[`field_${f.id}`];
            return val !== undefined && val !== null && val !== '';
        }).length;

        return { filled, total: fields.length };
    }, [formValues]);
    /** Check whether a section contains any field with a validation error */
    const sectionHasErrors = useCallback((section: any): boolean => {
        return (section.fields ?? []).some((f: any) => errors[`field_${f.id}`]);
    }, [errors]);
    /** Retrieve the active section information */
    const activeSection = sections[activeSectionIdx] ?? null;
    /** Memorize the fields of the current section */
    const sortedFields = useMemo(() => {
		if ( !activeSection?.fields ) return [];

		return [...activeSection.fields].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
	}, [activeSection]);

    useEffect(() => {
        const initialize = async () => {
            const templateRes = await retrieveFileTemplateById({ id: templateId });
            let resolvedVersionId: number | null = null;

            if ( formInstanceId ) {
                const response: FetchResult<{ data: FileTemplateInstance }> = await retrieveFormInstanceById({ id: formInstanceId });
                if ( response.data?.data ) {
                    const formData = response.data.data;
                    setFormInstance(formData);
                    const values: Record<string, any> = {};
                    for (const fv of formData.fieldValues) {
                        values[`field_${fv.fieldId}`] = fv.value;
                    }
                    setFormStatus(formData.status ?? null);
                    reset(values);
                    resolvedVersionId = formData.templateVersionId ?? null;
                }
            } else {
                const versions = (templateRes as any)?.data?.data?.versions ?? [];
                const latest = versions.find((v: any) => v.isLatest) ?? versions[0];
                resolvedVersionId = latest?.id ?? null;
            }

            if ( resolvedVersionId ) {
                const mappingRes = await getTemplateMappingsForTargetVersion({ targetVersionId: resolvedVersionId });
                const incomingMappings = (mappingRes as any)?.data?.data ?? [];
                setLockedFieldStableIds(new Set(incomingMappings.map((m: any) => m.targetFieldStableId)));

                // For new forms: pre-populate locked fields from source forms already in this operation
                if ( !formInstanceId && incomingMappings.length > 0 && instance ) {
                    // Build stableId → fieldId map from the resolved template version
                    const stableIdToFieldId = new Map<string, number>();
                    const allVersions = (templateRes as any)?.data?.data?.versions ?? [];
                    for (const v of allVersions) {
                        for (const s of v.sections ?? []) {
                            for (const f of s.fields ?? []) {
                                if ( f.stableId ) stableIdToFieldId.set(f.stableId, f.id);
                            }
                        }
                    }

                    // Group mappings by sourceVersionId
                    const bySourceVersion = new Map<number, any[]>();
                    for (const m of incomingMappings) {
                        const list = bySourceVersion.get(m.sourceVersionId) ?? [];
                        list.push(m);
                        bySourceVersion.set(m.sourceVersionId, list);
                    }

                    for (const [sourceVersionId, versionMappings] of bySourceVersion) {
                        // Find the source FormInstance in the current operation
                        let sourceFormInstanceId: number | null = null;
                        for (const si of instance.stepInstances ?? []) {
                            for (const sif of (si as any).formInstances ?? []) {
                                const fi = sif.formInstance;
                                if ( fi?.templateVersionId === sourceVersionId ) {
                                    sourceFormInstanceId = fi.id;
                                    break;
                                }
                            }
                            if ( sourceFormInstanceId ) break;
                        }
                        if ( !sourceFormInstanceId ) continue;

                        // Fetch source form values
                        const sourceRes = await retrieveFormInstanceById({ id: sourceFormInstanceId });
                        const sourceData = (sourceRes as any)?.data?.data;
                        if ( !sourceData ) continue;

                        // Build stableFieldId → value map
                        const valueByStableId = new Map<string, unknown>();
                        for (const fv of sourceData.fieldValues ?? []) {
                            if ( fv.stableFieldId ) valueByStableId.set(fv.stableFieldId, fv.value);
                        }

                        // Pre-populate each locked target field
                        for (const mapping of versionMappings) {
                            const sourceValue = valueByStableId.get(mapping.sourceFieldStableId);
                            if ( sourceValue === undefined ) continue;
                            const targetFieldId = stableIdToFieldId.get(mapping.targetFieldStableId);
                            if ( targetFieldId ) setValue(`field_${targetFieldId}`, sourceValue);
                        }
                    }
                }
            }

            setLoading(false);
        };
        initialize();
    }, [templateId, formInstanceId]);

    /** Collect field values from the form */
	const collectFieldValues = (data: Record<string, any>) => {
		return Object.entries(data)
			.filter(([key]) => key.startsWith('field_'))
			.map(([key, value]) => ({ fieldId: key.replace('field_', ''), value }));
	};

    /** Manage to save/update the form instance draft information */
    const handleSaveDraft = async (data: any): Promise<void> => {
        setSubmitting(true);
		try {
			const fieldValues = collectFieldValues(data);

			if ( !formInstanceId ) {
				const response: FetchResult<{ data: ApiResponse<number> }> = await createFormInstance({ input: { templateId: templateId, stepInstanceId: stepInstanceId, fieldValues } });
                
				onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
			} else {
				const response: FetchResult<{ data: ApiResponse<number> }> = await updateFormInstance({ id: formInstanceId, input: { fieldValues } });
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
			}
            refreshInstance();
			onClose(null);
		} catch {
			onToast({ message: 'Failed to save form', type: 'error' });
		} finally {
			setSubmitting(false);
		}
    }

    /** Manage to publish a form instance */
    const handlePublish = async (): Promise<void> => {
        setSubmitting(true);
		try {
            if( formInstanceId ) {
                const response: FetchResult<{ data: ApiResponse<number> }> = await publishFormInstance({ id: formInstanceId });
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
                setSubmitting(false);
                refreshInstance();
                onClose(null)
            }
		} catch ( e: any ) {
            console.error(e);
        }
    }

    /** Manage to update the existing values of the form instance */
    const handleUpdate = async (data: any): Promise<void> => {
        if ( !formInstanceId )
            return;

		setSubmitting(true);
		try {
			const fieldValues = collectFieldValues(data);
			const response: FetchResult<{ data: ApiResponse<number> }> = await updateFormInstance({ id: formInstanceId, input: { fieldValues } });
			onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            refreshInstance();
			onClose(null);
		} catch ( e: any ){
            console.error(e);
        }
    }

    /** Manage to validate the formulary */
    const validateAndSubmit = (submitFn: (data: any) => void): void => {
        const values = getValues();
        const fieldErrors: Record<string, boolean> = {};

        sections.forEach((section: any) => {
            (section.fields ?? []).forEach((field: any) => {
                if ( field.required && field.type !== 'DESCRIPTION' ) {
                    const val = values[`field_${field.id}`];
                    if ( val === undefined || val === null || val === '' ) {
                        setError(`field_${field.id}`, { type: 'required', message: 'Required' });
                        fieldErrors[`field_${field.id}`] = true;
                    }
                }
            });
        });

        if (Object.keys(fieldErrors).length > 0) {
            const firstErrorIdx = sections.findIndex((s: any) => (s.fields ?? []).some((f: any) => fieldErrors[`field_${f.id}`]));
            if ( firstErrorIdx >= 0 ) setActiveSectionIdx(firstErrorIdx);
            return;
        }

        submitFn(values);
    };

    /** Apply imported field values to the form */
    const handleImport = (mappings: { targetFieldId: string; sourceValue: unknown }[]) => {
        for (const m of mappings) {
            setValue(`field_${m.targetFieldId}`, m.sourceValue, { shouldDirty: true });
        }
    };

    /** Manage to render the header of the modal */
    const renderHeader = (): ReactElement => (
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/6 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-md font-[Lato-Bold] text-black/80">
                        {fileTemplate?.title ?? 'Fill Form'}
                    </h2>
                    <p className="text-[11px] font-[Lato-Regular] text-black/40">
                        { readOnly ? 'View submitted form' : 'Fill out the required fields and submit'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                { !readOnly && instance &&
                    <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
                        <Download className="w-3.5 h-3.5" />
                        Import data
                    </Button>
                }
                <Button variant="icon" onClick={() => onClose(null)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    /** Manage to render the sections of the file template */
    const renderSections = (): ReactElement => (
        <div className="w-65 shrink-0 border-r border-black/6 flex flex-col bg-[#FAFAFA]">
            <div className="px-4 py-3 border-b border-black/6">
                <h3 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Sections </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    { sections.map((section: any, idx: number) => {
                        const isActive = idx === activeSectionIdx;
                        const hasErrors = sectionHasErrors(section);
                        const progress = sectionProgress(section);

                        return (
                            <button key={section.id} onClick={() => setActiveSectionIdx(idx)}
                                className={`w-full text-left rounded-xl p-2.5 transition-all duration-200 cursor-pointer group ${
                                    isActive
                                        ? hasErrors ? 'bg-red-50/80 ring-1 ring-red-300/60 shadow-sm' : 'bg-amber-50/80 ring-1 ring-amber-300/60 shadow-sm'
                                        : hasErrors ? 'bg-red-50/40 ring-1 ring-red-200/60 hover:bg-red-50/70' : 'hover:bg-white hover:ring-1 hover:ring-black/4'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-[Lato-Bold] transition-all ${
                                        hasErrors ? 'bg-red-500 text-white shadow-sm' : isActive ? 'bg-[#FFBF00] text-neutral-800 shadow-sm' : 'bg-black/5 text-black/40'
                                    }`}>
                                        { idx + 1 }
                                    </span>
                                    <span className={`text-[13px] font-[Lato-Bold] truncate transition-colors ${ hasErrors ? 'text-red-600' : isActive ? 'text-black/90' : 'text-black/60' }`}>
                                        { section.title || 'Untitled' }
                                    </span>
                                </div>

                                { section.description &&
                                    <p className="mt-0.5 ml-7 text-[10px] font-[Lato-Regular] text-black/30 truncate">
                                        { section.description }
                                    </p>
                                }

                                <div className="mt-1.5 ml-7 flex items-center gap-1.5">
                                    <span className="text-[9px] font-[Lato-Regular] text-black/30">
                                        { progress.total } { progress.total === 1 ? 'field' : 'fields' }
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Section navigation */}
            <div className="px-3 py-2.5 border-t border-black/6 flex items-center justify-between">
                <Button variant="icon" size="sm" disabled={activeSectionIdx === 0} onClick={() => setActiveSectionIdx((p) => Math.max(0, p - 1))} className='w-fit'>
                    <ArrowLeft size={15} />
                </Button>
                <span className="text-[10px] font-[Lato-Bold] text-black/30">
                    {activeSectionIdx + 1} / {sections.length}
                </span>
                <Button variant="icon" size="sm" disabled={activeSectionIdx === sections.length - 1} onClick={() => setActiveSectionIdx((p) => Math.min(sections.length - 1, p + 1))} className='w-fit'>
                    <ArrowRight size={15} />
                </Button>
            </div>
        </div>
    );

    const renderContent = (): ReactElement => (
        <>
            { renderSections () }
            <div className="flex-1 overflow-y-auto">
                { activeSection &&
                    <div className="p-6">
                        {/* Section header */}
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFBF00] text-neutral-800 text-xs font-[Lato-Bold] shadow-sm">
                                    { activeSectionIdx + 1 }
                                </span>
                                <h3 className="text-lg font-[Lato-Bold] text-black/80"> { activeSection.title } </h3>
                            </div>
                            { activeSection.description &&
                                <p className="text-sm font-[Lato-Regular] text-black/40 ml-8"> { activeSection.description } </p>
                            }
                        </div>

                        {/* Fields grid */}
                        <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                            { sortedFields.map((fieldDef: any) => {
                                const widthClass = FIELD_WIDTH_MAP[fieldDef.width as FieldWidth] ?? 'col-span-12';

                                if (fieldDef.type === TemplateComponents.DESCRIPTION) {
                                    const content = fieldDef.placeholder ?? '';
                                    const isHtml = fieldDef.format === 'HTML' || (typeof content === 'string' && content.includes('<'));
                                    return (
                                        <div key={fieldDef.id} className={widthClass}>
                                            { isHtml
                                                ? <div className="text-sm font-[Lato-Regular] text-black/60 prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                                                : <p className="text-sm font-[Lato-Regular] text-black/60 whitespace-pre-wrap">{ content }</p>
                                            }
                                        </div>
                                    );
                                }
                                const isLocked = !readOnly && lockedFieldStableIds.has(fieldDef.stableId);
                                return (
                                    <div key={fieldDef.id} className={widthClass}>
                                        { isLocked &&
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Link2 className="w-3 h-3 text-amber-500 shrink-0" />
                                                <span className="text-[10px] font-[Lato-Regular] text-amber-600">
                                                    Auto-filled from linked template
                                                </span>
                                            </div>
                                        }
                                        <Field
                                            name={`field_${fieldDef.id}`}
                                            type={toFieldType(fieldDef.type)}
                                            label={fieldDef.label}
                                            placeholder={fieldDef.placeholder}
                                            required={fieldDef.required}
                                            control={control}
                                            disabled={readOnly || isLocked}
                                            suffix={fieldDef.type === TemplateComponents.NUMBER ? (fieldDef.suffix ?? undefined) : toSuffix(fieldDef.type)}
                                            params={fieldDef.type === 'TABLE' ? fieldDef.columns : fieldDef.options}
                                            multiple={fieldDef.multiple}
                                            hideInfinity={true}
                                        />
                                        { fieldDef.helpText &&
                                            <p className="mt-1 px-1 text-[11px] font-[Lato-Regular] text-black/40"> { fieldDef.helpText } </p>
                                        }
                                    </div>
                                );
                            })}
                        </div>

                        {/* Section navigation at bottom */}
                        { sections.length > 1 &&
                            <div className="mt-8 flex items-center justify-between pt-5 border-t border-black/6">
                                { activeSectionIdx > 0 ?
                                    <Button variant="ghost" size="sm" onClick={() => setActiveSectionIdx((p) => p - 1)}>
                                        <ChevronRight className="w-4 h-4 rotate-180" />
                                        {sections[activeSectionIdx - 1]?.title ?? 'Previous'}
                                    </Button>
                                :
                                    <div />
                                }

                                { activeSectionIdx < sections.length - 1 &&
                                    <Button variant="secondary" size="sm" onClick={() => setActiveSectionIdx((p) => p + 1)}>
                                        {sections[activeSectionIdx + 1]?.title ?? 'Next'}
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                }
                            </div>
                        }
                    </div>
                }
            </div>
        </>
    );

    /** Manage to render the footer of the modal */
    const renderFooter = (): ReactElement => (
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-black/6 bg-[#F8F9FA] shrink-0">
            <Button variant="secondary" onClick={() => onClose(null)} disabled={submitting}>
                Cancel
            </Button>
            {  formStatus === FormInstanceStatus.SUBMITTED || formStatus === FormInstanceStatus.APPROVED ?
                <Button variant="primary" onClick={() => validateAndSubmit(handleUpdate)} disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update information
                </Button>
            : formStatus === FormInstanceStatus.DRAFT ?
                <>
                    <Button variant="secondary" onClick={() => validateAndSubmit(handleSaveDraft)} disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Draft
                    </Button>
                    <Button variant="primary" onClick={() => validateAndSubmit(handlePublish)} disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                        Submit
                    </Button>
                </>
            :
                <Button variant="primary" onClick={() => validateAndSubmit(handleSaveDraft)} disabled={submitting}>
                    { submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Draft
                </Button>
            }
        </div>
    );
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Overlay */}
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onClose(null)} />

			{/* Modal */}
			<div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
				{/* Header */}
				{ renderHeader() }
                <div className="flex-1 flex overflow-hidden">
                    { loading ?
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                <span className="text-sm font-[Lato-Regular] text-black/40"> Loading template... </span>
                            </div>
                        </div>
                    : sections.length === 0 ?
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center text-center">
                                <AlertCircle className="w-8 h-8 text-black/20 mb-2" />
                                <p className="text-sm font-[Lato-Regular] text-black/40"> No sections found for this template. </p>
                            </div>
                        </div>
                    :
                        renderContent()
                    }
                </div>
                { renderFooter() }
            </div>

            {showImportModal && instance && (
                <ImportFormDataModal
                    currentFormSections={sections}
                    currentFormInstanceId={formInstanceId}
                    instance={instance}
                    onImport={handleImport}
                    onClose={() => setShowImportModal(false)}
                />
            )}
        </div>
    );
}

export default FillOutFileTemplate;