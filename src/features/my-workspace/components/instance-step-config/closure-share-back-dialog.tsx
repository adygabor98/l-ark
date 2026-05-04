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

interface ParentLinkOption {
    linkId: number;
    counterpartTitle: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    parentLinks: ParentLinkOption[];
    /** Called with the selection. Dialog closes after the promise resolves. */
    onConfirm: (payload: { sharedFormInstanceIds: number[]; sharedDocumentIds: number[] }) => Promise<void> | void;
    /** Called when the user explicitly skips share-back. Closure should still proceed. */
    onSkip: () => Promise<void> | void;
}

/**
 * Blocking dialog shown when the user closes a sub-operation that has one or
 * more DEPENDS_ON parents. Lets the user pick which forms / uploaded documents
 * to share back with each parent. The same selection is applied to every
 * parent link (multi-parent is rare; per-parent picking can be added later).
 */
const ClosureShareBackDialog = ({ isOpen, onClose, parentLinks, onConfirm, onSkip }: Props): ReactElement | null => {
    const { instance } = useWorkspaceInstanceContext();
    const [selectedFormIds, setSelectedFormIds] = useState<Set<number>>(new Set());
    const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [openSection, setOpenSection] = useState<'forms' | 'docs' | null>('forms');

    /** Submitted/approved forms produced inside this instance. */
    const availableForms = useMemo(() => {
        const out: { id: number; displayName: string | null; status: string; stepTitle?: string }[] = [];
        if (!instance) return out;
        for (const si of instance.stepInstances ?? []) {
            for (const fi of (si as any).formInstances ?? []) {
                const status = fi.formInstance?.status;
                if (status !== FormInstanceStatus.SUBMITTED && status !== FormInstanceStatus.APPROVED) continue;
                out.push({
                    id: fi.formInstanceId,
                    displayName: fi.formInstance?.displayName ?? null,
                    status,
                    stepTitle: (si as any).step?.title,
                });
            }
        }
        return out;
    }, [instance]);

    /** Documents uploaded inside this instance. */
    const availableDocs = useMemo(() => {
        const out: { id: number; fileName: string; fileSize: number; stepTitle?: string }[] = [];
        if (!instance) return out;
        for (const si of instance.stepInstances ?? []) {
            for (const doc of (si as any).documents ?? []) {
                out.push({
                    id: doc.id,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    stepTitle: (si as any).step?.title,
                });
            }
        }
        return out;
    }, [instance]);

    const toggleForm = (id: number) => {
        setSelectedFormIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const toggleDoc = (id: number) => {
        setSelectedDocIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const onConfirmClick = async (): Promise<void> => {
        setSubmitting(true);
        try {
            await onConfirm({
                sharedFormInstanceIds: Array.from(selectedFormIds),
                sharedDocumentIds: Array.from(selectedDocIds),
            });
        } finally {
            setSubmitting(false);
        }
    };

    const onSkipClick = async (): Promise<void> => {
        setSubmitting(true);
        try {
            await onSkip();
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const hasItems = availableForms.length > 0 || availableDocs.length > 0;
    const totalSelected = selectedFormIds.size + selectedDocIds.size;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-black/6 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Share2 className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-[Lato-Bold] text-black/80"> Share documents back before closing </h3>
                        <p className="text-[11px] font-[Lato-Regular] text-black/45 mt-0.5">
                            { parentLinks.length === 1
                                ? `This operation will close. Pick what to share back with ${parentLinks[0].counterpartTitle}.`
                                : `This operation will close. Pick what to share back with ${parentLinks.length} parent operations.` }
                        </p>
                    </div>
                    <button onClick={onClose} disabled={submitting}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-black/40 hover:text-black/70 hover:bg-black/5 transition-colors shrink-0 cursor-pointer disabled:opacity-40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Parent links recap */}
                { parentLinks.length > 1 &&
                    <div className="px-5 py-2 bg-amber-50/40 border-b border-amber-100">
                        <p className="text-[10px] font-[Lato-Bold] text-amber-700 uppercase tracking-wide mb-1"> Will be shared with </p>
                        <div className="flex flex-wrap gap-1.5">
                            { parentLinks.map(p => (
                                <span key={p.linkId} className="text-[11px] font-[Lato-Regular] text-amber-700 bg-white border border-amber-200/70 rounded-full px-2 py-0.5">
                                    { p.counterpartTitle }
                                </span>
                            ))}
                        </div>
                    </div>
                }

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    { !hasItems &&
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-xl bg-black/3 flex items-center justify-center mb-3">
                                <FileText className="w-5 h-5 text-black/20" />
                            </div>
                            <p className="text-sm font-[Lato-Bold] text-black/60"> Nothing to share </p>
                            <p className="text-xs font-[Lato-Regular] text-black/40 mt-1 max-w-xs">
                                There are no submitted forms or uploaded documents in this operation.
                            </p>
                        </div>
                    }

                    { availableForms.length > 0 &&
                        <div className="border border-black/6 rounded-xl overflow-hidden">
                            <button onClick={() => setOpenSection(openSection === 'forms' ? null : 'forms')}
                                className="w-full flex items-center gap-2 px-3 py-2.5 bg-black/2 hover:bg-black/4 transition-colors cursor-pointer"
                            >
                                { openSection === 'forms' ? <ChevronDown className="w-3.5 h-3.5 text-black/40" /> : <ChevronRight className="w-3.5 h-3.5 text-black/40" /> }
                                <FileText className="w-3.5 h-3.5 text-black/50" />
                                <span className="text-xs font-[Lato-Bold] text-black/70 flex-1 text-left"> Forms ({ availableForms.length }) </span>
                                { selectedFormIds.size > 0 &&
                                    <span className="text-[10px] font-[Lato-Bold] text-amber-600 bg-amber-50 rounded-full px-2 py-0.5"> { selectedFormIds.size } selected </span>
                                }
                            </button>
                            { openSection === 'forms' &&
                                <div className="max-h-56 overflow-y-auto divide-y divide-black/4">
                                    { availableForms.map(f => {
                                        const checked = selectedFormIds.has(f.id);
                                        return (
                                            <button key={f.id} onClick={() => toggleForm(f.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50/40 transition-colors cursor-pointer"
                                            >
                                                <span className={`w-4 h-4 rounded border ${checked ? 'bg-amber-500 border-amber-500' : 'border-black/20 bg-white'} flex items-center justify-center shrink-0`}>
                                                    { checked && <Check className="w-3 h-3 text-white" /> }
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-[Lato-Bold] text-black/70 truncate"> { f.displayName ?? `Form #${f.id}` } </p>
                                                    <p className="text-[10px] font-[Lato-Regular] text-black/40 truncate"> { f.stepTitle } · { f.status } </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            }
                        </div>
                    }

                    { availableDocs.length > 0 &&
                        <div className="border border-black/6 rounded-xl overflow-hidden">
                            <button onClick={() => setOpenSection(openSection === 'docs' ? null : 'docs')}
                                className="w-full flex items-center gap-2 px-3 py-2.5 bg-black/2 hover:bg-black/4 transition-colors cursor-pointer"
                            >
                                { openSection === 'docs' ? <ChevronDown className="w-3.5 h-3.5 text-black/40" /> : <ChevronRight className="w-3.5 h-3.5 text-black/40" /> }
                                <Paperclip className="w-3.5 h-3.5 text-black/50" />
                                <span className="text-xs font-[Lato-Bold] text-black/70 flex-1 text-left"> Documents ({ availableDocs.length }) </span>
                                { selectedDocIds.size > 0 &&
                                    <span className="text-[10px] font-[Lato-Bold] text-amber-600 bg-amber-50 rounded-full px-2 py-0.5"> { selectedDocIds.size } selected </span>
                                }
                            </button>
                            { openSection === 'docs' &&
                                <div className="max-h-56 overflow-y-auto divide-y divide-black/4">
                                    { availableDocs.map(d => {
                                        const checked = selectedDocIds.has(d.id);
                                        return (
                                            <button key={d.id} onClick={() => toggleDoc(d.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50/40 transition-colors cursor-pointer"
                                            >
                                                <span className={`w-4 h-4 rounded border ${checked ? 'bg-amber-500 border-amber-500' : 'border-black/20 bg-white'} flex items-center justify-center shrink-0`}>
                                                    { checked && <Check className="w-3 h-3 text-white" /> }
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-[Lato-Bold] text-black/70 truncate"> { d.fileName } </p>
                                                    <p className="text-[10px] font-[Lato-Regular] text-black/40 truncate"> { d.stepTitle } · { formatSize(d.fileSize) } </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            }
                        </div>
                    }
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-black/6 flex items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" disabled={submitting} onClick={onSkipClick}>
                        Skip and close
                    </Button>
                    <Button variant="primary" size="sm" disabled={submitting || totalSelected === 0} onClick={onConfirmClick}>
                        { submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" /> }
                        Share { totalSelected > 0 ? `${totalSelected} item${totalSelected === 1 ? '' : 's'} ` : '' }and close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClosureShareBackDialog;
