import {
    useState,
    type ReactElement
} from 'react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ClipboardCheck,
    Download,
    Eye,
    FileText,
    Pencil,
    Tag,
    Trash2,
    X
} from 'lucide-react';
import {
    FormInstanceStatus,
    type ApiResponse,
    type StepFileTemplate
} from '@l-ark/types';
import {
    useFileTemplate
} from '../../../../server/hooks/useFileTemplate';
import type {
    FetchResult
} from '@apollo/client';
import {
    useToast
} from '../../../../shared/hooks/useToast';
import {
    formatRelativeDate
} from '../../utils/my-workspace.utils';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import Button from '../../../../shared/components/button';
import FillOutFileTemplate from './fill-out-file-template';
import ExportFileInstance from './export-file-template';

interface PropTypes {
    isReadOnly: boolean;
}

const InstanceFileTemplatesStep = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { isReadOnly } = props;
    /** My workspace utilities (shared via context) */
    const { selectedBlueprintStep, selectedStepInstance, refreshInstance } = useWorkspaceInstanceContext();
    /** File template api utilities */
    const { removeFormInstance, renameFormInstance } = useFileTemplate();
    /** Toast utilities */
    const { onToast } = useToast();
    /** Manage to display the fill file template modal */
    const [ fillFormConfig, setFillFormConfig ] = useState<{ templateId: number; stepInstanceId: number; formInstanceId?: number } | null>(null);
    /** Manage to displat the export file template modal */
	const [exportConfig, setExportConfig] = useState<{ templateId: number; formInstanceId: number; templateName?: string } | null>(null);
    /** Inline rename state — keyed by formInstanceId */
    const [ renamingId, setRenamingId ] = useState<number | null>(null);
    const [ renameDraft, setRenameDraft ] = useState<string>('');

    /** Manage to remove the file template instance */
    const onRemoveFileTemplateInstance = async (formInstanceId: number): Promise<void> => {
        const res: FetchResult<{ data: ApiResponse<number> }> = await removeFormInstance({ id: formInstanceId });
        onToast({ message: res.data?.data.message ?? '', type: res.data?.data.success ? 'success' : 'error' });

        if ( res?.data?.data?.success ) {
            await refreshInstance();
        }
    }

    /** Begin inline rename for a form instance */
    const onStartRename = (fi: any): void => {
        setRenamingId(fi.formInstanceId);
        setRenameDraft(fi.formInstance?.displayName ?? '');
    }

    /** Cancel inline rename */
    const onCancelRename = (): void => {
        setRenamingId(null);
        setRenameDraft('');
    }

    /** Save the new display name (empty clears it) */
    const onSaveRename = async (formInstanceId: number): Promise<void> => {
        const next = renameDraft.trim();
        const res: FetchResult<{ data: ApiResponse<number> }> = await renameFormInstance({ id: formInstanceId, input: { displayName: next.length === 0 ? null : next } });
        onToast({ message: res.data?.data.message ?? '', type: res.data?.data.success ? 'success' : 'error' });
        setRenamingId(null);
        setRenameDraft('');
        if ( res?.data?.data?.success ) await refreshInstance();
    }

    /** Render the file templates section */
    const renderHeader = (): ReactElement => (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-[Lato-Bold] text-black/70"> File templates </h4>
            </div>
            { (() => {
                const total = selectedBlueprintStep?.fileTemplates?.length ?? 0;
                const submitted = (selectedStepInstance?.formInstances ?? [])
                    .filter((fi: any) => fi.formInstance?.status === FormInstanceStatus.SUBMITTED || fi.formInstance?.status === FormInstanceStatus.APPROVED).length;

                return (
                    <span className={`text-[10px] font-[Lato-Bold] px-2 py-0.5 rounded-full ${submitted === total && total > 0 ? "bg-emerald-50 text-emerald-600" : "bg-black/5 text-black/35"}`}>
                        { submitted }/{ total } submitted
                    </span>
                );
            })()}
        </div>
    );

    /** Manage to render the general information of the file template */
    const renderGeneralInformationFileTemplate = (hasSubmitted: boolean, needsAction: boolean, fileTemplate: Partial<StepFileTemplate>, canFill: boolean ): ReactElement => (
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
                { hasSubmitted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : needsAction ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                        : <FileText className="w-4 h-4 text-blue-400" />
                }
                <span className="text-sm font-[Lato-Bold] text-black/70"> { fileTemplate.template?.title ?? `Template ${fileTemplate.id}` } </span>
                { !fileTemplate.isOptional && !hasSubmitted &&
                    <span className="text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-amber-100 text-amber-600 border border-amber-200/60">
                        Required
                    </span>
                }
            </div>
            { canFill &&
                <Button variant="ghost" size="sm" onClick={() => setFillFormConfig({ templateId: fileTemplate.templateId as number, stepInstanceId: selectedStepInstance?.id as number })}>
                    <Pencil className="w-3.5 h-3.5" /> Fill Form
                </Button>
            }
        </div>
    );

    /** Manage to render the fill template instances */
    const renderFilTemplateInstances = (existingForms: any[], templateId: number, title: string) => (
        <div className="border-t border-black/4">
            { existingForms.map(fi => {
                const s = fi.formInstance?.status ?? FormInstanceStatus.DRAFT;
                const isDraft = s === FormInstanceStatus.DRAFT;
                const updatedAt = fi.formInstance?.updatedAt;

                const customName: string | null = fi.formInstance?.displayName ?? null;
                const isRenaming = renamingId === fi.formInstanceId;

                return (
                    <div key={fi.id} className="flex items-center justify-between px-3 py-2.5 border-b border-black/3 last:border-0 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s === FormInstanceStatus.APPROVED ? "bg-emerald-500" : s === FormInstanceStatus.SUBMITTED ? "bg-blue-500" : "bg-amber-500"}`} />
                            { isRenaming ?
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <input type="text" value={renameDraft} autoFocus
                                        onChange={(e) => setRenameDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') onSaveRename(fi.formInstanceId);
                                            if (e.key === 'Escape') onCancelRename();
                                        }}
                                        maxLength={120}
                                        placeholder={`Form #${fi.formInstanceId}`}
                                        className="flex-1 min-w-0 text-xs font-[Lato-Regular] text-black/70 bg-white border-[0.5px] border-amber-300 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                                    />
                                    <button onClick={() => onSaveRename(fi.formInstanceId)}
                                        className="w-5 h-5 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                        title="Save"
                                    >
                                        <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={onCancelRename}
                                        className="w-5 h-5 rounded flex items-center justify-center text-black/40 hover:bg-black/5 cursor-pointer"
                                        title="Cancel"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            :
                                <>
                                    <span className="text-xs font-[Lato-Regular] text-black/60 truncate">
                                        { customName ?? `Form #${fi.formInstanceId}` }
                                    </span>
                                    { !isReadOnly &&
                                        <button onClick={() => onStartRename(fi)}
                                            className="w-5 h-5 rounded flex items-center justify-center text-black/30 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer shrink-0"
                                            title={customName ? 'Rename form' : 'Set custom name'}
                                        >
                                            <Tag className="w-3 h-3" />
                                        </button>
                                    }
                                    <span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full ${s === FormInstanceStatus.APPROVED ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50" : s === FormInstanceStatus.SUBMITTED ? "bg-blue-50 text-blue-600 border border-blue-200/50" : "bg-amber-50 text-amber-600 border border-amber-200/50"}`}>
                                        { s }
                                    </span>
                                    { updatedAt && <span className="text-[9px] text-black/25 font-[Lato-Regular]"> { formatRelativeDate(updatedAt) } </span> }
                                </>
                            }
                        </div>
                        { !isRenaming &&
                            <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => setFillFormConfig({ templateId: templateId, stepInstanceId: selectedStepInstance?.id as number, formInstanceId: fi.formInstanceId })}>
                                    {isDraft && !isReadOnly ? <><Pencil className="w-3.5 h-3.5" /> Edit</> : <><Eye className="w-3.5 h-3.5" /> View</>}
                                </Button>
                                { (s === FormInstanceStatus.SUBMITTED || s === FormInstanceStatus.APPROVED) &&
                                    <Button variant="ghost" size="sm" onClick={() => setExportConfig({ templateId: templateId, formInstanceId: fi.formInstanceId, templateName: title })}>
                                        <Download className="w-3.5 h-3.5 text-blue-500" /> Export
                                    </Button>
                                }
                                { isDraft && !isReadOnly &&
                                    <Button variant="ghost" size="sm" onClick={() => onRemoveFileTemplateInstance(fi.formInstanceId)}>
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                }
                            </div>
                        }
                    </div>
                );
            })}
        </div>
    )

    return (
        <div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
            { renderHeader() }
            <div className="space-y-3">
                { (selectedBlueprintStep?.fileTemplates ?? []).map((fileTemplate: Partial<StepFileTemplate>) => {
                    const existingForms = (selectedStepInstance?.formInstances ?? []).filter((fi: any) => {
                        if ( !fi.formInstance ) return false;

                        const tid = fi.formInstance?.templateVersion?.templateId ?? fi.formInstance?.templateId ?? fi.formInstance?.template?.id;
                        
                        return tid === fileTemplate.templateId;
                    });

                    const canFill = !isReadOnly && (fileTemplate.allowMultipleFills || existingForms.length === 0);

                    const hasSubmitted = existingForms.some((fi: any) => fi.formInstance?.status === FormInstanceStatus.SUBMITTED || fi.formInstance?.status === FormInstanceStatus.APPROVED);

                    const needsAction = !fileTemplate.isOptional && !hasSubmitted;

                    return (
                        <div key={fileTemplate.id} className={`rounded-xl border overflow-hidden ${ hasSubmitted ? "border-emerald-200 bg-emerald-50/30" : needsAction ? "border-amber-300 bg-amber-50/20" : "border-black/6 bg-white" }`}>
                            { renderGeneralInformationFileTemplate(hasSubmitted, needsAction, fileTemplate, canFill) }
                            { existingForms.length > 0 && renderFilTemplateInstances(existingForms, fileTemplate.template?.id as number, fileTemplate.template?.title ?? '') }
                        </div>
                    );
                })}
            </div>
            { fillFormConfig &&
				<FillOutFileTemplate {...fillFormConfig} readOnly={isReadOnly} onClose={setFillFormConfig} />
			}
			
            { exportConfig &&
                <ExportFileInstance {...exportConfig} onClose={setExportConfig} />
            }
        </div>
    );
}

export default InstanceFileTemplatesStep;