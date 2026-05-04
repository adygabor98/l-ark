import {
    ConditionalVisibility,
    EdgeConditionType,
    StepType,
    type BlueprintStep,
    type OperationStepEdge,
    type StepInstance,
} from '@l-ark/types';

interface ComputeVisibleStepsArgs {
    stepInstances: StepInstance[];
    blueprintSteps: BlueprintStep[];
    edges: OperationStepEdge[];
    isLaunched: boolean;
}

/**
 * Pure step-visibility resolver — extracted from `useWorkspaceInstance` so
 * the BFS over USER_CHOICE branches and the conditional-visibility filter
 * can be reasoned about (and unit-tested) independently of React state.
 *
 * Rules:
 *  - StepType.WAIT_FOR_LINKED is always visible (regardless of CV).
 *  - LINKED_ONLY visibility hides the step unless the instance was launched.
 *  - STANDALONE_ONLY does the inverse.
 *  - When USER_CHOICE edges exist, only steps reachable from a graph root
 *    via ALWAYS edges + the user's chosen USER_CHOICE edges are visible.
 *  - If the BFS produces nothing (malformed graph), fall back to filtering
 *    by visibility only, so the page renders rather than blanks out.
 */
export function computeVisibleSteps({ stepInstances, blueprintSteps, edges, isLaunched}: ComputeVisibleStepsArgs): StepInstance[] {
    const filterByVisibility = (si: StepInstance): boolean => {
        const bpStep = blueprintSteps.find(s => s.id.toString() === si.stepId.toString());

        if (!bpStep) return true;
        if (bpStep.stepType === StepType.WAIT_FOR_LINKED) return true;

        const cv = bpStep.conditionalVisibility;
        if (cv === ConditionalVisibility.LINKED_ONLY && !isLaunched) return false;
        if (cv === ConditionalVisibility.STANDALONE_ONLY && isLaunched) return false;
        return true;
    };

    const hasUserChoiceEdges = edges.some(e => e.conditionType === EdgeConditionType.USER_CHOICE);
    if (!hasUserChoiceEdges) {
        return stepInstances.filter(filterByVisibility);
    }

    // Map of source step → user-selected edge id (when the user has picked a branch)
    const selectedEdgeByStepId = new Map<number, number>();
    for (const si of stepInstances) {
        if (si.selectedEdgeId != null) {
            selectedEdgeByStepId.set(Number(si.stepId), Number(si.selectedEdgeId));
        }
    }

    // Roots = steps that aren't a target of any edge.
    const allTargetIds = new Set(edges.map(e => Number(e.targetId)));
    const roots = blueprintSteps.filter(s => !allTargetIds.has(Number(s.id)));

    const reachable = new Set<number>();
    const visitOrder: number[] = [];
    const queue: number[] = roots.map(s => Number(s.id));

    while (queue.length > 0) {
        const stepId = queue.shift()!;
        if (reachable.has(stepId)) continue;
        reachable.add(stepId);
        visitOrder.push(stepId);

        const outgoing = edges.filter(e => Number(e.sourceId) === stepId);

        // ALWAYS edges are unconditionally followed.
        for (const e of outgoing.filter(e => e.conditionType === EdgeConditionType.ALWAYS)) {
            queue.push(Number(e.targetId));
        }

        // USER_CHOICE edges only propagate via the chosen branch.
        const userChoiceEdges = outgoing.filter(e => e.conditionType === EdgeConditionType.USER_CHOICE);
        if (userChoiceEdges.length > 0) {
            const selectedEdgeId = selectedEdgeByStepId.get(stepId);
            if (selectedEdgeId != null) {
                const chosen = userChoiceEdges.find(e => Number(e.id) === selectedEdgeId);
                if (chosen) queue.push(Number(chosen.targetId));
            }
        }
    }

    // Fallback when the BFS produced nothing — keep the page renderable.
    if (reachable.size === 0) return stepInstances.filter(filterByVisibility);

    const orderMap = new Map(visitOrder.map((id, idx) => [id, idx] as const));
    return stepInstances
        .filter(si => reachable.has(Number(si.stepId)) && filterByVisibility(si))
        .sort((a, b) => (orderMap.get(Number(a.stepId)) ?? 999) - (orderMap.get(Number(b.stepId)) ?? 999));
}
