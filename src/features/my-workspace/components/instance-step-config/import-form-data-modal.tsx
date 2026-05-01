import {
    useEffect,
    useState,
    useMemo,
    type ReactElement
} from 'react';
import {
    ArrowRight,
    Download,
    Loader2,
    X,
    ChevronLeft,
    FileText,
    Check,
    Link2
} from 'lucide-react';
import { useFileTemplate } from '../../../../server/hooks/useFileTemplate';
import { useOperationInstance } from '../../../../server/hooks/useOperationInstance';
import Button from '../../../../shared/components/button';
import type { FileTemplateInstance, OperationInstance } from '@l-ark/types';

const EXCLUDED_TYPES = ['DESCRIPTION'];

/** Resolve the template title for a form instance from the step's fileTemplates list */
function resolveTemplateTitle( instance: OperationInstance, templateId: number): string {
    for (const si of instance.stepInstances ?? []) {
        const match = (si.step as any)?.fileTemplates?.find(
            (ft: any) => ft.templateId === templateId || ft.template?.id === templateId
        );
        if (match?.template?.title) return match.template.title;
    }
    return `Template #${templateId}`;
}

/** Collect all available forms from an operation instance, excluding the current form */
function collectFormsFromInstance(
    instance: OperationInstance,
    currentFormInstanceId: number | undefined,
    operationLabel: string
): AvailableForm[] {
    const forms: AvailableForm[] = [];
    for (const si of instance.stepInstances ?? []) {
        for (const sif of (si as any).formInstances ?? []) {
            const fi = sif.formInstance;
            if (!fi || fi.id === currentFormInstanceId) continue;
            const templateId = fi.templateVersion?.templateId ?? fi.templateVersionId;
            forms.push({
                formInstanceId: fi.id,
                templateId,
                templateTitle: resolveTemplateTitle(instance, templateId),
                status: fi.status,
                stepTitle: si.step?.title ?? `Step ${si.id}`,
                operationLabel
            });
        }
    }
    return forms;
}

interface AvailableForm {
    formInstanceId: number;
    templateId: number;
    templateTitle: string;
    status: string;
    stepTitle: string;
    operationLabel: string;
}

interface FieldMapping {
    sourceFieldId: string;
    sourceLabel: string;
    sourceValue: unknown;
    targetFieldId: string | '';
}

interface Props {
    currentFormSections: any[];
    currentFormInstanceId?: number;
    instance: OperationInstance;
    onImport: (mappings: FieldMapping[]) => void;
    onClose: () => void;
}

const ImportFormDataModal = ({
    currentFormSections,
    currentFormInstanceId,
    instance,
    onImport,
    onClose
}: Props): ReactElement => {
    const { retrieveFormInstanceById } = useFileTemplate();
    const { retrieveInstanceById } = useOperationInstance();

    const [step, setStep] = useState<'SELECT' | 'MAP'>('SELECT');
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [_, setSourceInstance] = useState<FileTemplateInstance | null>(null);
    const [loadingSource, setLoadingSource] = useState(false);
    const [mappings, setMappings] = useState<FieldMapping[]>([]);
    const [linkedInstances, setLinkedInstances] = useState<OperationInstance[]>([]);
    const [loadingLinked, setLoadingLinked] = useState(false);

    // Fetch linked operation instances on mount so we can include their forms
    useEffect(() => {
        const linkedIds = new Set<number>();
        // sourceLinks: this op is the source → the other op is targetInstance
        for (const link of (instance.sourceLinks ?? []) as any[]) {
            if (link.targetInstance?.id && link.targetInstance.id !== instance.id)
                linkedIds.add(link.targetInstance.id);
        }
        // targetLinks: this op is the target → the other op is sourceInstance
        for (const link of (instance.targetLinks ?? []) as any[]) {
            if (link.sourceInstance?.id && link.sourceInstance.id !== instance.id)
                linkedIds.add(link.sourceInstance.id);
        }

        if (linkedIds.size === 0) return;

        setLoadingLinked(true);
        Promise.all(
            [...linkedIds].map(id =>
                retrieveInstanceById({ id }).then((res: any) => res?.data?.data as OperationInstance | null)
            )
        ).then(results => {
            setLinkedInstances(results.filter(Boolean) as OperationInstance[]);
        }).finally(() => setLoadingLinked(false));
    }, [instance.id]);

    // All available forms: current operation + linked operations
    const availableForms = useMemo((): AvailableForm[] => {
        const forms: AvailableForm[] = collectFormsFromInstance(instance, currentFormInstanceId, 'This operation');
        for (const linked of linkedInstances) {
            const label = (linked as any).title ?? `Operation #${linked.id}`;
            forms.push(...collectFormsFromInstance(linked, currentFormInstanceId, label));
        }
        return forms;
    }, [instance, currentFormInstanceId, linkedInstances]);

    // Group available forms by operation label for rendering
    const formsByOperation = useMemo(() => {
        const map = new Map<string, AvailableForm[]>();
        for (const f of availableForms) {
            const group = map.get(f.operationLabel) ?? [];
            group.push(f);
            map.set(f.operationLabel, group);
        }
        return [...map.entries()];
    }, [availableForms]);

    // All fields in the current form (for target dropdowns), excluding DESCRIPTION
    const targetFields = useMemo(() => {
        return currentFormSections
            .flatMap((s: any) => s.fields ?? [])
            .filter((f: any) => !EXCLUDED_TYPES.includes(f.type))
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }, [currentFormSections]);

    const handleSelectForm = async (formInstanceId: number) => {
        setSelectedFormId(formInstanceId);
        setLoadingSource(true);
        try {
            const res = await retrieveFormInstanceById({ id: formInstanceId });
            const data = (res as any)?.data?.data as FileTemplateInstance;
            setSourceInstance(data);

            const sourceFields = (data?.templateVersion?.sections ?? [])
                .flatMap((s: any) => s.fields ?? [])
                .filter((f: any) => !EXCLUDED_TYPES.includes(f.type))
                .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

            const valueMap = new Map<string, unknown>();
            for (const fv of data?.fieldValues ?? []) {
                valueMap.set(String(fv.fieldId), fv.value);
            }

            // Auto-match by label (case-insensitive)
            const targetByLabel = new Map(
                targetFields.map((tf: any) => [tf.label?.toLowerCase().trim(), String(tf.id)])
            );

            const initial: FieldMapping[] = sourceFields.map((sf: any) => {
                const value = valueMap.get(String(sf.id));
                const autoMatch = targetByLabel.get(sf.label?.toLowerCase().trim()) ?? '';
                return {
                    sourceFieldId: String(sf.id),
                    sourceLabel: sf.label,
                    sourceValue: value,
                    targetFieldId: autoMatch
                };
            });

            setMappings(initial);
            setStep('MAP');
        } finally {
            setLoadingSource(false);
        }
    };

    const handleTargetChange = (sourceFieldId: string, targetFieldId: string) => {
        setMappings(prev =>
            prev.map(m =>
                m.sourceFieldId === sourceFieldId ? { ...m, targetFieldId } : m
            )
        );
    };

    const handleImport = () => {
        const toImport = mappings.filter(m => m.targetFieldId !== '' && m.sourceValue !== undefined);
        onImport(toImport);
        onClose();
    };

    const usedTargetIds = new Set(mappings.map(m => m.targetFieldId).filter(Boolean));
    const mappedCount = mappings.filter(m => m.targetFieldId !== '' && m.sourceValue !== undefined).length;

    const renderSelectStep = () => (
        <div className="flex flex-col gap-3">
            <p className="text-sm font-[Lato-Regular] text-black/50">
                Choose a filled form from this operation or a linked operation to import data from. Values will be applied to the current form — you can edit them before saving.
            </p>

            {loadingLinked && (
                <div className="flex items-center gap-2 text-xs font-[Lato-Regular] text-black/30">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading linked operations…
                </div>
            )}

            {availableForms.length === 0 && !loadingLinked ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <FileText className="w-8 h-8 text-black/20" />
                    <p className="text-sm font-[Lato-Regular] text-black/40">No other filled forms available to import from.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                    {formsByOperation.map(([operationLabel, forms]) => (
                        <div key={operationLabel}>
                            <div className="flex items-center gap-1.5 mb-2">
                                {operationLabel !== 'This operation' && (
                                    <Link2 className="w-3 h-3 text-black/30 shrink-0" />
                                )}
                                <span className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider">
                                    {operationLabel}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {forms.map(form => (
                                    <button
                                        key={form.formInstanceId}
                                        onClick={() => handleSelectForm(form.formInstanceId)}
                                        disabled={loadingSource}
                                        className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border border-black/8 hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-[Lato-Bold] text-black/80 truncate">{form.templateTitle}</p>
                                                <p className="text-xs font-[Lato-Regular] text-black/40">{form.stepTitle} · {form.status}</p>
                                            </div>
                                        </div>
                                        {loadingSource && selectedFormId === form.formInstanceId
                                            ? <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                                            : <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-amber-500 transition-colors shrink-0" />
                                        }
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderMapStep = () => {
        const sourceForm = availableForms.find(f => f.formInstanceId === selectedFormId);
        const sourceTitle = sourceForm?.templateTitle ?? 'Source';
        const sourceOperation = sourceForm?.operationLabel ?? '';

        return (
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-sm font-[Lato-Regular] text-black/50">
                        Match fields from <span className="font-[Lato-Bold] text-black/70">{sourceTitle}</span> to fields in this form. Only matched fields will be imported.
                    </p>
                    {sourceOperation && sourceOperation !== 'This operation' && (
                        <div className="flex items-center gap-1 mt-1">
                            <Link2 className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-[11px] font-[Lato-Regular] text-amber-600">From linked operation: {sourceOperation}</span>
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto max-h-[55vh]">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-black/8">
                                <th className="text-left pb-2 pr-4 text-xs font-[Lato-Bold] text-black/40 uppercase tracking-wider w-[45%]">
                                    From: {sourceTitle}
                                </th>
                                <th className="text-left pb-2 pl-2 text-xs font-[Lato-Bold] text-black/40 uppercase tracking-wider w-[55%]">
                                    Import into field
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {mappings.map(m => {
                                const hasValue = m.sourceValue !== undefined && m.sourceValue !== null && m.sourceValue !== '';
                                const isMapped = m.targetFieldId !== '';
                                const preview = typeof m.sourceValue === 'object'
                                    ? JSON.stringify(m.sourceValue)
                                    : String(m.sourceValue ?? '');

                                return (
                                    <tr key={m.sourceFieldId} className={`${isMapped && hasValue ? 'bg-amber-50/30' : ''}`}>
                                        <td className="py-2.5 pr-4 align-top">
                                            <div className="flex items-start gap-2">
                                                {isMapped && hasValue
                                                    ? <Check className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                    : <div className="w-3.5 h-3.5 shrink-0" />
                                                }
                                                <div className="min-w-0">
                                                    <p className="font-[Lato-Bold] text-black/70 text-xs">{m.sourceLabel}</p>
                                                    {hasValue
                                                        ? <p className="text-[11px] font-[Lato-Regular] text-black/40 truncate max-w-[140px]" title={preview}>{preview}</p>
                                                        : <p className="text-[11px] font-[Lato-Regular] text-black/25 italic">empty</p>
                                                    }
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 pl-2 align-top">
                                            <select
                                                value={m.targetFieldId}
                                                onChange={e => handleTargetChange(m.sourceFieldId, e.target.value)}
                                                className="w-full h-8 px-2 rounded-lg border border-black/10 text-xs font-[Lato-Regular] bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                                            >
                                                <option value="">— Don't import —</option>
                                                {targetFields
                                                    .filter((tf: any) => !usedTargetIds.has(String(tf.id)) || m.targetFieldId === String(tf.id))
                                                    .map((tf: any) => (
                                                        <option key={tf.id} value={String(tf.id)}>{tf.label}</option>
                                                    ))
                                                }
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {mappedCount > 0 && (
                    <p className="text-xs font-[Lato-Regular] text-amber-600">
                        {mappedCount} field{mappedCount !== 1 ? 's' : ''} will be imported
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/6 shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 'MAP' && (
                            <button
                                onClick={() => setStep('SELECT')}
                                className="flex items-center gap-1 text-sm font-[Lato-Regular] text-black/40 hover:text-black/70 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                            <Download className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-[Lato-Bold] text-black/80">
                                {step === 'SELECT' ? 'Import data from form' : 'Map fields'}
                            </h3>
                            <p className="text-[11px] font-[Lato-Regular] text-black/40">
                                {step === 'SELECT' ? 'Step 1 of 2 — Select source form' : 'Step 2 of 2 — Match fields'}
                            </p>
                        </div>
                    </div>
                    <Button variant="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 'SELECT' ? renderSelectStep() : renderMapStep()}
                </div>

                {/* Footer */}
                {step === 'MAP' && (
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-black/6 bg-[#F8F9FA] shrink-0">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleImport}
                            disabled={mappedCount === 0}
                        >
                            <Download className="w-4 h-4" />
                            Import {mappedCount > 0 ? `${mappedCount} field${mappedCount !== 1 ? 's' : ''}` : 'data'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportFormDataModal;
