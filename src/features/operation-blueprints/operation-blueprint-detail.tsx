import {
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    FormProvider,
    useForm
} from 'react-hook-form';
import {
    OperationCreationSteps
} from '../../constants';
import {
    ReactFlowProvider
} from '@xyflow/react';
import {
    useLocation,
    useNavigate
} from 'react-router-dom';
import {
    ConditionalVisibility,
    OperationType,
    type ApiResponse,
    type OperationBlueprintDetail,
    type OperationBlueprintInput,
    type OperationBlueprintVersionInfo
} from '@l-ark/types';
import {
    useToast
} from '../../shared/hooks/useToast';
import {
    getResponseMessage
} from '../../server/hooks/useApolloWithToast';
import type {
    FetchResult
} from '@apollo/client';
import {
    useOperationBlueprint
} from '../../server/hooks/useOperationBlueprint';
import OperationBlueprintCreationForm from './components/operation-blueprint-creation-form';
import OperationBlueprintBuilder from './components/operation-blueprint-builder';

const OperationBlueprintDetailPage = (): ReactElement => {
    /** Location utilities */
	const { state } = useLocation();
    /** Navigation utilities */
    const navigate = useNavigate();
	/** Formulary definition */
	const methods = useForm<OperationBlueprintInput>({
		mode: 'onChange',
		defaultValues: {
			title: '',
			description: '',
			type: OperationType.GLOBAL,
			subType: '',
			divisionId: '',
			maxGlobalOperations: 1,
			requiredOtherBlueprintIds: [],
			prerequisites: [],
			steps: [],
			edges: []
		}
	});
    /** Step of the creation of an operation */
    const [step, setStep] = useState<OperationCreationSteps>(state?.step === 'builder' ? OperationCreationSteps.OPERATION_BUILDER : OperationCreationSteps.OPERATION_FORM);
    /** Toast utilities */
    const { onToast } = useToast();
    /** Operation blueprint api utilities */
    const { retrieveBlueprintById, createOperationBlueprint, updateOperationBlueprint, publishBlueprint, deleteBlueprintOperation } = useOperationBlueprint();
    /** Latest version info (for header badge and publish guard) */
    const [latestVersion, setLatestVersion] = useState<OperationBlueprintVersionInfo | null>(null);

    useEffect(() => {
        if ( state?.id ) {            
            const initialize = async () => {
                const response: FetchResult<{ data: OperationBlueprintDetail }> = await retrieveBlueprintById({ id: state.id });

                if ( response.data?.data ) {
                    const blueprint = response.data.data;

                    setLatestVersion(blueprint.latestVersion ?? null);

                    methods.reset({
                        title: blueprint.title,
                        description: blueprint.description ?? '',
                        type: blueprint.type,
                        subType: blueprint.subType,
                        divisionId: blueprint.divisionId.toString(),
                        maxGlobalOperations: (blueprint as any).maxGlobalOperations !== undefined ? (blueprint as any).maxGlobalOperations : 1,
                        requiredOtherBlueprintIds: blueprint.prerequisites.map(p => p.requiredBlueprintId.toString()),
                        prerequisites: blueprint.prerequisites.map(p => ({
                            requiredBlueprintId: p.requiredBlueprintId.toString(),
                            isRequired: p.isRequired,
                            description: p.description ?? undefined
                        })),
                        steps: blueprint.steps.map(s => ({
                            id: s.id.toString(),
                            stableId: (s as any).stableId,
                            title: s.title,
                            description: s.description,
                            isBlocking: s.isBlocking,
                            isRequired: s.isRequired,
                            allowDocumentUpload: s.allowDocumentUpload,
                            expectedDocuments: s.expectedDocuments,
                            notificationPersons: s.notificationPersons,
                            fileTemplateConfigs: s.fileTemplates.map(ft => ({
                                templateId: ft.templateId.toString(),
                                allowMultipleFills: ft.allowMultipleFills ?? false,
                                isOptional: ft.isOptional ?? false
                            })),
                            position: s.position as { x: number; y: number },
                            stepType: s.stepType ?? 'STANDARD',
                            waitForLinkedType: s.waitForLinkedType ?? undefined,
                            openBlueprintIds: (s as any).openBlueprintIds?.map((id: string | number) => id.toString()) ?? undefined,
                            conditionalVisibility: (s.conditionalVisibility ?? 'always') as ConditionalVisibility,
                            allowInstanceLink: s.allowInstanceLink ?? false
                        })),
                        edges: blueprint.edges.map(e => ({
                            id: e.id.toString(),
                            source: e.sourceId.toString(),
                            target: e.targetId.toString(),
                            conditionType: (e as any).conditionType ?? 'always',
                            label: e.label ?? undefined
                        }))
                    });
                }
            };
            initialize();
        }
    }, [state]);
    
    /** Manage to return to the list of operation blueprint */
    const onBack = (): void => {
        navigate('/operations')
    }

    /** Manage to publish the latest DRAFT version of the blueprint */
    const onPublish = async (): Promise<void> => {
        if ( !state?.id ) return;

        try {
            const response: FetchResult<{ data: ApiResponse }> = await publishBlueprint({ id: state.id });

            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            if( response.data?.data.success ) {
                onBack();
            }
        } catch (e: any) {
            console.error(e);
        }
    }

    /** Manage to create or update an operation blueprint */
    const onSaveDraft = async (): Promise<void> => {
        let values = methods.getValues();    

        values.steps = values.steps.map(step => ({
            ...step,
            conditionalVisibility: ( (step.conditionalVisibility as any) == 'always' ? null : step.conditionalVisibility) as ConditionalVisibility,
            expectedDocuments: typeof step.expectedDocuments === 'string' ? (step.expectedDocuments as string).split(',').map(s => s.trim()).filter(Boolean) : step.expectedDocuments,
            notificationPersons: typeof step.notificationPersons === 'string' ? (step.notificationPersons as string).split(',').map(s => s.trim()).filter(Boolean) : step.notificationPersons
        }));

        try {
            if ( state?.id ) {
                const response: FetchResult<{ data: ApiResponse }> = await updateOperationBlueprint({ id: state.id, input: values });
                
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
                if( response.data?.data.success ) {
                    onBack();
                }
            } else {
                const response: FetchResult<{ data: ApiResponse }> = await createOperationBlueprint({ input: values });
                
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
                if( response.data?.data.success ) {
                    onBack();
                }
            }
        } catch (e: any) {
            console.error(e);
        }
    }

    /** Manage to delete an operation blueprint */
    const onDelete = async (): Promise<void> => {
        try {
            if ( state?.id ) {
                const response: FetchResult<{ data: ApiResponse }> = await deleteBlueprintOperation({ id: state.id });
                
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
                if( response.data?.data.success ) {
                    onBack();
                }
            }
        } catch (e: any) {
            console.error(e);
        }
    }

    return (
		<FormProvider {...methods}>
			{ step === OperationCreationSteps.OPERATION_FORM ?
				<OperationBlueprintCreationForm
					control={methods.control}
					trigger={methods.trigger}
					onNext={() => setStep(OperationCreationSteps.OPERATION_BUILDER)}
					onBack={onBack}
				/>
			:
				<ReactFlowProvider>
					<OperationBlueprintBuilder
						blueprintId={state?.id}
						latestVersion={latestVersion}
						onBack={() => setStep(OperationCreationSteps.OPERATION_FORM)}
						onPublish={onPublish}
						onSaveDraft={onSaveDraft}
						onDelete={onDelete}
					/>
				</ReactFlowProvider>
			}
		</FormProvider>
	);
}

export default OperationBlueprintDetailPage;