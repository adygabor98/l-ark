import {
	useCallback,
	useEffect,
	useRef
} from "react";
import {
	ReactFlow,
	Controls,
	MiniMap,
	Background,
	BackgroundVariant,
	useNodesState,
	useEdgesState,
	type Connection,
	type Node,
	type Edge,
	type NodeTypes,
	MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StepNode } from "../../components/flow/step-node";
import { useAutoLayout } from "../../hooks/use-auto-layout";
import { Button } from "../../components/ui/button";
import type { Step, StepEdge } from "../../types/operation";

const nodeTypes: NodeTypes = {
	stepNode: StepNode,
};

interface FlowEditorProps {
	steps: Step[];
	edges: StepEdge[];
	onStepsChange: (steps: Step[], edges: StepEdge[]) => void;
	onStepSelect: (stepId: string | null) => void;
	selectedStepId: string | null;
}

function stepsToNodes(steps: Step[]): Node[] {
	return steps.map((step) => ({
		id: step.id,
		type: "stepNode",
		position: step.position,
		data: { ...step },
	}));
}

function edgesToFlow(edges: StepEdge[]): Edge[] {
	return edges.map((e) => ({
		id: e.id,
		source: e.source,
		target: e.target,
		animated: true,
		selectable: true,
		deletable: true,
		interactionWidth: 16,
		style: { stroke: "#a5b4fc", strokeWidth: 1.5 },
		markerEnd: { type: MarkerType.ArrowClosed, color: "#a5b4fc", width: 10, height: 10 },
	}));
}

export function FlowEditor({
	steps,
	edges: stepEdges,
	onStepsChange,
	onStepSelect,
	selectedStepId,
}: FlowEditorProps) {
	const { getLayoutedElements } = useAutoLayout();
	const stepsRef = useRef(steps);
	stepsRef.current = steps;
	const stepEdgesRef = useRef(stepEdges);
	stepEdgesRef.current = stepEdges;

	const [nodes, setNodes, onNodesChange] = useNodesState(stepsToNodes(steps));
	const [edges, setEdges, onEdgesChange] = useEdgesState(edgesToFlow(stepEdges));

	// Sync external step/edge updates to internal React Flow state
	useEffect(() => {
		setNodes(stepsToNodes(steps));
	}, [steps, setNodes]);

	useEffect(() => {
		setEdges(edgesToFlow(stepEdges));
	}, [stepEdges, setEdges]);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (connection.source === connection.target) return;
			const current = stepEdgesRef.current;
			const dup = current.find(
				(e) => e.source === connection.source && e.target === connection.target
			);
			if (dup) return;
			const newEdge: StepEdge = {
				id: `e-${connection.source}-${connection.target}`,
				source: connection.source!,
				target: connection.target!,
			};
			onStepsChange(stepsRef.current, [...current, newEdge]);
		},
		[onStepsChange]
	);

	const onNodeDragStop = useCallback(
		(_: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
			const posMap = new Map(draggedNodes.map((n) => [n.id, n.position]));
			const updatedSteps = stepsRef.current.map((s) => {
				const newPos = posMap.get(s.id);
				return newPos ? { ...s, position: newPos } : s;
			});
			onStepsChange(updatedSteps, stepEdgesRef.current);
		},
		[onStepsChange]
	);

	const onNodesDelete = useCallback(
		(deleted: Node[]) => {
			const deletedIds = new Set(deleted.map((n) => n.id));
			const remainingSteps = stepsRef.current.filter((s) => !deletedIds.has(s.id));
			const remainingEdges = stepEdgesRef.current.filter(
				(e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
			);
			onStepsChange(remainingSteps, remainingEdges);
			if (selectedStepId && deletedIds.has(selectedStepId)) {
				onStepSelect(null);
			}
		},
		[onStepsChange, selectedStepId, onStepSelect]
	);

	const onEdgesDelete = useCallback(
		(deleted: Edge[]) => {
			const deletedIds = new Set(deleted.map((e) => e.id));
			const remaining = stepEdgesRef.current.filter((e) => !deletedIds.has(e.id));
			onStepsChange(stepsRef.current, remaining);
		},
		[onStepsChange]
	);

	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			onStepSelect(node.id);
		},
		[onStepSelect]
	);

	const onPaneClick = useCallback(() => {
		onStepSelect(null);
	}, [onStepSelect]);

	const autoLayout = useCallback(() => {
		const { steps: layouted, edges: layoutedEdges } = getLayoutedElements(
			stepsRef.current,
			stepEdgesRef.current
		);
		onStepsChange(layouted, layoutedEdges);
	}, [getLayoutedElements, onStepsChange]);

	return (
		<div className="relative h-full w-full rounded-2xl border border-border/60 bg-white shadow-lg overflow-hidden">
			{/* Floating pill toolbar */}
			<div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 glass rounded-full px-1.5 py-1 border border-border/40 shadow-sm">
				<Button size="sm" variant="ghost" onClick={autoLayout} className="rounded-full h-7 px-2.5 text-xs">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
					</svg>
					Auto Layout
				</Button>
				{steps.length > 0 && (
					<span className="text-[10px] font-medium text-text-muted px-1.5">
						{steps.length} step{steps.length !== 1 ? "s" : ""}
					</span>
				)}
			</div>

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
				fitView
				fitViewOptions={{ padding: 0.3 }}
				proOptions={{ hideAttribution: true }}
				deleteKeyCode={["Backspace", "Delete"]}
				className="bg-linear-to-br from-slate-50 via-white to-indigo-50/30"
			>
				<Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#ddd6fe" />
				<Controls showInteractive={false} />
				<MiniMap
					nodeColor="#c7d2fe"
					maskColor="rgba(248, 250, 252, 0.85)"
				/>
			</ReactFlow>
		</div>
	);
}
