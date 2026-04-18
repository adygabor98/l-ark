import {
    useState,
    useEffect,
    useRef,
    useCallback,
    type ReactElement
} from "react";
import {
    Save,
    Rocket,
    ChevronLeft,
    Eye,
    Layout,
    Trash2Icon,
    Loader2,
    Check,
    Circle,
    ChevronDown
} from "lucide-react";
import {
    useNavigate
} from "react-router-dom";
import {
    useFormContext,
    useFieldArray,
    useWatch
} from "react-hook-form";
import {
    TemplateComponents,
    type TemplateFormSectionStructure,
    type TemplateFormSectionFieldStructure
} from "../../../models/template.models";
import Button from "../../../shared/components/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "../../../shared/components/dropdown-button";
import {
    useToast
} from "../../../shared/hooks/useToast";
import TemplateDocumentPreview from "./template-document-preview";
import ComponentsTemplate from "./components-template";
import TemplateCanva from "./template-canva";
import ComponentTemplateProperties from "./component.template-properties";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface PropTypes {
    id: number;
    templateVersionId: number | null;

    onBack: () => void;
    onSubmit: () => void;
    onAutoSave?: () => Promise<void>;
    /** Immediate (non-debounced) save — called before navigating to Export Layout */
    onAutoSaveImmediate?: () => Promise<void>;
    /** Dirty state owned by the parent — drives the circle indicator and nav blocker */
    isDirty: boolean;
    /** Notifies the parent whenever the dirty state changes */
    onDirtyChange?: (dirty: boolean) => void;
    /** When true, cancels any pending auto-save timer and blocks new ones (e.g. while nav confirmation is shown) */
    pauseAutoSave?: boolean;
    onPublish: () => void;
    onDeleteVersion: () => void;
}

const TemplateBuilder = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { id, templateVersionId, onBack, onSubmit, onAutoSave, onAutoSaveImmediate, isDirty, onDirtyChange, pauseAutoSave, onPublish, onDeleteVersion } = props;
    /** Track whether we're doing a save-before-navigate to Export Layout */
    const [isNavSaving, setIsNavSaving] = useState(false);
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Get form methods from context (provided by FormProvider in template-detail) */
    const { control, getValues, setValue, clearErrors } = useFormContext();
    /** useFieldArray for structural section operations (append/remove) */
    const { append, remove } = useFieldArray({ control, name: 'sections', keyName: '_rhfId' });
    /** Live reactive sections */
    const sections: TemplateFormSectionStructure[] = useWatch({ control, name: 'sections' }) ?? [];
    /** Watched template metadata for header */
    const watchedTitle = useWatch({ control, name: 'title' });
    const watchedDescription = useWatch({ control, name: 'description' });
    /** State to manage the select element in the template builder */
    const [activeSectionId, setActiveSectionId] = useState<string | null>(sections.length > 0 ? sections[0].id : null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>("f1");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
    const { onConfirmationToast, onToast } = useToast();
    /** Auto-save state */
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** Track previous form snapshot so we only mark dirty on real content changes
     *  (survives React StrictMode double-effect and useWatch reference changes) */
    const prevSnapshotRef = useRef<string | null>(null);
    /** Derived state from live watched sections */
    const activeSectionIndex = sections.findIndex(s => s.id === activeSectionId);
    const activeSection = activeSectionIndex >= 0 ? sections[activeSectionIndex] : null;

    /** Compute selected field and its index from live watched data */
    let selectedField: TemplateFormSectionFieldStructure | undefined;
    let selectedFieldIdx: number = -1;
    if (selectedFieldId && activeSection?.fields) {
        const idx = activeSection.fields.findIndex(f => f.id === selectedFieldId);
        if (idx !== -1) {
            selectedField = activeSection.fields[idx];
            selectedFieldIdx = idx;
        }
    }

    /** Select the first section once data loads (e.g. when returning from export layout) */
    useEffect(() => {
        if ( !activeSectionId && sections.length > 0 ) {
            setActiveSectionId(sections[0].id);
        }
    }, [sections]);

    /** Notify parent of dirty state changes */
    const markDirty = useCallback((dirty: boolean) => {
        onDirtyChange?.(dirty);
    }, [onDirtyChange]);

    /** Auto-save: debounce 3s after any form change (only when editing existing template) */
    const handleAutoSave = useCallback(async () => {
        if (!onAutoSave) return;
        setSaveStatus('saving');
        try {
            await onAutoSave();
            setSaveStatus('saved');
            markDirty(false);
        } catch {
            setSaveStatus('error');
        }
    }, [onAutoSave, markDirty]);

    /** Cancel any pending auto-save immediately when navigation confirmation is shown */
    useEffect(() => {
        if (pauseAutoSave && autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
    }, [pauseAutoSave]);

    useEffect(() => {
        const snapshot = JSON.stringify([sections, watchedTitle, watchedDescription]);

        if (prevSnapshotRef.current === null) {
            // First value after mount — store baseline, don't mark dirty
            prevSnapshotRef.current = snapshot;
            return;
        }

        if (prevSnapshotRef.current === snapshot) return; // same content, skip
        prevSnapshotRef.current = snapshot;

        markDirty(true);
        if (!onAutoSave || pauseAutoSave) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(handleAutoSave, 3000);

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [sections, watchedTitle, watchedDescription]);

    /** Clear "saved" status after 3s */
    useEffect(() => {
        if (saveStatus === 'saved') {
            const t = setTimeout(() => setSaveStatus('idle'), 3000);
            return () => clearTimeout(t);
        }
    }, [saveStatus]);

    /** Manage to create a new section */
    const addSection = (): void => {
        const newSection: TemplateFormSectionStructure = {
            id: `sec-${Date.now()}`,
            title: `Section ${sections.length + 1}`,
            fields: []
        };
        append(newSection);
        setActiveSectionId(newSection.id);
        setSelectedFieldId(null);

        setTimeout(() => {
            const el = document.getElementById('section-tabs-container');
            if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        }, 50);
    };

    /** Manage to delete an existing section */
    const deleteSection = (id: string): void => {
        if (sections.length <= 1) return;

        const index = sections.findIndex(s => s.id === id);
        if (index === -1) return;

        if (activeSectionId === id) {
            const remaining = sections.filter(s => s.id !== id);
            setActiveSectionId(remaining.length > 0 ? remaining[0].id : null);
            setSelectedFieldId(null);
        }

        remove(index);
    };

    /** Manage to add a new field into the active section */
    const addField = (type: TemplateComponents): void => {
        if (activeSectionIndex === -1) return;

        const isChoiceType = [TemplateComponents.SELECT, TemplateComponents.RADIO_GROUP, TemplateComponents.CHECKBOX].includes(type);

        const newField: TemplateFormSectionFieldStructure = {
            id: `f${Date.now()}`,
            type,
            label: type === TemplateComponents.DESCRIPTION ? '' : 'New Field',
            placeholder: null,
            helpText: null,
            required: false,
            options: isChoiceType ? [{ value: 'option-1', label: 'Option 1', isDefault: false }] : [],
            columns: [],
            requiredDocuments: [],
            format: 'HTML',
            width: 'FULL',
            multiple: false
        };

        const currentFields = getValues(`sections.${activeSectionIndex}.fields`) || [];
        setValue(`sections.${activeSectionIndex}.fields`, [...currentFields, newField]);
        setSelectedFieldId(newField.id);
    };

    /** Manage to delete an existing field of the active sections */
    const deleteField = (id: string): void => {
        if (activeSectionIndex === -1) return;

        const currentFields = getValues(`sections.${activeSectionIndex}.fields`) || [];
        setValue(`sections.${activeSectionIndex}.fields`, currentFields.filter((f: any) => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    /** Manage to duplicate an existing field into the active section */
    const duplicateField = (id: string): void => {
        const allSections: TemplateFormSectionStructure[] = getValues('sections');

        for (let si = 0; si < allSections.length; si++) {
            const fi = allSections[si].fields.findIndex(f => f.id === id);

            if (fi !== -1) {
                const newField = { ...allSections[si].fields[fi], id: `f${Date.now()}` };
                const newFields = [...allSections[si].fields];
                newFields.splice(fi + 1, 0, newField);
                setValue(`sections.${si}.fields`, newFields);
                setSelectedFieldId(newField.id);
                setActiveSectionId(allSections[si].id);
                break;
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Minimalistic Header */}
            <header className="min-h-20 flex items-center justify-between bg-white rounded-lg pr-4 shadow-sm z-20 shrink-0 sticky top-0 mb-5">
                <div className="flex items-center gap-2">
                    <Button variant="icon" onClick={onBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span className="text-md font-[Lato-Bold]"> { watchedTitle || 'Untitled Template' } </span>
                        </div>
                        <span className="text-xs font-[Lato-Light] line-clamp-1 max-w-50"> { watchedDescription || 'No description' } </span>
                    </div>
                </div>

                <div className="flex items-center justify-end flex-wrap gap-3">
                    { saveStatus === 'saving' &&
                        <span className="text-xs text-black/40 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                    }
                    { saveStatus === 'saved' &&
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved
                        </span>
                    }

                    {/* ── Group 1: Preview split button ── */}
                    <div className="flex items-center">
                        <Button variant="secondary" onClick={() => setIsPreviewOpen(true)} className="rounded-r-none border-r-0">
                            <Eye className="w-4 h-4" />
                            Preview
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-9.5 px-1.5 bg-secondary text-secondary-foreground border border-border/60 border-l-border/30 rounded-r-sm hover:bg-secondary/70 transition-colors cursor-pointer flex items-center">
                                    <ChevronDown className="w-3.5 h-3.5 text-black/40" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem className="rounded-lg cursor-pointer p-2.5 gap-2" onClick={() => setIsPreviewOpen(true)}>
                                    <Eye className="w-4 h-4" /> Preview
                                </DropdownMenuItem>
                                { id && templateVersionId &&
                                    <DropdownMenuItem className="rounded-lg cursor-pointer p-2.5 gap-2" disabled={isNavSaving} onClick={async () => {
                                        if (isDirty && onAutoSaveImmediate) {
                                            setIsNavSaving(true);
                                            onToast({ message: 'Saving changes before opening Export Layout...', type: 'info' });
                                            try {
                                                await onAutoSaveImmediate();
                                                markDirty(false);
                                                navigate(`/templates/export-layout/${id}/${templateVersionId}`);
                                            } catch {
                                                onToast({ message: 'Failed to save changes. Please try again.', type: 'error' });
                                            } finally {
                                                setIsNavSaving(false);
                                            }
                                        } else {
                                            navigate(`/templates/export-layout/${id}/${templateVersionId}`);
                                        }
                                    }}>
                                        { isNavSaving
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Layout className="w-4 h-4" />
                                        }
                                        Export Layout
                                    </DropdownMenuItem>
                                }
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* ── Group 2: Publish with confirmation ── */}
                    { id &&
                        <Button variant="primary" onClick={async () => {
                            const { confirmed, dismiss } = await onConfirmationToast({
                                title: 'Publish this form?',
                                description: 'Once published, this form will be available for use. Make sure all fields and sections are configured correctly.',
                                actionText: 'Yes, Publish',
                                cancelText: 'Cancel',
                                actionColor: 'success',
                            });
                            if (confirmed) { dismiss(); onPublish(); }
                        }}>
                            <Rocket className="w-4 h-4" />
                            Publish
                        </Button>
                    }

                    {/* ── Group 3: Save Draft split button (rightmost = safe default) ── */}
                    <div className="flex items-center">
                        <Button variant="secondary" onClick={() => { clearErrors(); onSubmit(); }} className="rounded-r-none border-r-0">
                            <Save className="w-4 h-4" />
                            <span className="flex items-center gap-1.5">
                                Save Draft
                                { isDirty && <Circle className="w-2 h-2 fill-current" /> }
                            </span>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-9.5 px-1.5 bg-secondary text-secondary-foreground border border-border/60 border-l-border/30 rounded-r-sm hover:bg-secondary/70 transition-colors cursor-pointer flex items-center">
                                    <ChevronDown className="w-3.5 h-3.5 text-black/40" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem className="rounded-lg cursor-pointer p-2.5 gap-2" onClick={() => { clearErrors(); onSubmit(); }}>
                                    <Save className="w-4 h-4" /> Save Draft
                                </DropdownMenuItem>
                                { id && <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="rounded-lg cursor-pointer p-2.5 gap-2 text-destructive focus:text-destructive" onClick={() => onDeleteVersion()}>
                                        <Trash2Icon className="w-4 h-4" /> Remove Version
                                    </DropdownMenuItem>
                                </> }
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex gap-2 overflow-hidden relative rounded-lg">
                {/* Minimal Left Panel: Elements Palette */}
               <ComponentsTemplate addField={addField} />

                {/* Center: Canvas */}
                <TemplateCanva
                    sections={sections}
                    activeSectionId={activeSectionId}
                    activeSection={activeSection}
                    selectedFieldId={selectedFieldId}
                    setActiveSectionId={setActiveSectionId}
                    setSelectedFieldId={setSelectedFieldId}
                    deleteField={deleteField}
                    duplicateField={duplicateField}
                    deleteSection={deleteSection}
                    addSection={addSection}
                />

                {/* Right Panel: Properties */}
                <ComponentTemplateProperties
                    sections={sections}
                    activeSectionIdx={activeSectionIndex}
                    selectedFieldIdx={selectedFieldIdx}
                    selectedFieldId={selectedFieldId}
                    selectedField={selectedField}
                    collapsed={propertiesCollapsed}
                    onToggle={() => setPropertiesCollapsed(prev => !prev)}
                />
            </div>

            <TemplateDocumentPreview
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />

        </div>
    );
}

export default TemplateBuilder;
