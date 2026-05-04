import {
    useMemo,
    useState,
    type ReactElement
} from 'react';
import {
    Check,
    ChevronDown,
    ChevronRight,
    FileText,
    GitBranch,
    Loader2,
    Paperclip,
    Share2,
    X
} from 'lucide-react';
import {
    FormInstanceStatus
} from '@l-ark/types';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import Button from '../../../../shared/components/button';

export interface LaunchBlueprintOption {
    id: number;
    title: string;
    subType?: string;
    description?: string;
}

interface LaunchOperationDialogProps {
    isOpen: boolean;
    onClose: () => void;

    /** Optional list of blueprints; when length > 1 the dialog renders a picker step. */
    blueprints?: LaunchBlueprintOption[];

    /** Pre-selected blueprint when only one is offered. */
    fixedBlueprint?: LaunchBlueprintOption;

    /** Title shown in the header. */
    headerTitle?: string;
    headerSubtitle?: string;

    /** Called when the user confirms. The dialog closes itself only after onSubmit resolves. */
    onSubmit: (payload: {
        blueprintId: number;
        title: string;
        description: string;
        sharedFormInstanceIds: number[];
        sharedDocumentIds: number[];
    }) => Promise<void> | void;

    submitLabel?: string;
}

/**
 * Unified launch dialog for OPEN_OPERATION steps and the Request Global Operation flow.
 * Lets the user:
 *  1. Pick a blueprint (when more than one is configured)
 *  2. Override the launched instance's title and description
 *  3. Pick which submitted forms / uploaded documents to share with the new operation
 */
const LaunchOperationDialog = (props: LaunchOperationDialogProps): ReactElement | null => {
    const { isOpen, onClose, blueprints, fixedBlueprint, headerTitle, headerSubtitle, onSubmit, submitLabel } = props;
    const { instance } = useWorkspaceInstanceContext();

    const [selectedBlueprintId, setSelectedBlueprintId] = useState<number | null>(fixedBlueprint?.id ?? blueprints?.[0]?.id ?? null);
    const [titleDraft, setTitleDraft] = useState<string>('');
    const [descriptionDraft, setDescriptionDraft] = useState<string>('');
    const [selectedFormIds, setSelectedFormIds] = useState<Set<number>>(new Set());
    const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [openSection, setOpenSection] = useState<'forms' | 'docs' | 'shared' | null>('forms');

    /** Pre-fill title/description when the user selects a different blueprint */
    const onPickBlueprint = (id: number): void => {
        setSelectedBlueprintId(id);
        const bp = blueprints?.find(b => b.id === id) ?? (fixedBlueprint?.id === id ? fixedBlueprint : undefined);
        if (bp && titleDraft.length === 0) setTitleDraft(bp.title);
        if (bp && descriptionDraft.length === 0) setDescriptionDraft(bp.description ?? '');
    };

    /** Available submitted/approved forms across the source instance */
    const availableForms = useMemo(() => {
        const out: { id: number; displayName: string | null; status: string; templateName?: string; stepTitle?: string }[] = [];
        if ( !instance ) return out;
        for (const si of instance.stepInstances ?? []) {
            for (const fi of (si as any).formInstances ?? []) {
                const status = fi.formInstance?.status;
                if (status !== FormInstanceStatus.SUBMITTED && status !== FormInstanceStatus.APPROVED) continue;
                out.push({
                    id: fi.formInstanceId,
                    displayName: fi.formInstance?.displayName ?? null,
                    status,
                    stepTitle: (si as any).step?.title
                });
            }
        }
        return out;
    }, [instance]);

    /**
     * Items that other operations have shared WITH this one — we let the user
     * forward them onward to the new operation. Filtered to non-revoked rows.
     */
    const availableSharedForms = useMemo(() => {
        const out: { id: number; label: string; status?: string; from?: string }[] = [];
        if ( !instance ) return out;
        for (const link of (instance.sourceLinks ?? []) as any[]) {
            const fromTitle = link.targetInstance?.title ?? link.sourceInstance?.title;
            for (const row of (link.sharedDocuments ?? []) as any[]) {
                if (!row.formInstance) continue;
                out.push({
                    id: row.formInstance.id,
                    label: row.formInstance.displayName ?? `Form #${row.formInstance.id}`,
                    status: row.formInstance.status,
                    from: fromTitle,
                });
            }
        }
        return out;
    }, [instance]);

    const availableSharedDocs = useMemo(() => {
        const out: { id: number; fileName: string; fileSize: number; from?: string }[] = [];
        if ( !instance ) return out;
        for (const link of (instance.sourceLinks ?? []) as any[]) {
            const fromTitle = link.targetInstance?.title ?? link.sourceInstance?.title;
            for (const row of (link.sharedDocuments ?? []) as any[]) {
                if (!row.document) continue;
                out.push({
                    id: row.document.id,
                    fileName: row.document.fileName,
                    fileSize: row.document.fileSize,
                    from: fromTitle,
                });
            }
        }
        return out;
    }, [instance]);

    /** Available uploaded documents */
    const availableDocs = useMemo(() => {
        const out: { id: number; fileName: string; fileSize: number; mimeType: string; stepTitle?: string }[] = [];
        if ( !instance ) return out;
        for (const si of instance.stepInstances ?? []) {
            for (const doc of (si as any).documents ?? []) {
                out.push({
                    id: doc.id,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    mimeType: doc.mimeType,
                    stepTitle: (si as any).step?.title
                });
            }
        }
        return out;
    }, [instance]);

    const toggleForm = (id: number): void => {
        const next = new Set(selectedFormIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedFormIds(next);
    };
    const toggleDoc = (id: number): void => {
        const next = new Set(selectedDocIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedDocIds(next);
    };

    const handleSubmit = async (): Promise<void> => {
        if ( !selectedBlueprintId ) return;
        const bp = blueprints?.find(b => b.id === selectedBlueprintId) ?? fixedBlueprint;
        const finalTitle = titleDraft.trim() || (bp?.title ?? '');
        const finalDescription = descriptionDraft.trim() || (bp?.description ?? '');

        setSubmitting(true);
        try {
            await onSubmit({
                blueprintId: selectedBlueprintId,
                title: finalTitle,
                description: finalDescription,
                sharedFormInstanceIds: Array.from(selectedFormIds),
                sharedDocumentIds: Array.from(selectedDocIds),
            });
        } finally {
            setSubmitting(false);
        }
    };

    if ( !isOpen ) return null;

    const formatBytes = (n: number): string => {
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / 1024 / 1024).toFixed(1)} MB`;
    };

    const blueprintOptions = blueprints ?? (fixedBlueprint ? [fixedBlueprint] : []);
    const hasBlueprintPicker = blueprintOptions.length > 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <GitBranch className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-[Lato-Bold] text-black/80"> { headerTitle ?? 'Launch Operation' } </h2>
                            <p className="text-xs font-[Lato-Regular] text-black/40"> { headerSubtitle ?? 'Configure the new sub-operation' } </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={submitting}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:bg-black/4 hover:text-black/60 transition-all cursor-pointer disabled:opacity-40">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    { hasBlueprintPicker &&
                        <div>
                            <h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wide mb-2"> Blueprint </h3>
                            <div className="space-y-2">
                                { blueprintOptions.map(bp => (
                                    <button key={bp.id} onClick={() => onPickBlueprint(bp.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                            selectedBlueprintId === bp.id
                                                ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/20'
                                                : 'border-black/6 bg-white hover:border-black/12'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <GitBranch className="w-4 h-4 text-amber-500 shrink-0" />
                                                <div>
                                                    <span className="text-sm font-[Lato-Bold] text-black/80"> { bp.title } </span>
                                                    { bp.subType && <span className="text-xs text-black/40 font-[Lato-Regular] ml-2"> { bp.subType } </span> }
                                                </div>
                                            </div>
                                            { selectedBlueprintId === bp.id &&
                                                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            }
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    }

                    <div>
                        <h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wide mb-2"> Title </h3>
                        <input type="text" value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
                            placeholder={blueprintOptions.find(b => b.id === selectedBlueprintId)?.title ?? 'Operation title'}
                            maxLength={200}
                            className="w-full rounded-md border-[0.5px] border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-all shadow-sm"
                        />

                        <h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wide mt-3 mb-2"> Description </h3>
                        <textarea value={descriptionDraft} onChange={(e) => setDescriptionDraft(e.target.value)}
                            placeholder="Optional description for the new operation"
                            rows={3} maxLength={2000}
                            className="w-full rounded-md border-[0.5px] border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-all shadow-sm resize-none"
                        />
                    </div>

                    <div>
                        <h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wide mb-2"> Documents to share </h3>
                        <p className="text-[11px] text-black/40 font-[Lato-Regular] mb-3">
                            Optional: hand off submitted forms and uploaded files from the current operation to the new one.
                        </p>

                        {/* Forms group */}
                        <div className="rounded-xl border border-black/6 mb-2 overflow-hidden">
                            <button onClick={() => setOpenSection(openSection === 'forms' ? null : 'forms')}
                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/2 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    { openSection === 'forms' ? <ChevronDown className="w-3.5 h-3.5 text-black/40" /> : <ChevronRight className="w-3.5 h-3.5 text-black/40" /> }
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs font-[Lato-Bold] text-black/70"> Submitted forms </span>
                                </div>
                                <span className="text-[10px] font-[Lato-Bold] px-1.5 py-0.5 rounded-full bg-black/5 text-black/40">
                                    { selectedFormIds.size } / { availableForms.length }
                                </span>
                            </button>
                            { openSection === 'forms' &&
                                <div className="border-t border-black/6 max-h-44 overflow-y-auto bg-[#FBFBFC]">
                                    { availableForms.length === 0 ?
                                        <p className="text-xs text-black/30 font-[Lato-Regular] text-center py-4">
                                            No submitted forms available yet.
                                        </p>
                                    :
                                        availableForms.map(f => {
                                            const isSelected = selectedFormIds.has(f.id);
                                            return (
                                                <button key={f.id} onClick={() => toggleForm(f.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black/2 cursor-pointer border-b border-black/4 last:border-0 ${ isSelected ? 'bg-emerald-50/40' : '' }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-4 h-4 rounded border ${ isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-black/20' } flex items-center justify-center shrink-0`}>
                                                            { isSelected && <Check className="w-2.5 h-2.5 text-white" /> }
                                                        </div>
                                                        <span className="text-xs font-[Lato-Regular] text-black/70 truncate">
                                                            { f.displayName ?? `Form #${f.id}` }
                                                        </span>
                                                        <span className="text-[9px] font-[Lato-Bold] px-1 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200/50 shrink-0">
                                                            { f.status }
                                                        </span>
                                                    </div>
                                                    { f.stepTitle &&
                                                        <span className="text-[10px] text-black/30 font-[Lato-Regular] truncate ml-2"> { f.stepTitle } </span>
                                                    }
                                                </button>
                                            );
                                        })
                                    }
                                </div>
                            }
                        </div>

                        {/* Incoming shared group — items handed to this op by an upstream link */}
                        { (availableSharedForms.length + availableSharedDocs.length) > 0 &&
                            <div className="rounded-xl border border-black/6 mb-2 overflow-hidden">
                                <button onClick={() => setOpenSection(openSection === 'shared' ? null : 'shared')}
                                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/2 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        { openSection === 'shared' ? <ChevronDown className="w-3.5 h-3.5 text-black/40" /> : <ChevronRight className="w-3.5 h-3.5 text-black/40" /> }
                                        <Share2 className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-xs font-[Lato-Bold] text-black/70"> Shared with this operation </span>
                                    </div>
                                    <span className="text-[10px] font-[Lato-Bold] px-1.5 py-0.5 rounded-full bg-black/5 text-black/40">
                                        { availableSharedForms.filter(f => selectedFormIds.has(f.id)).length + availableSharedDocs.filter(d => selectedDocIds.has(d.id)).length } / { availableSharedForms.length + availableSharedDocs.length }
                                    </span>
                                </button>
                                { openSection === 'shared' &&
                                    <div className="border-t border-black/6 max-h-44 overflow-y-auto bg-[#FBFBFC]">
                                        { availableSharedForms.map(f => {
                                            const isSelected = selectedFormIds.has(f.id);
                                            return (
                                                <button key={`shared-form-${f.id}`} onClick={() => toggleForm(f.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black/2 cursor-pointer border-b border-black/4 last:border-0 ${ isSelected ? 'bg-emerald-50/40' : '' }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-4 h-4 rounded border ${ isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-black/20' } flex items-center justify-center shrink-0`}>
                                                            { isSelected && <Check className="w-2.5 h-2.5 text-white" /> }
                                                        </div>
                                                        <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                                                        <span className="text-xs font-[Lato-Regular] text-black/70 truncate"> { f.label } </span>
                                                        { f.status &&
                                                            <span className="text-[9px] font-[Lato-Bold] px-1 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200/50 shrink-0"> { f.status } </span>
                                                        }
                                                    </div>
                                                    { f.from &&
                                                        <span className="text-[10px] text-violet-500/70 font-[Lato-Regular] truncate ml-2"> from { f.from } </span>
                                                    }
                                                </button>
                                            );
                                        })}
                                        { availableSharedDocs.map(d => {
                                            const isSelected = selectedDocIds.has(d.id);
                                            return (
                                                <button key={`shared-doc-${d.id}`} onClick={() => toggleDoc(d.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black/2 cursor-pointer border-b border-black/4 last:border-0 ${ isSelected ? 'bg-emerald-50/40' : '' }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-4 h-4 rounded border ${ isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-black/20' } flex items-center justify-center shrink-0`}>
                                                            { isSelected && <Check className="w-2.5 h-2.5 text-white" /> }
                                                        </div>
                                                        <Paperclip className="w-3 h-3 text-amber-500 shrink-0" />
                                                        <span className="text-xs font-[Lato-Regular] text-black/70 truncate"> { d.fileName } </span>
                                                        <span className="text-[10px] text-black/30 font-[Lato-Regular] shrink-0"> { formatBytes(d.fileSize) } </span>
                                                    </div>
                                                    { d.from &&
                                                        <span className="text-[10px] text-violet-500/70 font-[Lato-Regular] truncate ml-2"> from { d.from } </span>
                                                    }
                                                </button>
                                            );
                                        })}
                                    </div>
                                }
                            </div>
                        }

                        {/* Documents group */}
                        <div className="rounded-xl border border-black/6 overflow-hidden">
                            <button onClick={() => setOpenSection(openSection === 'docs' ? null : 'docs')}
                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/2 cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    { openSection === 'docs' ? <ChevronDown className="w-3.5 h-3.5 text-black/40" /> : <ChevronRight className="w-3.5 h-3.5 text-black/40" /> }
                                    <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-[Lato-Bold] text-black/70"> Uploaded files </span>
                                </div>
                                <span className="text-[10px] font-[Lato-Bold] px-1.5 py-0.5 rounded-full bg-black/5 text-black/40">
                                    { selectedDocIds.size } / { availableDocs.length }
                                </span>
                            </button>
                            { openSection === 'docs' &&
                                <div className="border-t border-black/6 max-h-44 overflow-y-auto bg-[#FBFBFC]">
                                    { availableDocs.length === 0 ?
                                        <p className="text-xs text-black/30 font-[Lato-Regular] text-center py-4">
                                            No files have been uploaded yet.
                                        </p>
                                    :
                                        availableDocs.map(d => {
                                            const isSelected = selectedDocIds.has(d.id);
                                            return (
                                                <button key={d.id} onClick={() => toggleDoc(d.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black/2 cursor-pointer border-b border-black/4 last:border-0 ${ isSelected ? 'bg-emerald-50/40' : '' }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-4 h-4 rounded border ${ isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-black/20' } flex items-center justify-center shrink-0`}>
                                                            { isSelected && <Check className="w-2.5 h-2.5 text-white" /> }
                                                        </div>
                                                        <span className="text-xs font-[Lato-Regular] text-black/70 truncate"> { d.fileName } </span>
                                                        <span className="text-[10px] text-black/30 font-[Lato-Regular] shrink-0"> { formatBytes(d.fileSize) } </span>
                                                    </div>
                                                    { d.stepTitle &&
                                                        <span className="text-[10px] text-black/30 font-[Lato-Regular] truncate ml-2"> { d.stepTitle } </span>
                                                    }
                                                </button>
                                            );
                                        })
                                    }
                                </div>
                            }
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-black/6 flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={submitting}> Cancel </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting || !selectedBlueprintId}>
                        { submitting
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <>
                                <GitBranch className="w-4 h-4" />
                                { submitLabel ?? 'Launch Operation' }
                              </>
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LaunchOperationDialog;
