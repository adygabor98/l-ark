import {
    useEffect,
    useState,
    useMemo,
    type ReactElement
} from 'react';
import {
    useNavigate,
    useParams
} from 'react-router-dom';
import {
    ArrowLeft,
    Link2,
    Plus,
    Trash2,
    Loader2,
    X,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import {
    useFileTemplate,
    type TemplateFieldMapping
} from '../../../server/hooks/useFileTemplate';
import { useToast } from '../../../shared/hooks/useToast';
import Button from '../../../shared/components/button';

const EXCLUDED_TYPES = ['DESCRIPTION', 'FILE', 'SIGNATURE', 'TABLE'];

function getAllFields(version: TemplateFieldMapping['sourceVersion']) {
    return (version?.sections ?? []).flatMap(s => s.fields ?? []);
}

function findFieldLabel(version: TemplateFieldMapping['sourceVersion'], stableId: string): string {
    return getAllFields(version).find(f => f.stableId === stableId)?.label ?? stableId;
}

interface AddMappingModalProps {
    targetVersionId: number;
    targetVersion: TemplateFieldMapping['targetVersion'];
    existingMappings: TemplateFieldMapping[];
    onClose: () => void;
    onCreated: (mapping: TemplateFieldMapping) => void;
}

const AddMappingModal = ({ targetVersionId, targetVersion, existingMappings, onClose, onCreated }: AddMappingModalProps): ReactElement => {
    const { retrieveFileTemplates, fileTemplates, retrieveFileTemplateById } = useFileTemplate();
    const { onToast } = useToast();
    const { createTemplateFieldMapping } = useFileTemplate();

    const [sourceTemplateId, setSourceTemplateId] = useState('');
    const [sourceVersionId, setSourceVersionId] = useState('');
    const [sourceVersionData, setSourceVersionData] = useState<TemplateFieldMapping['sourceVersion'] | null>(null);
    const [sourceFieldStableId, setSourceFieldStableId] = useState('');
    const [targetFieldStableId, setTargetFieldStableId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        retrieveFileTemplates();
    }, []);

    const currentTemplateId = targetVersion?.template?.id;
    const availableSourceTemplates = (fileTemplates ?? []).filter(t => String(t.id) !== String(currentTemplateId));

    const selectedSourceTemplate = availableSourceTemplates.find(t => String(t.id) === sourceTemplateId);
    const sourceVersions = (selectedSourceTemplate as any)?.versions ?? [];

    // When source template changes, load full detail for field picking
    useEffect(() => {
        setSourceVersionId('');
        setSourceVersionData(null);
        setSourceFieldStableId('');
        setTargetFieldStableId('');
    }, [sourceTemplateId]);

    useEffect(() => {
        if (!sourceVersionId || !sourceTemplateId) return;
        const load = async () => {
            const res = await retrieveFileTemplateById({ id: Number(sourceTemplateId) });
            const template = (res as any)?.data?.data;
            const version = (template?.versions ?? []).find((v: any) => String(v.id) === sourceVersionId);
            setSourceVersionData(version ?? null);
        };
        load();
    }, [sourceVersionId, sourceTemplateId]);

    const alreadyMappedTargetStableIds = new Set(
        existingMappings
            .filter(m => String(m.sourceVersionId) === sourceVersionId)
            .map(m => m.targetFieldStableId)
    );

    const availableSourceFields = getAllFields(sourceVersionData)
        .filter(f => !EXCLUDED_TYPES.includes(f.type));

    const availableTargetFields = getAllFields(targetVersion)
        .filter(f => !EXCLUDED_TYPES.includes(f.type) && !alreadyMappedTargetStableIds.has(f.stableId));

    const canSubmit = sourceVersionId && sourceFieldStableId && targetFieldStableId;

    const handleCreate = async () => {
        if (!canSubmit) return;
        setSaving(true);
        try {
            const res = await createTemplateFieldMapping({
                input: {
                    sourceVersionId: Number(sourceVersionId),
                    sourceFieldStableId,
                    targetVersionId,
                    targetFieldStableId
                }
            });
            const created = (res as any)?.data?.data;
            if (created) {
                onCreated(created);
                onClose();
            } else {
                onToast({ message: 'Failed to create mapping', type: 'error' });
            }
        } catch {
            onToast({ message: 'Failed to create mapping', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-md font-[Lato-Bold] text-black/80">Add Field Mapping</h3>
                    <Button variant="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>

                <p className="text-sm font-[Lato-Regular] text-black/50">
                    Select a source template and field whose value will be automatically synced into a field in this template when a form is saved.
                </p>

                {/* Source template */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-[Lato-Bold] text-black/60 uppercase tracking-wider">Source Template</label>
                    <select
                        value={sourceTemplateId}
                        onChange={e => setSourceTemplateId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-black/10 text-sm font-[Lato-Regular] bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                        <option value="">Select a template…</option>
                        {availableSourceTemplates.map((t: any) => (
                            <option key={t.id} value={String(t.id)}>{t.title}</option>
                        ))}
                    </select>
                </div>

                {/* Source version */}
                {sourceTemplateId && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-[Lato-Bold] text-black/60 uppercase tracking-wider">Source Version</label>
                        <select
                            value={sourceVersionId}
                            onChange={e => setSourceVersionId(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-black/10 text-sm font-[Lato-Regular] bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                        >
                            <option value="">Select a version…</option>
                            {sourceVersions.map((v: any) => (
                                <option key={v.id} value={String(v.id)}>
                                    v{v.versionNumber} {v.status === 'PUBLISHED' ? '(published)' : `(${v.status?.toLowerCase()})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Source field */}
                {sourceVersionId && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-[Lato-Bold] text-black/60 uppercase tracking-wider">Source Field</label>
                        {!sourceVersionData ? (
                            <div className="flex items-center gap-2 text-sm text-black/40">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading fields…
                            </div>
                        ) : (
                            <select
                                value={sourceFieldStableId}
                                onChange={e => setSourceFieldStableId(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-black/10 text-sm font-[Lato-Regular] bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                                <option value="">Select a field…</option>
                                {availableSourceFields.map(f => (
                                    <option key={f.stableId} value={f.stableId}>{f.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Arrow divider */}
                {sourceFieldStableId && (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-black/8" />
                        <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex-1 h-px bg-black/8" />
                    </div>
                )}

                {/* Target field */}
                {sourceFieldStableId && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-[Lato-Bold] text-black/60 uppercase tracking-wider">Target Field (this template)</label>
                        {availableTargetFields.length === 0 ? (
                            <p className="text-sm text-black/40 font-[Lato-Regular]">All eligible fields are already mapped for this source version.</p>
                        ) : (
                            <select
                                value={targetFieldStableId}
                                onChange={e => setTargetFieldStableId(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-black/10 text-sm font-[Lato-Regular] bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                                <option value="">Select a field…</option>
                                {availableTargetFields.map(f => (
                                    <option key={f.stableId} value={f.stableId}>{f.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button variant="primary" onClick={handleCreate} disabled={!canSubmit || saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add Mapping
                    </Button>
                </div>
            </div>
        </div>
    );
};

const FieldMappingsPage = (): ReactElement => {
    const { templateId, versionId } = useParams<{ templateId: string; versionId: string }>();
    const navigate = useNavigate();
    const { onToast, onConfirmationToast } = useToast();
    const {
        fileTemplate,
        retrieveFileTemplateById,
        getTemplateMappingsForTargetVersion,
        deleteTemplateFieldMapping
    } = useFileTemplate();

    const [mappings, setMappings] = useState<TemplateFieldMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const targetVersion = useMemo(() => {
        const versions = (fileTemplate as any)?.versions ?? [];
        return versions.find((v: any) => String(v.id) === versionId) ?? null;
    }, [fileTemplate, versionId]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await retrieveFileTemplateById({ id: Number(templateId) });
            const res = await getTemplateMappingsForTargetVersion({ targetVersionId: Number(versionId) });
            const data = (res as any)?.data?.data ?? [];
            setMappings(data);
            setLoading(false);
        };
        load();
    }, [templateId, versionId]);

    const handleDelete = async (mapping: TemplateFieldMapping) => {
        const { confirmed } = await onConfirmationToast({
            title: 'Remove mapping?',
            description: `This will stop syncing "${findFieldLabel(mapping.sourceVersion, mapping.sourceFieldStableId)}" into "${findFieldLabel(mapping.targetVersion, mapping.targetFieldStableId)}". Existing synced values will remain.`,
            actionText: 'Remove',
            cancelText: 'Cancel',
            actionColor: 'error'
        });
        if (!confirmed) return;

        setDeletingId(mapping.id);
        try {
            await deleteTemplateFieldMapping({ id: Number(mapping.id) });
            setMappings(prev => prev.filter(m => m.id !== mapping.id));
            onToast({ message: 'Mapping removed', type: 'success' });
        } catch {
            onToast({ message: 'Failed to remove mapping', type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const groupedMappings = useMemo(() => {
        const groups = new Map<string, { label: string; items: TemplateFieldMapping[] }>();
        for (const m of mappings) {
            const key = `${m.sourceVersionId}`;
            const label = `${m.sourceVersion?.template?.title ?? 'Unknown'} v${m.sourceVersion?.versionNumber ?? '?'}`;
            if (!groups.has(key)) groups.set(key, { label, items: [] });
            groups.get(key)!.items.push(m);
        }
        return Array.from(groups.values());
    }, [mappings]);

    const templateTitle = (fileTemplate as any)?.title ?? 'Template';
    const versionNumber = targetVersion?.versionNumber ?? '?';

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <header className="min-h-20 flex items-center justify-between bg-white rounded-lg pr-4 shadow-sm z-20 shrink-0 sticky top-0 mb-5">
                <div className="flex items-center gap-2">
                    <Button variant="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Link2 className="w-4 h-4 text-amber-500" />
                            <span className="text-md font-[Lato-Bold]">Field Mappings</span>
                        </div>
                        <span className="text-xs font-[Lato-Light] text-black/50">
                            {templateTitle} · v{versionNumber}
                        </span>
                    </div>
                </div>

                <Button variant="primary" onClick={() => setShowAddModal(true)} disabled={loading || !targetVersion}>
                    <Plus className="w-4 h-4" />
                    Add Mapping
                </Button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-1">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    </div>
                ) : mappings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                            <Link2 className="w-6 h-6 text-amber-400" />
                        </div>
                        <p className="text-sm font-[Lato-Bold] text-black/50">No field mappings yet</p>
                        <p className="text-xs font-[Lato-Regular] text-black/35 text-center max-w-xs">
                            Add mappings to auto-fill fields in this template from another template's data when a form is saved.
                        </p>
                        <Button variant="secondary" onClick={() => setShowAddModal(true)}>
                            <Plus className="w-4 h-4" /> Add your first mapping
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-2xl">
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs font-[Lato-Regular] text-amber-800">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Mappings are version-pinned. When either template gets a new version, you must add new mappings for the new version pair.</span>
                        </div>

                        {groupedMappings.map(group => (
                            <div key={group.label} className="bg-white rounded-xl border border-black/8 overflow-hidden">
                                <div className="px-4 py-3 bg-[#FAFAFA] border-b border-black/6 flex items-center gap-2">
                                    <Link2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span className="text-xs font-[Lato-Bold] text-black/60 uppercase tracking-wider">
                                        From: {group.label}
                                    </span>
                                </div>

                                <div className="divide-y divide-black/5">
                                    {group.items.map(mapping => {
                                        const sourceLabel = findFieldLabel(mapping.sourceVersion, mapping.sourceFieldStableId);
                                        const targetLabel = findFieldLabel(mapping.targetVersion, mapping.targetFieldStableId);
                                        return (
                                            <div key={mapping.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-sm font-[Lato-Regular] text-black/70 truncate">{sourceLabel}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span className="text-sm font-[Lato-Bold] text-black/80 truncate">{targetLabel}</span>
                                                </div>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => handleDelete(mapping)}
                                                    disabled={deletingId === mapping.id}
                                                    className="ml-3 shrink-0 text-black/30 hover:text-red-500"
                                                >
                                                    {deletingId === mapping.id
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Trash2 className="w-4 h-4" />
                                                    }
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && targetVersion && (
                <AddMappingModal
                    targetVersionId={Number(versionId)}
                    targetVersion={targetVersion as any}
                    existingMappings={mappings}
                    onClose={() => setShowAddModal(false)}
                    onCreated={m => setMappings(prev => [...prev, m])}
                />
            )}
        </div>
    );
};

export default FieldMappingsPage;
