import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactElement
} from 'react';
import {
    LayoutGrid
} from 'lucide-react';
import {
    Background,
    BackgroundVariant,
    Controls,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,
    type Node,
    type Edge,
    type NodeTypes,
    type EdgeTypes
} from '@xyflow/react';
import type {
    OperationBlueprintStepEdgeInput,
    OperationBlueprintStepInput
} from '@l-ark/types';
import {
    createEdge,
    edgesToFlow,
    stepsToNodes
} from '../utils/blueprint.utils';
import {
    OperationBlueprintStepNode
} from './operation-blueprint-step-node';
import {
    OperationBlueprintDeletableEdge
} from './operation-blueprint.deletable-edge';
import Button from '../../../shared/components/button';
import { useAutoLayout } from '../hooks/useAutoLayout';

interface PropTypes {
    steps: OperationBlueprintStepInput[];
    stepEdges: OperationBlueprintStepEdgeInput[];
    selectedStepId: string | null;
    selectedEdgeId: string | null;
    focusStepId?: string | null;

    onStepsChange: (steps: OperationBlueprintStepInput[], edges: OperationBlueprintStepEdgeInput[]) => void;
	onStepSelect: (stepId: string | null) => void;
	onEdgeSelect: (edgeId: string | null) => void;
}

const nodeTypes: NodeTypes = {
    stepNode: OperationBlueprintStepNode
};

const edgeTypes: EdgeTypes = {
    deletable: OperationBlueprintDeletableEdge
};

interface FlowToolbarProps {
    focusStepId?: string | null;
    rearrageElements: () => void;
    nodes: Node[];
}

const FlowToolbar = (props: FlowToolbarProps): ReactElement => {
    /** React flow utilities */
    const { setCenter } = useReactFlow();

    useEffect(() => {
        if ( props.focusStepId && props.nodes.length > 0 ) {
            const node = props.nodes.find((n) => n.id === props.focusStepId);
            if ( node ) {
                setTimeout(() => {
                    setCenter(node.position.x + 75, node.position.y + 40, { zoom: 1.2, duration: 150 });
                }, 0);
            }
        }
    }, [props.focusStepId, props.nodes, setCenter]);

    return (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-1 border border-black/6 shadow-sm">
            <Button size="sm" variant="ghost" onClick={props.rearrageElements} className="rounded-full h-7 px-2.5 text-xs">
                <LayoutGrid className="w-3 h-3" />
                Auto Layout
            </Button>
        </div>
    );
};

const OperationBlueprintFlowEditor = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { steps, stepEdges, selectedStepId, selectedEdgeId, focusStepId, onStepsChange, onEdgeSelect, onStepSelect } = props;
    /** Autolayout utilities */
    const { getLayoutedElements } = useAutoLayout();
    /** Steps reference */
    const stepsRef = useRef(steps);
    /** Initialize the steps reference */
    stepsRef.current = steps;
    /** Step edges reference */
    const stepEdgesRef = useRef(stepEdges);
    /** Initialize the steps edges reference */
    stepEdgesRef.current = stepEdges;
    /** Definition of the deletion of an edge */
    const handleDeleteEdge = useCallback((edgeId: string): void => {
        const remaining = stepEdgesRef.current.filter((e) => e.id !== edgeId);
        onStepsChange(stepsRef.current, remaining);
    }, [onStepsChange]);
    /** Definition of the edition of an edge */
    const handleEditEdge = useCallback((edgeId: string): void => onEdgeSelect(edgeId), [onEdgeSelect]);
    /** Nodes and edges initialization */
    const [nodes, setNodes, onNodesChange] = useNodesState(stepsToNodes(steps));
    const [edges, setEdges, onEdgesChange] = useEdgesState(edgesToFlow(stepEdges, steps, handleDeleteEdge, handleEditEdge));
    /** Track whether initial auto-layout has been applied */
    const [didInitialLayout, setDidInitialLayout] = useState<boolean>(false);

    useEffect(() => {
        if ( !didInitialLayout && steps.length > 0 ) {
            const { steps: layouted, edges: layoutedEdges } = getLayoutedElements(steps, stepEdges);

            onStepsChange(layouted, layoutedEdges);
            setDidInitialLayout(true);
        } else {
            setNodes(stepsToNodes(steps));
        }
    }, [steps, setNodes]);

    useEffect(() => {
        setEdges(edgesToFlow(stepEdges, steps, handleDeleteEdge, handleEditEdge));
    }, [stepEdges, steps, setEdges, handleDeleteEdge, handleEditEdge]);

    /** Manage the auto layout of the template */
	const rearrageElements = useCallback((): void=> {
		const { steps: layouted, edges: layoutedEdges } = getLayoutedElements( stepsRef.current, stepEdgesRef.current );

		onStepsChange(layouted, layoutedEdges);
	}, [getLayoutedElements, onStepsChange]);

    /** Manage the create the connection between two steps*/
    const onConnect = useCallback((connection: Connection): void => {
        if ( connection.source === connection.target ) return;

        const stepIds = new Set(stepsRef.current.map((s) => s.id));
        if ( !connection.source || !connection.target ) return;
        if ( !stepIds.has(connection.source) || !stepIds.has(connection.target) ) return;

        const current = stepEdgesRef.current;
        const duplicateRelation = current.find((e) => e.source === connection.source && e.target === connection.target);
        if ( duplicateRelation ) return;

        const newEdge: OperationBlueprintStepEdgeInput = createEdge(connection);

        onStepsChange(stepsRef.current, [...current, newEdge]);
    }, [onStepsChange]);

    /** Manage to update the position of an existing node */
    const onNodeDragStop = useCallback((_: React.MouseEvent, _node: Node, draggedNodes: Node[]): void => {
        const posMap = new Map(draggedNodes.map((n) => [n.id, n.position]));
        const updatedSteps = stepsRef.current.map((s) => {
            const newPos = posMap.get(s.id);

            return newPos ? { ...s, position: newPos } : { ...s };
        });

        onStepsChange(updatedSteps, stepEdgesRef.current);
    }, [onStepsChange]);

    /** Manage to delete a node and un select the step selected if any */
    const onNodesDelete = useCallback((deleted: Node[]): void => {
        const deletedIds = new Set(deleted.map((n) => n.id));
        const remainingSteps = stepsRef.current.filter((s) => !deletedIds.has(s.id));
        const remainingEdges = stepEdgesRef.current.filter((e) => !deletedIds.has(e.source) && !deletedIds.has(e.target));

        onStepsChange(remainingSteps, remainingEdges);
        if ( selectedStepId && deletedIds.has(selectedStepId) ) {
            onStepSelect(null);
        }
    }, [onStepsChange, selectedStepId, onStepSelect]);

    /** Manage to delete an edge and unselect the selected edge */
    const onEdgesDelete = useCallback((deleted: Edge[]): void => {
        const deletedIds = new Set(deleted.map((e) => e.id));
        const remaining = stepEdgesRef.current.filter((e) => !deletedIds.has(e.id));

        onStepsChange(stepsRef.current, remaining);
        if ( selectedEdgeId && deletedIds.has(selectedEdgeId) ) {
            onEdgeSelect(null);
        }
    }, [onStepsChange]);

    /** Manage to select a node clicked by the end user */
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node): void => onStepSelect(node.id), [onStepSelect]);

    /** Manage the clicked of the pane*/
    const onPaneClick = useCallback((): void =>  onStepSelect(null), [onStepSelect]);

    return (
        <div className="relative h-full w-full rounded-xl border border-black/6 bg-white shadow-sm overflow-hidden">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeDragStop={onNodeDragStop}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				onNodeClick={onNodeClick}
				onPaneClick={onPaneClick}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				fitViewOptions={{ padding: 0.3 }}
				proOptions={{ hideAttribution: true }}
				deleteKeyCode={["Backspace", "Delete"]}
				className="bg-[#F8F9FA]"
			>
				<FlowToolbar focusStepId={focusStepId} rearrageElements={rearrageElements} nodes={nodes} />
				<Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#d4d4d4" />
				<Controls showInteractive={false} />
			</ReactFlow>
		</div>
    );
}

export default OperationBlueprintFlowEditor;