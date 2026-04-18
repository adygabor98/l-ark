import {
    useCallback,
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    EdgeConditionType,
    type OperationBlueprintInput,
    type OperationBlueprintStepEdgeInput,
    type OperationBlueprintStepInput
} from '@l-ark/types';
import {
    useFormContext,
    useWatch
} from 'react-hook-form';
import {
    createNewStep
} from '../utils/blueprint.utils';
import {
    Settings
} from 'lucide-react';
import {
    useToast
} from '../../../shared/hooks/useToast';
import {
    useAutoLayout
} from '../hooks/useAutoLayout';
import OperationBlueprintHeader from './operation-blueprint-header';
import OperationBlueprintStepList from './operation-blueprint-step-list';
import OperationBlueprintEdgeConfigurationPanel from './operation-blueprint-edge-configuration-panel';
import OperationBlueprintStepConfigurationPanel from './operation-blueprint-step-configuration-panel';
import OperationBlueprintFlowEditor from './opertion-blueprint-flow-editor';

interface PropTypes {
    blueprintId: number;

    onBack: () => void;
    onPublish: () => void;
    onSaveDraft: () => void;
    onDelete: () => void;
}


const OperationBlueprintBuilder = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { blueprintId, onBack, onPublish, onSaveDraft, onDelete } = props;
    /** Form context */
    const { control, getValues, setValue } = useFormContext<OperationBlueprintInput>();
    const watchedTitle = useWatch({ control, name: 'title' });
    const watchedDescription = useWatch({ control, name: 'description' });
    /** Local state for steps/edges */
    const [steps, setSteps] = useState<OperationBlueprintStepInput[]>(() => getValues('steps') ?? []);
    const [edges, setEdges] = useState<OperationBlueprintStepEdgeInput[]>(() => getValues('edges') ?? []);
     /** State to manage the selected step */
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    /** State to manage the selected edge for editing */
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    /** Selected step object */
    const selectedStep = selectedStepId ? steps.find(s => s.id === selectedStepId) ?? null : null;
    /** Auto layout utilities */
    const { getLayoutedElements } = useAutoLayout();
    /** Toast utilities */
    const { onConfirmationToast } = useToast();

    /** Sync steps and edges to form context */
    useEffect(() => {
        setValue('steps', steps);
        setValue('edges', edges);
    }, [steps, edges, setValue]);

    /** Manage the add of a new step */
    const handleAddStep = useCallback((): void => {
        const newStep: OperationBlueprintStepInput = createNewStep(steps.length);

        const lastStep = steps[steps.length - 1];
        const newEdges: OperationBlueprintStepEdgeInput[] = lastStep
            ? [...edges, { id: `e-${lastStep.id}-${newStep.id}`, source: lastStep.id, target: newStep.id, conditionType: EdgeConditionType.ALWAYS }]
            : [...edges];

        const { steps: layouted, edges: layoutedEdges } = getLayoutedElements([...steps, newStep], newEdges);

        setSteps(layouted);
        setEdges(layoutedEdges);
        setSelectedStepId(newStep.id);
    }, [steps, edges, getLayoutedElements]);

    /** Manage to update the steps and edges modified */
    const handleStepsChange = useCallback((newSteps: OperationBlueprintStepInput[], newEdges: OperationBlueprintStepEdgeInput[]): void => {
        setSteps(newSteps);
        setEdges(newEdges);
    }, []);

    /** Manage to update the edge modified */
    const handleEdgeUpdate = useCallback((edgeId: string, patch: Partial<OperationBlueprintStepEdgeInput>) => {
        setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, ...patch } : e));
    }, []);

    /** Manage to render the edge selected configuration panel */
    const renderEdgeSelected = ((): ReactElement | null => {
        const selectedEdge = edges.find(e => e.id === selectedEdgeId) ?? null;

        if ( !selectedEdge ) return null;

        const sourceStep = steps.find(s => s.id === selectedEdge.source);
        const targetStep = steps.find(s => s.id === selectedEdge.target);
        
        return <OperationBlueprintEdgeConfigurationPanel
            edge={selectedEdge}
            sourceTitle={sourceStep?.title || 'Source'}
            targetTitle={targetStep?.title || 'Target'}
            onUpdate={handleEdgeUpdate}
            onClose={setSelectedEdgeId}
        />;
    })();

    /** Manage to update the information of the selected step */
    const handleStepUpdate = useCallback((stepId: string, patch: Partial<OperationBlueprintStepInput>) => {
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...patch } : s));
    }, []);

    /** Manage to delete a step */
    const onStepDelete = useCallback(async (): Promise<void> => {
        if ( !selectedStepId ) return;

        const { confirmed } = await onConfirmationToast({
            title: 'Delete this step?',
            description: 'This will remove the step and all its connections. This action cannot be undone.',
            actionText: 'Delete',
            cancelText: 'Cancel',
            actionColor: 'error',
        });

        if ( confirmed ) {
            const deletedIndex = steps.findIndex(s => s.id === selectedStepId);
            const remainingSteps = steps.filter(s => s.id !== selectedStepId);

            setSteps(remainingSteps);
            setEdges(prev => prev.filter(e => e.source !== selectedStepId && e.target !== selectedStepId));

            if ( remainingSteps.length === 0 ) {
                setSelectedStepId(null);
            } else {
                const nextFocusIndex = deletedIndex > 0 ? deletedIndex - 1 : 0;
                setSelectedStepId(remainingSteps[nextFocusIndex].id);
            }
        }
    }, [selectedStepId, steps, onConfirmationToast]);

    /** Manage to render the step configuration panel */
    const renderStepSelected = (): ReactElement => (
        <div className="w-72 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
            { selectedStep ?
                <OperationBlueprintStepConfigurationPanel
                    step={selectedStep}
                    onUpdate={handleStepUpdate}
                    onClose={setSelectedStepId}
                    onDelete={onStepDelete}
                />
            :
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-black/3 rounded-xl flex items-center justify-center mb-3">
                        <Settings className="w-5 h-5 text-black/20" />
                    </div>
                    <p className="text-sm font-[Lato-Bold] text-black/70"> Step Settings </p>
                    <p className="mt-1 text-xs font-[Lato-Regular] text-black/40 leading-relaxed max-w-40">
                        Select a step or connection to configure it
                    </p>
                </div>
            }
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <OperationBlueprintHeader
                operationId={blueprintId}
                title={watchedTitle}
                description={watchedDescription}
                onBack={onBack}
                onDelete={onDelete}
                onPublish={onPublish}
                handleSaveDraft={onSaveDraft}
            />

            {/* Panel Layout */}
            <div className="flex-1 flex gap-2 overflow-hidden relative rounded-lg">
                {/* Left Panel — Step List */}
                <OperationBlueprintStepList
                    steps={steps}
                    selectedStepId={selectedStepId}
                    setSelectedStepId={setSelectedStepId}
                    handleAddStep={handleAddStep}
                />

                {/* Center — Flow Editor */}
                <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0">
                        <OperationBlueprintFlowEditor
                            steps={steps}
                            stepEdges={edges}
                            onStepsChange={handleStepsChange}
                            onStepSelect={(id) => { setSelectedStepId(id); setSelectedEdgeId(null); }}
                            selectedStepId={selectedStepId}
                            selectedEdgeId={selectedEdgeId}
                            onEdgeSelect={(id) => { setSelectedEdgeId(id); setSelectedStepId(null); }}
                            focusStepId={selectedStepId}
                        />
                    </div>
                </div>

                {/* Right Panel — Step Config or Edge Config */}
                { selectedEdgeId ? renderEdgeSelected : renderStepSelected() }
            </div>
        </div>
    );
}

export default OperationBlueprintBuilder;