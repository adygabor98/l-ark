import {
    type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    ChevronRight,
    LayoutTemplate,
    Plus,
    Trash2
} from 'lucide-react';
import {
    motion,
    AnimatePresence
} from 'framer-motion';
import {
    useFormContext
} from 'react-hook-form';
import {
    DndContext,
    closestCenter,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
    FIELD_WIDTH_MAP,
    type FieldWidth
} from '../../../models/template.models';
import Button from '../../../shared/components/button';
import SortableField from './sortable-field';
import Field from '../../../shared/components/field';

interface PropTypes {
    sections: any[];
    activeSectionId: string | null;

    activeSection: any;
    selectedFieldId: string | null;

    setActiveSectionId: (sectionId: string) => void;
    setSelectedFieldId: (fieldId: string | null) => void;
    deleteField: (id: string) => void;
    duplicateField: (id: string) => void;
    deleteSection: (sectionId: string) => void;
    addSection: () => void;
}

const TemplateCanva = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { sections, activeSectionId, activeSection, selectedFieldId } = props;
    const { setActiveSectionId, setSelectedFieldId, deleteSection, addSection, deleteField, duplicateField } = props;
    /** Get control and mutation methods from form context */
    const { control, getValues, setValue } = useFormContext();
    /** Translation utilities */
    const { t } = useTranslation();
    /** Manage to retrieve the section by his identifier */
    const getSectionId = (): number => sections.findIndex(section => section.id === activeSectionId);
    /** Field IDs for SortableContext */
    const fieldIds = (activeSection?.fields || []).map((f: any) => f.id);

    /** Manage to change the section selected */
    const onChangeSection = (sectionId: string): void => {
        setActiveSectionId(sectionId);
        setSelectedFieldId(null);
    }

    /** Manage to scroll automatically on the next section */
    const scrollLeft = (left: number): void => {
        const el = document.getElementById('section-tabs-container');
        if (el) el.scrollBy({ left: left, behavior: 'smooth' });
    }

    /** Manage to delete a section */
    const onDeleteSection = (e: any, sectionId: string): void => {
        e.stopPropagation();
        deleteSection(sectionId);
    }

    /** Handle drag end for field reordering */
    const handleDragEnd = (event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const sectionIdx = getSectionId();
        if (sectionIdx === -1) return;

        const currentFields = getValues(`sections.${sectionIdx}.fields`) || [];
        const oldIndex = currentFields.findIndex((f: any) => f.id === active.id);
        const newIndex = currentFields.findIndex((f: any) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            setValue(`sections.${sectionIdx}.fields`, arrayMove(currentFields, oldIndex, newIndex));
        }
    };

    return (
        <main className="flex-1 overflow-y-auto flex flex-col relative z-10 rounded-lg">
            {/* Section Tabs (Floating pill design) */}
            <div className="sticky top-0 z-20 w-full pointer-events-none flex items-center justify-center group/nav px-2 bg-white rounded-b-2xl">
                <button onClick={() => scrollLeft(-150)}
                    className="w-8 h-8 rounded-full bg-white border border-black/8 shadow-sm flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 mr-2 pointer-events-auto transition-opacity"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div id="section-tabs-container" className="flex items-center gap-2 overflow-x-auto p-2 rounded-2xl pointer-events-auto">
                    { sections.map((section, idx) => {
                        const isActive = activeSectionId === section.id;

                        return (
                            <div key={section.id} onClick={() => onChangeSection(section.id)}
                                className="relative px-5 py-2.5 rounded-xl text-sm font-[Lato-Regular] cursor-pointer whitespace-nowrap transition-colors flex items-center gap-2"
                            >
                                { isActive &&
                                    <motion.div
                                        layoutId="activeSection"
                                        className="absolute inset-0 bg-primary rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                }
                                <span className={`relative z-10 ${isActive ? "text-white" : "text-black/60 hover:text-black"}`}>
                                    { idx + 1 }. { section.title || t('section.untitled') }
                                </span>

                                {/* Field count badge */}
                                { section.fields?.length > 0 &&
                                    <span className={`relative z-10 text-[10px] font-[Lato-Bold] px-1.5 py-0.5 rounded-md ${ isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-black/40' }`}>
                                        { section.fields.length }
                                    </span>
                                }

                                { sections.length > 1 &&
                                    <button
                                        onClick={(e) => onDeleteSection(e, section.id)}
                                        className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                            isActive ? 'hover:bg-red-200/20 text-white/50 hover:text-red-400' : 'hover:bg-black/5 text-black/40'}`}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                }
                            </div>
                        );
                    })}

                    <Button variant='primary' onClick={addSection}>
                        <Plus className="w-4 h-4" /> { t('buttons.add') }
                    </Button>
                </div>

                <button onClick={() => scrollLeft(150)}
                    className="w-8 h-8 rounded-full bg-white border border-black/8 shadow-sm flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 ml-2 pointer-events-auto transition-opacity"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="px-2 flex justify-center flex-1 rounded-lg">
                <div className="w-full">
                    {/* Active Section Canvas */}
                    { activeSection &&
                        <div className="flex flex-col gap-3 h-[calc(100%-30px)] glass-panel rounded-xl p-4 mt-5">
                            {/* Section Settings inline (update template information) */}
                            <div className="flex flex-col gap-2">
                                <Field control={control} name={`sections.${getSectionId()}.title`} label={ t('section.title-label') } type='text' required />
                                <Field control={control} name={`sections.${getSectionId()}.description`} label={ t('section.description-label') } type='textarea' />
                            </div>

                            {/* Fields List */}
                            <div className="flex flex-col gap-4 min-h-50">
                                {/* Section divider with field count */}
                                <div className="flex items-center gap-3">
                                    <span className='text-xs font-[Lato-Bold] text-black/40 uppercase tracking-widest'> { t('section.fields-label') } </span>
                                    <span className="text-[10px] font-[Lato-Bold] text-black/40 bg-black/4 px-2 py-0.5 rounded-md">
                                        { activeSection.fields.length }
                                    </span>
                                    <div className="flex-1 h-px bg-black/6"></div>
                                </div>

                                { activeSection.fields.length === 0 ?
                                    <div className="h-48 flex flex-col items-center justify-center text-black/30 border-2 border-dashed rounded-2xl border-black/8 bg-linear-to-b from-black/1 to-black/3 transition-colors hover:border-black/12">
                                        <LayoutTemplate className="w-12 h-12 mb-4 opacity-30" strokeWidth={1} />
                                        <p className="text-sm font-[Lato-Bold] text-black/40 mb-1"> { t('section.no-fields') } </p>
                                        <p className="text-xs font-[Lato-Regular] text-black/25"> { t('section.no-fields-hint') } </p>
                                    </div>
                                :
                                    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                                        <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                                            <div className="grid grid-cols-12 gap-3">
                                                <AnimatePresence initial={false}>
                                                    { activeSection.fields.map((field: any, fieldIdx: number) =>
                                                        <div key={field.id} id={`field-${field.id}`} className={FIELD_WIDTH_MAP[(field.width as FieldWidth)] || 'col-span-12'}>
                                                            <SortableField
                                                                field={field}
                                                                sectionIdx={getSectionId()}
                                                                fieldIdx={fieldIdx}
                                                                isSelected={selectedFieldId === field.id}
                                                                onSelect={() => setSelectedFieldId(field.id)}
                                                                onDelete={() => deleteField(field.id)}
                                                                onDuplicate={() => duplicateField(field.id)}
                                                            />
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                }
                            </div>
                        </div>
                    }
                </div>
            </div>
        </main>
    );
}

export default TemplateCanva;
