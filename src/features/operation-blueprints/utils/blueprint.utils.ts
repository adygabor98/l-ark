import {
    EdgeConditionType,
    OperationBlueprintStatus,
    OperationType,
    StepType,
    type OperationBlueprintStepEdgeInput,
    type OperationBlueprintStepInput
} from '@l-ark/types';
import {
    v4 as uuid
} from 'uuid';
import {
	type Node,
	type Edge,
	MarkerType,
    type Connection
} from "@xyflow/react";
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { Bell, Clock, ExternalLink, GitFork, Layers, type LucideProps } from 'lucide-react';

/** Retrieve the label of the operation type */
export const getTypeLabel = (type: OperationType): string => type === OperationType.GLOBAL ? 'Global' : 'Other';

/** Retrieve the status color style based on the status of the blueprint */
export const getStatusColor = (status: OperationBlueprintStatus): string => {
    switch (status) {
        case OperationBlueprintStatus.ACTIVE:   return 'text-emerald-700';
        case OperationBlueprintStatus.DRAFT:    return 'text-amber-600';
        case OperationBlueprintStatus.COMPLETED: return 'text-blue-600';
        case OperationBlueprintStatus.ARCHIVED: return 'text-slate-500';
        default: return 'text-slate-500';
    }
};

/** retrieve the background depending on the status of the blueprint */
export const getStatusBg = (status: OperationBlueprintStatus): string => {
    switch (status) {
        case OperationBlueprintStatus.ACTIVE:   return 'bg-emerald-50 text-emerald-600';
        case OperationBlueprintStatus.DRAFT:    return 'bg-amber-50 text-amber-600';
        case OperationBlueprintStatus.COMPLETED: return 'bg-blue-50 text-blue-600';
        case OperationBlueprintStatus.ARCHIVED: return 'bg-slate-100 text-slate-500';
        default: return 'bg-slate-50 text-slate-500';
    }
};

/** Manage to create a new step */
export const createNewStep = (existingSteps: number): OperationBlueprintStepInput => ({
    id: uuid(),
    stableId: uuid(),
    title: "New Step",
    description: "",
    isBlocking: false,
    isRequired: false,
    allowDocumentUpload: false,
    fileTemplateConfigs: [],
    position: { x: 250, y: existingSteps * 200 },
    stepType: StepType.STANDARD
});

/** Manage to create a new edge */
export const createEdge = (connection: Connection): OperationBlueprintStepEdgeInput => ({
    id: `e-${connection.source}-${connection.target}`,
    source: connection.source!,
    target: connection.target!,
    conditionType: EdgeConditionType.ALWAYS
});

/** Manage to transform step information into node for react-flow */
export const stepsToNodes = (steps: OperationBlueprintStepInput[]): Node[] => {
    return steps.map((step: OperationBlueprintStepInput, index: number) => ({ id: step.id, type: "stepNode", position: step.position, data: { ...step, stepIndex: index } }));
}

/** Distance threshold (px) below which a branch target is considered "centered" under the source */
const CENTERED_TARGET_THRESHOLD = 5;

/**
 * Determine the visual branch side ("left"/"right") for each USER_CHOICE edge based on the
 * actual layout: where dagre placed the branch relative to its source. Direct-to-merge
 * branches (target ~ centered under source) inherit the side opposite to a sided sibling so
 * the source-handle offset matches the eventual bezier direction and edges don't cross.
 */
const computeBranchSides = (
    edges: OperationBlueprintStepEdgeInput[],
    steps: OperationBlueprintStepInput[]
): Map<string, "left" | "right"> => {
    const stepById = new Map(steps.map((s) => [s.id, s]));
    const result = new Map<string, "left" | "right">();

    const forks = new Map<string, OperationBlueprintStepEdgeInput[]>();
    edges.forEach((e) => {
        if ( e.conditionType !== 'USER_CHOICE' ) return;
        if ( !forks.has(e.source) ) forks.set(e.source, []);
        forks.get(e.source)!.push(e);
    });

    forks.forEach((forkEdges, sourceId) => {
        if ( forkEdges.length < 2 ) return;

        const source = stepById.get(sourceId);
        if ( !source ) return;

        const sided: { edge: OperationBlueprintStepEdgeInput; side: "left" | "right" }[] = [];
        const centered: OperationBlueprintStepEdgeInput[] = [];

        forkEdges.forEach((e) => {
            const target = stepById.get(e.target);
            if ( !target ) {
                centered.push(e);
                return;
            }
            const dx = target.position.x - source.position.x;
            if ( Math.abs(dx) <= CENTERED_TARGET_THRESHOLD ) {
                centered.push(e);
            } else {
                const side: "left" | "right" = dx < 0 ? "left" : "right";
                result.set(e.id, side);
                sided.push({ edge: e, side });
            }
        });

        const usedSides = new Set(sided.map((s) => s.side));
        centered.forEach((e, idx) => {
            let side: "left" | "right";
            if ( !usedSides.has("left") ) {
                side = "left";
                usedSides.add("left");
            } else if ( !usedSides.has("right") ) {
                side = "right";
                usedSides.add("right");
            } else {
                side = idx % 2 === 0 ? "left" : "right";
            }
            result.set(e.id, side);
        });
    });

    return result;
};

/** Manage to transform the edge information of the step into an edge information for the react-flow */
export const edgesToFlow = (
    edges: OperationBlueprintStepEdgeInput[],
    steps: OperationBlueprintStepInput[],
    onDeleteEdge?: (edgeId: string) => void,
    onEditEdge?: (edgeId: string) => void
): Edge[] => {
    const branchSides = computeBranchSides(edges, steps);

    return edges.map((e: OperationBlueprintStepEdgeInput) => {
        const isUserChoice = e.conditionType === 'USER_CHOICE';
        const color = isUserChoice ? "#A78BFA" : "#D4AF37";
        const branchSide = branchSides.get(e.id);

        return {
            id: e.id,
            source: e.source,
            target: e.target,
            type: "deletable",
            animated: !isUserChoice,
            selectable: true,
            deletable: true,
            interactionWidth: 20,
            data: { onDelete: onDeleteEdge, onEdit: onEditEdge, label: e.label, conditionType: e.conditionType, branchSide },
            style: { stroke: color, strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 10, height: 10 }
        };
    });
}

/** Manage to retrieve the accent color depending on the configuration of the step */
export const getAccentColorStepNode = (stepType: StepType, isBlocking: boolean, isRequired: boolean): string => {
    return stepType === StepType.CLOSURE
		? "from-violet-400 to-violet-500"
		: stepType === StepType.WAIT_FOR_LINKED
			? "from-cyan-400 to-cyan-500"
			: stepType === StepType.OPEN_OPERATION
				? "from-teal-400 to-teal-500"
				: stepType === StepType.NOTIFICATION
                    ? 'from-blue-400 to-blue-500'
                    : isBlocking
                        ? "from-red-400 to-red-500"
                        : isRequired
                            ? "from-indigo-400 to-indigo-500"
                            : "from-[#FFBF00] to-[#D4AF37]";
}

/** Manage to retrieve the icon color depending on the configuration of the step */
export const getIconStyleStepNode = (stepType: StepType, isBlocking: boolean, isRequired: boolean): string => {
    return stepType === StepType.CLOSURE
		? "text-violet-600 bg-violet-50 border-violet-200/60"
		: stepType === StepType.WAIT_FOR_LINKED
			? "text-cyan-600 bg-cyan-50 border-cyan-200/60"
			: stepType === StepType.OPEN_OPERATION
				? "text-teal-600 bg-teal-50 border-teal-200/60"
				: stepType === StepType.NOTIFICATION
                    ? 'text-blue-500 bg-blue-50 border-blue-200/60'
                    : isBlocking
                        ? "text-red-600 bg-red-50 border-red-200/60"
                        : isRequired
                            ? "text-indigo-600 bg-indigo-50 border-indigo-200/60"
                            : "text-amber-700 bg-amber-50 border-amber-200/60";
}

/** Manage to retrieve the icon depending on the step type */
export const getIconStepNode = (stepType: StepType): ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> => {
    return stepType === StepType.CLOSURE ? GitFork
		: stepType === StepType.WAIT_FOR_LINKED ? Clock
		: stepType === StepType.OPEN_OPERATION ? ExternalLink
        : stepType === StepType.NOTIFICATION ? Bell
		: Layers;
}

/** Manage to retrieve the number of the step background color */
export const getStepNodeNumberBackground = (isBlocking: boolean, isRequired: boolean): string => isBlocking ? "bg-red-500" : isRequired ? "bg-indigo-500" : "bg-[#FFBF00]";

/** Manage to retrieve the status dot style of the step background color */
export const getStepNodeStatusDotStyle = (isBlocking: boolean, isRequired: boolean): string => isBlocking ? "bg-red-400" : isRequired ? "bg-indigo-400" : "bg-emerald-400";

/** Manage to retrieve the label of the step */
export const getStepNodeLabel = (isBlocking: boolean, isRequired: boolean): string => isBlocking ? "Blocks next" : isRequired ? "Must complete" : "Optional";