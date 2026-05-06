import {
    useEffect,
    type ReactElement
} from 'react';
import {
    useTranslation
} from 'react-i18next';
import {
    useOperationBlueprint
} from '../../../server/hooks/useOperationBlueprint';
import {
    useController,
    useWatch,
    type UseFormTrigger
} from 'react-hook-form';
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Workflow,
    X
} from 'lucide-react';
import {
    OperationType,
    type OperationBlueprintInput
} from '@l-ark/types';
import {
    useToast
} from '../../../shared/hooks/useToast';
import Button from '../../../shared/components/button';
import Field from '../../../shared/components/field';

interface PropTypes {
    control: any;
    trigger: UseFormTrigger<OperationBlueprintInput>
    onNext: () => void;
    onBack: () => void;
}

const OperationBlueprintCreationForm = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { control, trigger, onBack, onNext } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    /** Available blueprints for prerequisites */
    const { blueprints, retrieveBlueprints } = useOperationBlueprint();
    /** Watch the type field to conditionally show prerequisites */
    const operationType = useWatch({ control, name: 'type' });
    /** Controller for prerequisites array */
    const { field: prerequisitesField } = useController({ control, name: 'prerequisites', defaultValue: [] });
    /** Toast utilities */
    const { onToast } = useToast();

    useEffect(() => {
        retrieveBlueprints();
    }, []);

    /** Configuration information of the operation */
    const config = {
        icon: Workflow,
        color: "bg-[#FFBF00]",
    };

    /** Manage to analyze if all the required information has been fill out to be able to move to the next step */
    const onNextStep = async (): Promise<void> => {
        const valid = await trigger(['title', 'type', 'subType', 'divisionId']);
        if ( valid ) {
            onNext();
        } else {
            onToast({ message: t('operations.form-invalid'), type: 'error' });
        }
    }

    /** Manage to render the form */
    const renderForm = (): ReactElement => (
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
            <div className="w-full">
                <div className="space-y-10 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
                    <div>
                        <h2 className="text-3xl font-[Lato-Bold] text-foreground mb-3"> { t('operations.configure-title') } </h2>
                        <p className="text-lg text-muted-foreground font-[Lato-Light]"> { t('operations.configure-subtitle') } </p>
                    </div>

                    <div className="space-y-3">
                        <Field control={control} name='title' label={ t('operations.title-label') } placeholder={ t('operations.title-placeholder') } type='text' required />

                        <Field control={control} name='description' label={ t('labels.description') } placeholder={ t('operations.description-placeholder') } type='textarea' />

                        <Field control={control} name='type' label={ t('operations.type-label') } placeholder={ t('operations.type-placeholder') } type='radio' dataType='operation-category' required />

                        <Field control={control} name='subType' label={ t('operations.subtype-label') } placeholder={ t('operations.subtype-placeholder') } type='text' required />

                        <Field control={control} name='divisionId' label={ t('labels.division') } placeholder={ t('operations.division-placeholder') } type='select' dataType='divisions' required />
                    </div>

                    { operationType === OperationType.OTHER &&
                        <div className="flex flex-col gap-1">
                            <Field control={control} name='maxGlobalOperations' label={ t('operations.max-global-label') } placeholder={ t('operations.max-global-placeholder') } type='number' />
                            <p className="text-xs font-[Lato-Regular] text-muted-foreground"> { t('operations.max-global-hint') } </p>
                        </div>
                    }

                    {/* Prerequisites — only for GLOBAL operations */}
                    { operationType === OperationType.GLOBAL &&
                        <div className="space-y-3 p-4 rounded-xl bg-blue-50 border border-blue-200/60">
                            <div>
                                <h3 className="text-sm font-[Lato-Bold] text-blue-800"> { t('operations.prerequisites-section') } </h3>
                                <p className="text-xs font-[Lato-Regular] text-blue-600/70 mt-0.5">
                                    { t('operations.prerequisites-description') }
                                </p>
                            </div>

                            { (prerequisitesField.value ?? []).length > 0 &&
                                <div className="space-y-1.5">
                                    { prerequisitesField.value.map((prereq: any) => {
                                        const blueprint = blueprints.find(blueprint => blueprint.id === prereq.requiredBlueprintId);

                                        return (
                                            <div key={prereq.requiredBlueprintId} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-violet-200/40">
                                                <div>
                                                    <span className="text-xs font-[Lato-Bold] text-black/70"> { blueprint?.title ?? prereq.requiredBlueprintId } </span>
                                                    { blueprint?.subType &&
                                                        <span className="text-[10px] text-black/35 font-[Lato-Regular] ml-1"> { blueprint.subType } </span>
                                                    }
                                                </div>
                                                <button type="button"
                                                    onClick={() => prerequisitesField.onChange((prerequisitesField.value).filter((p: any) => p.requiredBlueprintId !== prereq.requiredBlueprintId))}
                                                    className="w-5 h-5 rounded flex items-center justify-center text-black/30 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            }
                            <Field
                                control={control}
                                name=''
                                label=''
                                type='select'
                                dataType='blueprints'
                                params={{ type: OperationType.OTHER }}
                                className='bg-white'
                                placeholder={ t('operations.prerequisites-placeholder') }
                                onSelectChange={(value: string) => {
                                    if ( !value ) return;

                                    const current = (prerequisitesField.value as any[]) ?? [];
                                    if ( current.some((p: any) => p.requiredBlueprintId === value) ) return;

                                    prerequisitesField.onChange([...current, { requiredBlueprintId: value, isRequired: true }]);
                                }}
                            />
                        </div>
                    }

                    {/* Actions */}
                    <div className="pt-10 border-t border-border flex items-center justify-end gap-6">
                        <Button variant="secondary" size="lg" onClick={() => onBack()} className="rounded-xl">
                            { t('buttons.cancel') }
                        </Button>
                        <Button variant="primary" size="lg" onClick={onNextStep} className="rounded-xl shadow-blue-500/20">
                            { t('operations.next-builder') }
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col md:flex-row">
            {/* Left Panel - Context & Info */}
            <div className={`px-6 py-3 lg:px-12 overflow-y-auto w-full md:w-62.5 lg:w-87.5 shrink-0 flex flex-col justify-between text-white relative animate-in rounded-md slide-in-from-left duration-500 ${config.color}`}>
                <div>
                    <Button variant='icon' onClick={() => onBack()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex md:block items-center gap-4">
                        <div className="bg-white/20 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-0 md:mb-6 backdrop-blur-md border border-white/10 shadow-xl shrink-0">
                            <Workflow className="w-6 h-6 md:w-8 md:h-8 text-neutral-700" />
                        </div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-[Lato-Black] md:mb-4 tracking-tight text-neutral-700"> { t('operations.management-title') } </h1>
                    </div>
                    <p className="hidden md:block text-neutral-700 font-[Lato-Regular] text-base leading-relaxed mb-8"> { t('operations.management-description') } </p>

                    <div className="hidden md:block space-y-4">
                        <h3 className="text-xs font-[Lato-Bold] uppercase text-neutral-700 mb-4"> { t('labels.include-features') } </h3>
                        { [t('operations.feature-flow-builder'), t('operations.feature-step-config'), t('operations.feature-file-templates'), t('operations.feature-global-type')].map((feature: string, i: number) => (
                            <div key={i} className="flex items-center gap-5 text-neutral-700">
                                <div className="p-1 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check className="w-3! h-3!" />
                                </div>
                                <span className="text-sm font-[Lato-Regular]"> { feature } </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            { renderForm() }
        </div>
    );
}

export default OperationBlueprintCreationForm;