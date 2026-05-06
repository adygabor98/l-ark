import {
    type ReactElement,
    useRef,
    useState
} from 'react';
import {
    useFormContext,
    useWatch,
    Controller
} from 'react-hook-form';
import {
    useTranslation
} from 'react-i18next';
import {
    motion,
    AnimatePresence
} from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Settings2,
    Trash2
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../shared/components/select';
import {
    FIELD_COLUMN_TYPES,
    TemplateComponents,
    type OptionItem
} from '../../../models/template.models';
import Field from '../../../shared/components/field';
import TiptapEditor from './tiptap-editor';

interface PropTypes {
    sections: any[];
    activeSectionIdx: number;
    selectedFieldIdx: number;

    selectedField: any;
    selectedFieldId: string | null;

    collapsed?: boolean;
    onToggle?: () => void;
}

const ComponentTemplateProperties = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { activeSectionIdx, selectedFieldIdx, selectedField, collapsed = false, onToggle } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    /** Retrieve the form methods from context */
    const { control, setValue, getValues } = useFormContext();
    /** Base path for the currently selected field in the form */
    const fieldPath = `sections.${activeSectionIdx}.fields.${selectedFieldIdx}`;
    /** Watch reactive data for conditional rendering */
    const watchedOptions: OptionItem[] = useWatch({ control, name: `${fieldPath}.options` }) ?? [];
    const watchedColumns: any[] = useWatch({ control, name: `${fieldPath}.columns` }) ?? [];
    const watchedRequiredDocuments: string[] = useWatch({ control, name: `${fieldPath}.requiredDocuments` }) ?? [];
    const watchedPlaceholder = useWatch({ control, name: `${fieldPath}.placeholder` });
    const watchedWidth = useWatch({ control, name: `${fieldPath}.width` });

    /** Manage to add a new option */
    const addOption = (): void => {
        const current: OptionItem[] = getValues(`${fieldPath}.options`) || [];
        setValue(`${fieldPath}.options`, [
            ...current,
            { value: `opt-${Date.now()}`, label: `Option ${current.length + 1}`, isDefault: false }
        ]);
    };

    /** Manage to remove an existing option */
    const removeOption = (idx: number): void => {
        const current = getValues(`${fieldPath}.options`) || [];
        setValue(`${fieldPath}.options`, current.filter((_: any, i: number) => i !== idx));
    };

    /** Required documents input state */
    const [newDocName, setNewDocName] = useState('');
    const docInputRef = useRef<HTMLInputElement>(null);

    /** Manage required documents list */
    const addRequiredDocument = (): void => {
        const name = newDocName.trim();
        if (!name) return;
        const current: string[] = getValues(`${fieldPath}.requiredDocuments`) || [];
        setValue(`${fieldPath}.requiredDocuments`, [...current, name]);
        setNewDocName('');
        docInputRef.current?.focus();
    };

    const removeRequiredDocument = (idx: number): void => {
        const current: string[] = getValues(`${fieldPath}.requiredDocuments`) || [];
        setValue(`${fieldPath}.requiredDocuments`, current.filter((_: string, i: number) => i !== idx));
    };

    /**
     * Manage to add a new column. The `id` is a UUID treated as the column's
     * stable identifier by export-layout tokens — regenerating it or editing
     * it would orphan existing tokens, so it's written once and never changed.
     */
    const addColumn = (): void => {
        const current = getValues(`${fieldPath}.columns`) || [];
        setValue(`${fieldPath}.columns`, [...current, { id: crypto.randomUUID(), name: `Col ${current.length + 1}`, type: TemplateComponents.TEXT }]);
    };

    /** Manage to remove an existing column */
    const removeColumn = (idx: number): void => {
        const current = getValues(`${fieldPath}.columns`) || [];
        if (current.length <= 1) return;
        setValue(`${fieldPath}.columns`, current.filter((_: any, i: number) => i !== idx));
    };

    // Collapsed state: thin strip with icon
    if (collapsed) {
        return (
            <aside className="w-10 shrink-0 border-l border-black/6 bg-white flex flex-col items-center rounded-lg shadow-sm z-20 relative">
                <button
                    onClick={onToggle}
                    title={ t('properties.expand') }
                    className="p-2 mt-3 rounded-lg text-black/30 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="mt-2 p-2 text-black/40">
                    <Settings2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-black/30 font-[Lato-Regular] [writing-mode:vertical-lr] mt-2 tracking-wider">
                    { t('properties.title').toUpperCase() }
                </span>
            </aside>
        );
    }

    return (
       <aside className="w-[320px] border-l border-black/6 bg-white flex flex-col shrink-0 z-20 relative shadow-[-10px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300">
            <div className="p-6 border-b border-black/4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1">
                    <h2 className="font-[Lato-Bold] text-base tracking-tight"> { t('properties.title') } </h2>
                    <p className="text-xs text-black/40 mt-1 font-[Lato-Regular]"> { t('properties.subtitle') } </p>
                </div>
                <button
                    onClick={onToggle}
                    title={ t('properties.collapse') }
                    className="p-1 rounded-md text-black/30 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                { !selectedField ?
                    <div className="p-12 text-center text-black/30 flex flex-col items-center justify-center h-full">
                        <Settings2 className="w-10 h-10 mb-4 opacity-20" strokeWidth={1.5} />
                        <p className="text-sm font-[Lato-Regular]"> { t('properties.select-field') } </p>
                    </div>
                :
                    <motion.div key={selectedField.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-4">
                        {/* Field Label */}
                        <Field control={control} name={`${fieldPath}.label`} label={ t('properties.field-label') } simple type='text' required />

                        {/* Placeholder (non-description types) */}
                        { [TemplateComponents.TEXT, TemplateComponents.TEXTAREA, TemplateComponents.NUMBER, TemplateComponents.CURRENCY, TemplateComponents.PERCENTAGE, TemplateComponents.EMAIL, TemplateComponents.PHONE].includes(selectedField.type) &&
                            <Field control={control} name={`${fieldPath}.placeholder`} label={ t('properties.field-placeholder-label') } placeholder={ t('properties.placeholder-hint') } simple type='text' />
                        }

                        {/* Suffix — only for NUMBER */}
                        { selectedField.type === TemplateComponents.NUMBER &&
                            <Field control={control} name={`${fieldPath}.suffix`} label={ t('properties.suffix-label') } placeholder={ t('properties.suffix-placeholder') } simple type='text' />
                        }

                        {/* Description content — Tiptap rich text editor */}
                        { selectedField.type === TemplateComponents.DESCRIPTION &&
                            <div className="space-y-2">
                                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('properties.content-label') } </label>
                                <TiptapEditor
                                    value={watchedPlaceholder || ''}
                                    onChange={(html) => setValue(`${fieldPath}.placeholder`, html)}
                                    placeholder={ t('properties.content-placeholder') }
                                />
                            </div>
                        }

                        {/* Help Text */}
                        { selectedField.type !== TemplateComponents.DESCRIPTION &&
                            <Field control={control} name={`${fieldPath}.helpText`} label={ t('properties.help-text-label') } placeholder={ t('properties.help-text-placeholder') } simple type='text' />
                        }

                        {/* Required toggle */}
                        <div className="flex items-center justify-between p-4 border border-black/8 rounded-2xl bg-[#F8F9FA]">
                            <div className="space-y-1">
                                <label className="text-sm font-[Lato-Bold] text-black"> { t('properties.required-label') } </label>
                                <p className="text-xs text-black/50 font-[Lato-Regular]"> { t('properties.required-subtitle') } </p>
                            </div>
                            <Field control={control} name={`${fieldPath}.required`} type='switch' className='w-8.75!' />
                        </div>

                        {/* Width selector */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('properties.field-width-label') } </label>
                            <Select
                                value={watchedWidth || 'full'}
                                onValueChange={(val) => setValue(`${fieldPath}.width`, val)}
                            >
                                <SelectTrigger className="h-10 bg-white border-black/8 rounded-sm text-sm">
                                    <SelectValue placeholder={ t('properties.full-width-placeholder') } />
                                </SelectTrigger>
                                <SelectContent className="rounded-sm border-black/1 shadow-xl">
                                    <SelectItem value="FULL" className="rounded-lg">{ t('properties.full-width-100') }</SelectItem>
                                    <SelectItem value="HALF" className="rounded-lg">{ t('properties.half-50') }</SelectItem>
                                    <SelectItem value="THIRD" className="rounded-lg">{ t('properties.third-33') }</SelectItem>
                                    <SelectItem value="QUARTER" className="rounded-lg">{ t('properties.quarter-25') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selection mode toggle for select field */}
                        { selectedField.type === TemplateComponents.SELECT &&
                            <div className="flex items-center justify-between p-4 border border-black/8 rounded-2xl bg-[#F8F9FA]">
                                <div className="space-y-1">
                                    <label className="text-sm font-[Lato-Bold] text-black"> { t('properties.multiple-selection') } </label>
                                    <p className="text-xs text-black/50 font-[Lato-Regular]"> { t('properties.multiple-selection-hint') } </p>
                                </div>
                                <Field control={control} name={`${fieldPath}.multiple`} type='switch' className='w-8.75!' />
                            </div>
                        }

                        {/* Options management for select/radio/checkbox fields */}
                        { [TemplateComponents.SELECT, TemplateComponents.RADIO_GROUP, TemplateComponents.CHECKBOX].includes(selectedField.type) &&
                            <div className="space-y-4">
                                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('properties.options-label') } </label>
                                <div className="space-y-3">
                                    <AnimatePresence initial={false}>
                                        { watchedOptions.map((_opt: OptionItem, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex flex-col gap-2 p-3 bg-[#F8F9FA] border border-black/8 rounded-xl relative group"
                                            >
                                                <button
                                                    className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-black/8 rounded-full flex items-center justify-center text-black/30 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    onClick={() => removeOption(i)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>

                                                <div className="flex gap-2">
                                                    <div className="flex-1 space-y-1.5">
                                                        <label className="text-[10px] text-black/50 font-[Lato-Regular] uppercase tracking-wider pl-1"> { t('properties.option-label') } </label>
                                                        <Field control={control} name={`${fieldPath}.options.${i}.label`} type='text' simple className='h-9! bg-white!' />
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        <label className="text-[10px] text-black/50 font-[Lato-Regular] uppercase tracking-wider pl-1"> { t('properties.option-value') } </label>
                                                        <Controller
                                                            control={control}
                                                            name={`${fieldPath}.options.${i}.value`}
                                                            render={({ field }) => (
                                                                <input
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z-]/g, ''))}
                                                                    className="h-9 w-full px-3 text-sm border-[0.5px] border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:border-primary/30 font-[Lato-Regular]"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] text-black/50 font-[Lato-Regular] uppercase tracking-wider"> { t('properties.option-default') } </label>
                                                    <Field control={control} name={`${fieldPath}.options.${i}.isDefault`} type='switch' className='w-7.5!' />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-black/15 text-sm font-[Lato-Regular] text-black/50 hover:text-black hover:bg-black/2 transition-colors mt-2"
                                        onClick={addOption}
                                    >
                                        <Plus className="w-4 h-4" /> { t('properties.add-option') }
                                    </button>
                                </div>
                            </div>
                        }

                        {/* Table Column Configuration UI */}
                        { selectedField.type === TemplateComponents.TABLE &&
                            <div className="space-y-4 border-t border-black/8 pt-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('properties.table-columns-label') } </label>
                                    <span className="text-xs font-[Lato-Regular] bg-black/4 text-black/60 px-2 py-0.5 rounded-md">
                                        { watchedColumns.length } Max
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <AnimatePresence initial={false}>
                                        { watchedColumns.map((col: any, idx: number) => (
                                            <motion.div key={col.id || idx}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex flex-col gap-2 p-3 bg-[#F8F9FA] border border-black/8 rounded-xl relative group"
                                            >
                                                <button
                                                    className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-black/8 rounded-full flex items-center justify-center text-black/30 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    onClick={() => removeColumn(idx)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>

                                                <div className="flex gap-2">
                                                    <div className="flex-1 space-y-1.5">
                                                        <label className="text-[10px] text-black/50 font-[Lato-Regular] uppercase tracking-wider pl-1"> { t('properties.col-name') } </label>
                                                        <Field
                                                            control={control}
                                                            name={`${fieldPath}.columns.${idx}.name`}
                                                            placeholder={ t('properties.column-name-placeholder') }
                                                            simple
                                                            type='text'
                                                            className='h-9! bg-white!'
                                                        />
                                                    </div>
                                                    <div className="w-27.5 space-y-1.5">
                                                        <label className="text-[10px] text-black/50 font-[Lato-Regular] uppercase tracking-wider pl-1"> { t('properties.col-type') } </label>
                                                        <Select
                                                            value={col.type}
                                                            onValueChange={(val) => setValue(`${fieldPath}.columns.${idx}.type`, val)}
                                                        >
                                                            <SelectTrigger className="h-9 bg-white border-black/8 rounded-sm text-sm px-2.5">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-sm border-black/1 shadow-xl min-w-30">
                                                                { FIELD_COLUMN_TYPES.map(field => (
                                                                    <SelectItem value={field.id} className="text-sm rounded-lg"> { field.label } </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-black/15 text-sm font-medium text-black/50 hover:text-black hover:bg-black/2 transition-colors mt-2"
                                        onClick={addColumn}
                                    >
                                        <Plus className="w-4 h-4" /> { t('properties.add-column') }
                                    </button>
                                </div>
                            </div>
                        }

                        {/* Required Documents list for FILE type */}
                        { selectedField.type === TemplateComponents.FILE &&
                            <div className="space-y-4 border-t border-black/8 pt-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('properties.required-docs-label') } </label>
                                    { watchedRequiredDocuments.length > 0 &&
                                        <span className="text-xs font-[Lato-Regular] bg-black/4 text-black/60 px-2 py-0.5 rounded-md">
                                            { watchedRequiredDocuments.length }
                                        </span>
                                    }
                                </div>
                                <p className="text-[11px] font-[Lato-Regular] text-black/40 -mt-2"> { t('properties.required-docs-hint') } </p>

                                <div className="space-y-2">
                                    <AnimatePresence initial={false}>
                                        { watchedRequiredDocuments.map((docName: string, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-2 px-3 py-2 bg-[#F8F9FA] border border-black/8 rounded-xl group"
                                            >
                                                <span className="w-5 h-5 shrink-0 rounded-md border border-black/10 bg-white flex items-center justify-center text-[10px] text-black/30 font-[Lato-Bold]">
                                                    { idx + 1 }
                                                </span>
                                                <span className="text-sm font-[Lato-Regular] text-black/70 flex-1 truncate">{ docName }</span>
                                                <button
                                                    className="text-black/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeRequiredDocument(idx)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    <div className="flex gap-2">
                                        <input
                                            ref={docInputRef}
                                            value={newDocName}
                                            onChange={(e) => setNewDocName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequiredDocument())}
                                            placeholder={ t('properties.doc-name-placeholder') }
                                            className="flex-1 h-9 px-3 text-sm border-[0.5px] border-black/15 rounded-lg bg-white shadow-sm focus:outline-none focus:border-[#FFBF00]/50 font-[Lato-Regular] placeholder:text-black/25"
                                        />
                                        <button
                                            onClick={addRequiredDocument}
                                            className="h-9 px-3 rounded-lg border border-dashed border-black/15 text-sm font-[Lato-Regular] text-black/50 hover:text-black hover:bg-black/2 transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> { t('properties.add-doc') }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }
                    </motion.div>
                }
            </div>
        </aside>
    );
}

export default ComponentTemplateProperties;
