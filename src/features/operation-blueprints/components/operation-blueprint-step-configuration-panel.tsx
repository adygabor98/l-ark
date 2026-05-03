import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    useForm
} from 'react-hook-form';
import type {
    FileTemplateSummary,
    OperationBlueprintStepInput
} from '@l-ark/types';
import {
    StepType as StepTypeEnum,
} from '@l-ark/types';
import {
    useFileTemplate
} from '../../../server/hooks/useFileTemplate';
import {
    Settings,
    X,
    Trash2,
    FileText,
    Copy,
    CircleDot,
    Unlink,
    Link2
} from 'lucide-react';
import Button from '../../../shared/components/button';
import Field from '../../../shared/components/field';
import OperationBuilderLinkFileTemplate from './operation-blueprint-link-file-template';

interface PropTypes {
    step: OperationBlueprintStepInput;

    onUpdate: (stepId: string, patch: Partial<OperationBlueprintStepInput>) => void;
    onClose: Dispatch<SetStateAction<string | null>>;
    onDelete: () => void;
}

const OperationBlueprintStepConfigurationPanel = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { step, onUpdate, onClose, onDelete } = props;
    /** File template api utilities */
    const { fileTemplates, retrieveFileTemplates } = useFileTemplate();
    /** Definition of the formulary */
    const { control, watch, getValues, setValue, reset } = useForm<OperationBlueprintStepInput>({
        defaultValues: step,
        mode: 'onChange'
    });
    /** Targeted watches — only re-render the panel for fields that drive conditional UI */
    const stepType = watch('stepType');
    const allowDocumentUpload = watch('allowDocumentUpload');
    const allowInstanceLink = watch('allowInstanceLink');
    /** Creating file template map for fast access on information */
    const templateMap = useMemo(() => {
        const map = new Map<string, FileTemplateSummary>();
        fileTemplates.forEach(t => map.set(String(t.id), t));
        return map;
    }, [fileTemplates]);
    /** State to manage the visibility of the link modal */
    const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
    /** Ref to the scrollable body so we can reset scroll on step change */
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        retrieveFileTemplates();
    }, []);

    useEffect(() => {
        reset(step);
    }, [step, reset]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [step.id]);

    useEffect(() => {
        setValue('fileTemplateConfigs', step.fileTemplateConfigs);
    }, [step.fileTemplateConfigs, setValue]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;

        const subscription = watch((values) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                const {
                    title, description, stepType, waitForLinkedType, openBlueprintIds,
                    notificationPersons, conditionalVisibility, isBlocking, isRequired,
                    allowDocumentUpload, allowInstanceLink, allowInstanceLinkBlueprintIds, expectedDocuments
                } = values;
                onUpdate(step.id, {
                    title,
                    description,
                    stepType,
                    waitForLinkedType,
                    openBlueprintIds,
                    notificationPersons,
                    conditionalVisibility,
                    isBlocking,
                    isRequired,
                    allowDocumentUpload,
                    allowInstanceLink,
                    allowInstanceLinkBlueprintIds,
                    expectedDocuments
                });
            }, 250);
        });

        return () => {
            if (timer) clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, [watch, step.id, onUpdate]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if ( e.key === "Escape" ) onClose(null);
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    /** Manage to remove a file template linked */
    const handleUnlinkTemplate = (templateId: string): void => {
        const current = getValues('fileTemplateConfigs');
        const updated = current.filter(c => c.templateId !== templateId);
        onUpdate(step.id, { fileTemplateConfigs: updated });
    };

    /** Manage to update the tag of 'multiple' for the file template linked */
    const handleToggleMultipleFills = (templateId: string): void => {
        const current = getValues('fileTemplateConfigs');
        const updated = current.map(c =>
            c.templateId === templateId ? { ...c, allowMultipleFills: !c.allowMultipleFills } : c
        );
        onUpdate(step.id, { fileTemplateConfigs: updated });
    };

    /** Manage to update the tag of 'optional' for the file template linked */
    const handleToggleOptional = (templateId: string): void => {
        const current = getValues('fileTemplateConfigs');
        const updated = current.map(c =>
            c.templateId === templateId ? { ...c, isOptional: !c.isOptional } : c
        );
        onUpdate(step.id, { fileTemplateConfigs: updated });
    };

    /** Manage to link a new file template */
	const handleLinkTemplate = (templateId: string): void => {
		const next = [...step.fileTemplateConfigs, { templateId, allowMultipleFills: false, isOptional: false }];

		onUpdate(step.id, { fileTemplateConfigs: next });
	};

    /** Nanage to render the file template sections */
    const renderFileTemplateSection = (): ReactElement => (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest">
                    File Templates Linked
                </label>
                <span className="text-[10px] font-[Lato-Bold] text-black/30 bg-black/4 px-1.5 py-0.5 rounded-full">
                    { step.fileTemplateConfigs.length }
                </span>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setLinkModalOpen(true)} className="w-full">
                <Link2 className="w-3.5 h-3.5" />
                Link New
            </Button>

            {/* Linked templates list */}
            { !step.fileTemplateConfigs || step.fileTemplateConfigs.length === 0 ?
                <p className="text-xs font-[Lato-Regular] text-black/30 italic text-center py-2">
                    No file templates linked
                </p>
            :
                <div className="flex flex-col gap-1.5">
                    { step.fileTemplateConfigs.map(config => {
                        const template = templateMap.get(config.templateId);

                        return (
                            <div key={config.templateId} className="rounded-lg border-[0.5px] border-black/8 bg-secondary/30 overflow-hidden transition-all hover:border-black/12">
                                <div className="flex items-center gap-2 px-2.5 py-2">
                                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span className="text-xs font-[Lato-Bold] text-black/70 truncate flex-1">
                                        { template?.title ?? `Template #${config.templateId}` }
                                    </span>
                                </div>

                                {/* Actions row */}
                                <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-black/4 bg-black/2">
                                    <div className="flex items-center gap-3">
                                        {/* Allow multiple fills toggle */}
                                        <button onClick={() => handleToggleMultipleFills(config.templateId)} className="flex items-center gap-1.5 group/multi cursor-pointer">
                                            <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[0.5px] transition-all ${
                                                config.allowMultipleFills ? 'bg-[#FFBF00] border-[#FFBF00]' : 'border-black/20 bg-white'
                                            }`}>
                                                { config.allowMultipleFills &&
                                                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                }
                                            </div>
                                            <Copy className="w-2.5 h-2.5 text-black/25" />
                                            <span className="text-[10px] font-[Lato-Regular] text-black/45 group-hover/multi:text-black/70 transition-colors">
                                                Multiple
                                            </span>
                                        </button>

                                        {/* Optional toggle */}
                                        <button onClick={() => handleToggleOptional(config.templateId)} className="flex items-center gap-1.5 group/opt cursor-pointer">
                                            <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[0.5px] transition-all ${
                                                config.isOptional ? 'bg-[#FFBF00] border-[#FFBF00]' : 'border-black/20 bg-white'
                                            }`}>
                                                { config.isOptional &&
                                                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                }
                                            </div>
                                            <CircleDot className="w-2.5 h-2.5 text-black/25" />
                                            <span className="text-[10px] font-[Lato-Regular] text-black/45 group-hover/opt:text-black/70 transition-colors">
                                                Optional
                                            </span>
                                        </button>
                                    </div>

                                    {/* Unlink button */}
                                    <button onClick={() => handleUnlinkTemplate(config.templateId)} className="flex items-center gap-1 text-black/30 hover:text-red-500 transition-colors cursor-pointer group/unlink">
                                        <Unlink className="w-3 h-3" />
                                        <span className="text-[10px] font-[Lato-Regular] group-hover/unlink:text-red-500 transition-colors">
                                            Unlink
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            }
        </div>
    );

    return (
        <div className="flex h-full w-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-black/6 px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50">
						<Settings className="w-3 h-3 text-amber-700" />
					</div>
					<h3 className="text-sm font-[Lato-Bold] text-black/80"> Step Settings </h3>
				</div>
				<div className="flex items-center gap-1">
					<button onClick={() => onClose(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-black/30 hover:bg-red-50 hover:text-red-500 transition-all duration-200 cursor-pointer">
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			{/* Body */}
			<div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Title </label>
				<Field control={control} name="title" type="text" placeholder="Step title..." required />

                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Description </label>
				<Field control={control} name="description" type="textarea" placeholder="What happens in this step..." />

                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Step Type </label>
                <Field control={control} name='stepType' type='select' dataType='blueprint-step-types' required />

				{/* Open Blueprints — only when stepType is OPEN_OPERATION */}
				{ stepType === StepTypeEnum.OPEN_OPERATION &&
                    <>
                        <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Which blueprints can open? </label>
                        <Field control={control} name='openBlueprintIds' type='select' dataType='blueprints' multiple required />
                    </>
                }

				{/* Notification Persons — only when stepType is NOTIFICATION */}
				{ stepType === StepTypeEnum.NOTIFICATION &&
					<div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
						<div className="flex items-center gap-2 mb-1">
							<label className="text-[11px] font-[Lato-Bold] text-amber-700 uppercase tracking-widest"> Notification Persons </label>
						</div>
						<Field control={control} name="notificationPersons" type="textarea" placeholder="e.g. Bank, Notaria, Compradors" simple />
						<p className="text-[10px] font-[Lato-Regular] text-amber-600/70"> Comma-separated values. Each person will appear as a checkbox item when the step is active. </p>
					</div>
				}

                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> When is this step visible? </label>
                <Field control={control} name='conditionalVisibility' type='select' dataType='blueprint-conditional-visibility' />

				{/* File Templates Linked */}
                { renderFileTemplateSection() }

				{/* Divider */}
				<div className="h-px bg-linear-to-r from-transparent via-black/8 to-transparent" />

				{/* Toggles */}
                <Field control={control} name='isBlocking' label={ 'Blocking' } type='toggle-switch' placeholder="Next step can't start until this completes" />
                <Field control={control} name='isRequired' label={ 'Required' } type='toggle-switch' placeholder="This step cannot be skipped" />
                <Field control={control} name='allowDocumentUpload' label={ 'Upload Documents' } type='toggle-switch' placeholder="Users can upload documents in this step" />

                { allowDocumentUpload &&
					<div className="flex flex-col gap-2 p-3 rounded-xl bg-green-50/50 border border-green-200/60">
						<div className="flex items-center gap-2 mb-1">
							<label className="text-[11px] font-[Lato-Bold] text-green-700 uppercase tracking-widest"> Expected Documents </label>
						</div>
                        <Field control={control} name="expectedDocuments" type="textarea" placeholder="e.g. DNI (front), Passport" simple />
                        <p className="text-[10px] font-[Lato-Regular] text-green-600/70"> Comma-separated values. Each document will appear as a checkbox item when the step is active. </p>
					</div>
				}

                <Field control={control} name='allowInstanceLink' label={ 'Allow Instance Link' } type='toggle-switch' placeholder="User can choose to link this step to an existing instance or proceed without linking" />

                { allowInstanceLink &&
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-blue-50/50 border border-blue-200/60">
                        <div className="flex items-center gap-2 mb-1">
                            <label className="text-[11px] font-[Lato-Bold] text-blue-700 uppercase tracking-widest"> Allowed Operation Types </label>
                        </div>
                        <Field control={control} name='allowInstanceLinkBlueprintIds' type='select' dataType='blueprints' multiple />
                        <p className="text-[10px] font-[Lato-Regular] text-blue-600/70"> Leave empty to allow all operation types </p>
                    </div>
                }
			</div>

			{/* Footer */}
			<div className="border-t border-black/6 px-4 py-3">
				<Button variant="danger" size="md" onClick={onDelete} className="w-full">
					<Trash2 className="w-3.5 h-3.5" />
					Delete Step
				</Button>
			</div>
            {/* Link File Template Modal */}
			<OperationBuilderLinkFileTemplate
				open={linkModalOpen}
				onClose={() => setLinkModalOpen(false)}
				linkedConfigs={step.fileTemplateConfigs}
				onLink={handleLinkTemplate}
			/>
		</div>
    );
}

export default OperationBlueprintStepConfigurationPanel;
