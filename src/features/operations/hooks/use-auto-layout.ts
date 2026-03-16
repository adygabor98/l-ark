import {
	useCallback
} from "react";
import type {
	Step,
	StepEdge
} from "../types/operation";
import dagre from "@dagrejs/dagre";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;

export function useAutoLayout() {
	const getLayoutedElements = useCallback(
		(steps: Step[], edges: StepEdge[]): { steps: Step[]; edges: StepEdge[] } => {
			const g = new dagre.graphlib.Graph();
			g.setDefaultEdgeLabel(() => ({}));
			g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 50 });

			steps.forEach((step) => {
				g.setNode(step.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
			});

			edges.forEach((edge) => {
				g.setEdge(edge.source, edge.target);
			});

			dagre.layout(g);

			const layoutedSteps = steps.map((step) => {
				const node = g.node(step.id);
				return {
					...step,
					position: {
						x: node.x - NODE_WIDTH / 2,
						y: node.y - NODE_HEIGHT / 2,
					},
				};
			});

			return { steps: layoutedSteps, edges };
		},
		[]
	);

	return { getLayoutedElements };
}
