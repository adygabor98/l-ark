import {
    type ReactElement
} from 'react';
import {
    useFormContext,
    useWatch
} from 'react-hook-form';
import {
    useSortable
} from '@dnd-kit/sortable';
import {
    CSS
} from '@dnd-kit/utilities';
import {
    CalendarClock,
    CalendarDays,
    Copy,
    GripVertical,
    PenTool,
    Trash2,
    Type
} from 'lucide-react';
import {
    Badge
} from '../../../shared/components/badge';
import {
    InputNumber,
    Select as AntSelect,
    Radio,
    Checkbox
} from 'antd';
import {
    motion,
    AnimatePresence
} from 'framer-motion';
import {
    FIELD_TYPES,
    TemplateComponents
} from '../../../models/template.models';
import {
    getFieldTypeColor
} from '../../../models/field-type-colors';

interface PropTypes {
    field: any;
    sectionIdx: number;
    fieldIdx: number;
    isSelected: boolean;

    onSelect: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const SortableField = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { field, sectionIdx, fieldIdx, isSelected, onSelect, onDelete, onDuplicate } = props;
    /** Get control from form context */
    const { control } = useFormContext();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    /** Watch live field data for real-time updates from properties panel */
    const liveField = useWatch({ control, name: `sections.${sectionIdx}.fields.${fieldIdx}` });
    const { label, placeholder, required, columns, multiple, options, helpText } = liveField ?? field;
    /** Retrieve the field information by this type */
    const FieldIcon = FIELD_TYPES.find(t => t.id === field.type)?.icon || Type;
    const typeColor = getFieldTypeColor(field.type);

    return (
        <div ref={setNodeRef} style={{ ...style, borderLeftColor: typeColor.hex }} onClick={onSelect}
            className={`
                group relative flex items-start gap-3 p-5 bg-white
                border border-l-2 rounded-2xl rounded-l-md cursor-pointer
                transition-all duration-300 ease-out
                ${ isSelected ? `${typeColor.border} ring-2 ${typeColor.ring} shadow-[0_8px_30px_rgb(0,0,0,0.06)]`
                    : 'border-black/8 hover:border-black/15 hover:shadow-md hover:scale-[1.005]'
                }
            `}
        >
            {/* Field number indicator */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-[Lato-Bold] shrink-0 mt-0.5 ${typeColor.bg} ${typeColor.text}`}>
                {fieldIdx + 1}
            </div>

            {/* Drag handle */}
            <div {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-black/20 hover:text-black/50 transition-colors">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className={`${typeColor.bg} ${typeColor.text} hover:opacity-90 border-none text-[10px] font-[Lato-Bold] tracking-wide uppercase px-2.5 py-1 rounded-lg gap-1.5`}>
                        <FieldIcon className="w-3 h-3" />
                        { FIELD_TYPES.find(t => t.id === field.type)?.label }
                    </Badge>
                    { required &&
                        <span className="text-[10px] text-red-500 font-[Lato-Bold] tracking-wide uppercase bg-red-50/80 px-2 py-0.5 rounded-lg border border-red-100">
                            Required
                        </span>
                    }
                    { liveField?.width && liveField.width !== 'full' &&
                        <span className="text-[10px] font-[Lato-Bold] text-black/40 bg-black/4 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                            {liveField.width}
                        </span>
                    }
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[15px] font-[Lato-Bold] text-black/80 leading-tight"> { label || "Unnamed Field" } </label>
                    { helpText &&
                        <span className="text-[11px] font-[Lato-Light] text-black/40 leading-tight">{helpText}</span>
                    }
                    <span className='text-[11px] font-[Lato-Light] text-black/35 m-0! p-0!'> Preview </span>

                    {/* Field Previews */}
                    <div className="w-full pt-2" onClick={(e) => e.stopPropagation()}>
                        { [TemplateComponents.TEXT, TemplateComponents.EMAIL, TemplateComponents.PHONE].includes(field.type) &&
                            <input placeholder={ placeholder || `${field.type} input` } className="w-full px-2 bg-black/3 border-black/8 rounded-md h-11" />
                        }

                        { field.type === TemplateComponents.TEXTAREA &&
                            <textarea placeholder={ placeholder || "Long text input..." } className="text-xs w-full px-2 py-2 bg-black/3 border-black/8 rounded-md h-27.5" />
                        }

                        { [TemplateComponents.NUMBER, TemplateComponents.CURRENCY, TemplateComponents.PERCENTAGE].includes(field.type) &&
                            <InputNumber
                                placeholder={ placeholder || `0.00` }
                                className="flex! items-center! text-xs w-full! px-2 bg-black/3! border-none! rounded-md h-11"
                                suffix={field.type === TemplateComponents.PERCENTAGE ? '%' : field.type === TemplateComponents.CURRENCY ? '€' : field.type === TemplateComponents.NUMBER ? (field.suffix || '') : ''}
                            />
                        }

                        { field.type === TemplateComponents.SELECT &&
                            <AntSelect
                                mode={multiple ? 'multiple' : undefined}
                                placeholder={multiple ? 'Select options...' : 'Select an option'}
                                className="w-full bg-black/3 border-black/8 rounded-md h-11"
                                style={{ height: 50 }}
                                options={(options || []).map((opt: any) => ({ label: opt.label ?? opt.value ?? '', value: opt.value ?? opt.label ?? '' }))}
                            />
                        }

                        { field.type === TemplateComponents.RADIO_GROUP &&
                            <Radio.Group options={(options || []).map((opt: any) => ({ label: opt.label ?? opt.value ?? '', value: opt.value ?? opt.label ?? '' }))} />
                        }

                        { field.type === TemplateComponents.CHECKBOX &&
                            <Checkbox.Group options={(options || []).map((opt: any) => ({ label: opt.label ?? opt.value ?? '', value: opt.value ?? opt.label ?? '' }))} />
                        }

                        { [TemplateComponents.DATE, TemplateComponents.DATE_TIME].includes(field.type) &&
                            <div className="flex items-center w-full rounded-xl border border-black/8 bg-black/2 px-4 py-3 text-sm text-black/50">
                                { field.type === 'date' ?
                                    <>
                                        <CalendarDays className="w-4 h-4 mr-3" />
                                        Select { field.type }
                                    </>
                                :
                                    <>
                                        <CalendarClock className="w-4 h-4 mr-3" />
                                        Select { field.type }
                                    </>
                                }
                            </div>
                        }

                        { field.type === TemplateComponents.SIGNATURE &&
                            <div className="h-32 w-full rounded-xl border-2 border-dashed border-black/8 bg-black/1 flex flex-col items-center justify-center text-black/40">
                                <PenTool className="w-6 h-6 mb-3" strokeWidth={1.5} />
                                <span className="text-sm font-[Lato-Regular]"> Signature Area </span>
                            </div>
                        }

                        { field.type === TemplateComponents.BOOLEAN &&   
                            <div className="flex items-center space-x-3 pt-1">
                                <div className="w-5 h-5 rounded-[5px] border-2 border-black/15"></div>
                                <label className="text-sm text-black/70 font-[Lato-Regular]">{label}</label>
                            </div>
                        }

                        { field.type === TemplateComponents.FILE &&
                            <div className="h-20 w-full rounded-xl border-2 border-dashed border-black/8 bg-black/1 flex flex-col items-center justify-center text-black/40">
                                <span className="text-sm font-[Lato-Regular]"> Upload File </span>
                            </div>
                        }

                        { field.type === TemplateComponents.ADDRESS &&
                            <div className="space-y-2">
                                <input placeholder="Street Address" className="w-full px-2 rounded-md bg-black/3 border-black/8 h-11" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="City" className="px-2 bg-black/3 border-black/8 rounded-md h-11" />
                                    <input placeholder="State/Province" className="px-2 bg-black/3 border-black/8 rounded-md h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Zip/Postal Code" className="px-2 bg-black/3 border-black/8 rounded-md h-11" />
                                    <input placeholder="Country" className="px-2 bg-black/3 border-black/8 rounded-xl h-11" />
                                </div>
                            </div>
                        }

                        { field.type === TemplateComponents.TABLE &&
                            <div className="w-full rounded-xl border border-black/8 overflow-hidden text-xs">
                                {/* Header row */}
                                { (columns?.length ?? 0) > 0 &&
                                    <div className="flex bg-black/4 border-b border-black/8">
                                        { (columns || []).map((col: any) => (
                                            <div key={col.id} className="flex-1 px-3 py-2 font-[Lato-Bold] text-black/60 truncate">
                                                { col.name }
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>
                        }

                        { field.type === TemplateComponents.DESCRIPTION && (() => {
                            const content = placeholder || 'Enter descriptive text here...';
                            const isHtml = liveField?.format === 'HTML' || (content && content.includes('<'));

                            return (
                                <div className={`w-full text-black/60 text-sm leading-relaxed rounded-[5px] p-3 border-l-4 border-l-blue-400 bg-blue-50/50 pl-4`}>
                                    { isHtml
                                        ? <div dangerouslySetInnerHTML={{ __html: content }} className="rich-text prose prose-sm max-w-none wrap-break-word" />
                                        : <span className="whitespace-pre-wrap"> { content } </span>
                                    }
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                { isSelected &&
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-4 top-4 flex items-center gap-1.5 bg-white border border-black/6 rounded-xl shadow-lg shadow-black/5 p-1.5 z-10"
                    >
                        <button className="p-1.5 text-black/50 hover:text-black hover:bg-black/4 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                            <Copy className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-black/8"></div>
                        <button className="p-1.5 text-red-500/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    );
}

export default SortableField
