import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
	type Dispatch,
	type SetStateAction
} from "react";
import {
	ConditionalVisibility,
	EdgeConditionType,
	LinkType,
	OperationType,
	StepInstanceStatus,
	type BlueprintStep,
	type OperationBlueprintDetail,
	type OperationInstance,
	type StepInstance
} from "@l-ark/types";
import {
	useOperationInstance
} from "../../../server/hooks/useOperationInstance";
import type {
	FetchResult
} from "@apollo/client";
import {
	useOperationBlueprint
} from "../../../server/hooks/useOperationBlueprint";

interface UseWorkspaceInstanceTypes {
	loading: boolean;
	
	instance: OperationInstance | null;
	setInstance: Dispatch<SetStateAction<OperationInstance | null>>;
	
	blueprint: OperationBlueprintDetail | null;
	selectedStepInstance: StepInstance | null;
	selectedBlueprintStep: BlueprintStep | null;
	selectedStepInstanceId: number | null;
	
	linkedGlobalInstances: OperationInstance[];
	linkedOtherInstances: OperationInstance[];
	linkableOtherInstances: OperationInstance[];

	launchedFromInstance: Partial<OperationInstance> | null;
	dependsOnLinks: Partial<OperationInstance>[];
	visibleStepInstances: StepInstance[];
	
	setSelectedStepInstanceId: Dispatch<SetStateAction<number | null>>;
	
	refreshInstance: () => Promise<void>
}

export const useWorkspaceInstance = (instanceId: number | null): UseWorkspaceInstanceTypes => {
	const { instances, retrieveInstanceById, retrieveInstances } = useOperationInstance();
	const { retrieveBlueprintById } = useOperationBlueprint();

	const [instance, setInstance] = useState<OperationInstance | null>(null);

	const [blueprint, setBlueprint] = useState<OperationBlueprintDetail | null>(null);

	const [loading, setLoading] = useState<boolean>(true);
	const [selectedStepInstanceId, setSelectedStepInstanceId] = useState<number | null>(null);

	useEffect(() => {
		correctionRanRef.current = false;
		if ( !instanceId ) {
			setLoading(false);
			return;
		}

		const initialize = async () => {
			const [response] = await Promise.all([ retrieveInstanceById({ id: instanceId }), retrieveInstances() ]);

			if ( response.data?.data ) {
				setInstance(response.data.data);

				if ( response.data.data.stepInstances.length > 0 ) {
					const firstActionable = response.data.data.stepInstances.find(si => si.status !== StepInstanceStatus.COMPLETED);

					setSelectedStepInstanceId(firstActionable?.id ?? response.data.data.stepInstances[0].id);
				}

				const blueprint: FetchResult<{ data: OperationBlueprintDetail }> = await retrieveBlueprintById({ id: response.data.data.blueprintId.toString() });
				if ( blueprint.data?.data ) {
					setBlueprint(blueprint.data.data)
				};
			}
			setLoading(false);
		};

		initialize();
	}, [instanceId]);

	/** Manage to memorize the step selected */
	const selectedStepInstance: StepInstance | null = useMemo(() => {
		if ( !selectedStepInstanceId || !instance ) return null;

		return instance.stepInstances.find(si => si.id == selectedStepInstanceId) ?? null;
	}, [selectedStepInstanceId, instance]);

	/** Manage to memorize the blueprint step */
	const selectedBlueprintStep: BlueprintStep | null = useMemo(() => {
		if ( !selectedStepInstance || !blueprint ) return null;

		return blueprint.steps.find(s => s.id == selectedStepInstance.stepId) ?? null;
	}, [selectedStepInstance, blueprint]);

	/** Manage to memorize all the global operation instances linked */
	const linkedGlobalInstances: OperationInstance[] = useMemo(() => {
		if ( !instance ) return [];

		return instance.targetLinks
			.filter(link => link.linkType === LinkType.GLOBAL_OTHER || link.linkType === LinkType.DEPENDS_ON)
			.map(link => link.sourceInstance)
			.filter(Boolean) as OperationInstance[];
	}, [instance?.targetLinks]);

	/** Manage to memorize all the other operation instances linked */
	const linkedOtherInstances: OperationInstance[] = useMemo(() => {
		if ( !instance ) return [];

		return instance.sourceLinks
			.filter(link => link.linkType === LinkType.GLOBAL_OTHER)
			.map(link => link.targetInstance)
			.filter(Boolean) as OperationInstance[];
	}, [instance?.sourceLinks]);

	/** The instance that launched this one (via OPEN_OPERATION step)  */
	const launchedFromInstance: Partial<OperationInstance> | null = useMemo(() => {
		if ( !instance ) return null;

		return instance.launchedFromInstance ?? null;
	}, [instance]);

	/** DEPENDS_ON links — sub-operations launched from OPEN_OPERATION steps */
	const dependsOnLinks: Partial<OperationInstance>[] = useMemo(() => {
		if ( !instance ) return [];

		return instance.targetLinks.filter(link => link.linkType === LinkType.DEPENDS_ON) as Partial<OperationInstance>[];
	}, [instance?.targetLinks]);

	// Instances eligible to be linked via OTHER_OTHER (for allowInstanceLink steps)
	const linkableOtherInstances: OperationInstance[] = useMemo(() => {
		if ( !instance ) return [];

		const linkedTargetIds = new Set(
			instance.sourceLinks
				.filter(link => link.linkType === LinkType.OTHER_OTHER || link.linkType === LinkType.GLOBAL_OTHER)
				.map(link => link.targetInstanceId)
		);
		
		return instances.filter(i => i.id !== instance.id && i.blueprint?.type === OperationType.OTHER && !linkedTargetIds.has(i.id));
	}, [instances, instance?.id, instance?.sourceLinks]); 

	// An instance is "launched" (i.e. linked from another operation) when:
	// 1. It was opened by an OPEN_OPERATION step (launchedFromInstanceId is set), OR
	// 2. It was created via Request Global Operation modal (has GLOBAL_OTHER source links)
	const isLaunched: boolean = useMemo(() => {
		if ( !instance ) return false;

		return !!instance.launchedFromInstanceId || instance.sourceLinks.some(link => link.linkType === LinkType.GLOBAL_OTHER);
	}, [instance?.launchedFromInstanceId, instance?.sourceLinks]);

	// Filtered step instances based on conditionalVisibility + chosen paths
	const visibleStepInstances: StepInstance[] = useMemo(() => {
		if ( !instance || !blueprint ) return instance?.stepInstances ?? [];

		const edges = blueprint.edges ?? [];

		// Helper: filter by conditionalVisibility only (used as fallback for no-branching ops)
		const filterByVisibility = (si: StepInstance) => {
			const bpStep = blueprint.steps.find(s => s.id == si.stepId);

			if ( !bpStep ) return true;
			const cv = bpStep.conditionalVisibility;

			if (cv === ConditionalVisibility.LINKED_ONLY && !isLaunched) return false;
			if (cv === ConditionalVisibility.STANDALONE_ONLY && isLaunched) return false;
			return true;
		};

		// Only apply path filtering when USER_CHOICE edges are defined
		const hasUserChoiceEdges = edges.some(e => e.conditionType === EdgeConditionType.USER_CHOICE);
		if (!hasUserChoiceEdges) {
			return instance.stepInstances.filter(filterByVisibility);
		}

		const selectedEdgeByStepId = new Map<number, number>();
		for (const si of instance.stepInstances) {
			if (si.selectedEdgeId != null) selectedEdgeByStepId.set(Number(si.stepId), Number(si.selectedEdgeId));
		}

		const allTargetIds = new Set(edges.map(e => Number(e.targetId)));
		const roots = blueprint.steps.filter(s => !allTargetIds.has(Number(s.id)));

		const reachable = new Set<number>();
		const queue: number[] = roots.map(s => Number(s.id));

		while (queue.length > 0) {
			const stepId = queue.shift()!;
			if (reachable.has(stepId)) continue;
			reachable.add(stepId);

			const outgoing = edges.filter(e => Number(e.sourceId) === stepId);

			for (const e of outgoing.filter(e => e.conditionType === EdgeConditionType.ALWAYS)) {
				queue.push(Number(e.targetId));
			}

			const userChoiceEdges = outgoing.filter(e => e.conditionType === EdgeConditionType.USER_CHOICE);
			if (userChoiceEdges.length > 0) {
				const selectedEdgeId = selectedEdgeByStepId.get(stepId);
				if (selectedEdgeId != null) {
					const chosen = userChoiceEdges.find(e => Number(e.id) === selectedEdgeId);
					if (chosen) queue.push(Number(chosen.targetId));
				}
			}
		}

		// Fallback: if BFS produced nothing (unexpected graph structure), show all
		if (reachable.size === 0) return instance.stepInstances.filter(filterByVisibility);

		return instance.stepInstances.filter(si => reachable.has(Number(si.stepId)) && filterByVisibility(si));
	}, [instance?.stepInstances, blueprint, isLaunched]);

	// After visibleStepInstances is computed (blueprint loaded), correct the selection
	// if the currently selected step is filtered out by conditionalVisibility.
	const correctionRanRef = useRef(false);
	
	useEffect(() => {
		if ( !blueprint || visibleStepInstances.length === 0 ) return;
		if ( correctionRanRef.current ) return;

		correctionRanRef.current = true;

		const isCurrentVisible = visibleStepInstances.some(si => si.id == selectedStepInstanceId);
		if ( !isCurrentVisible ) {
			const firstVisible = visibleStepInstances.find(si => si.status !== StepInstanceStatus.COMPLETED);
			setSelectedStepInstanceId(firstVisible?.id ?? visibleStepInstances[0]?.id ?? null);
		}
	}, [visibleStepInstances, blueprint]);

	const refreshInstance = useCallback(async () => {
		if ( !instanceId ) return;

		const response: FetchResult<{ data: OperationInstance }> = await retrieveInstanceById({ id: instanceId });
		if ( response.data?.data ) {
			setInstance(response.data.data);
		}
	}, [instanceId]);

	return {
		instance,
		blueprint,
		loading,
		selectedStepInstanceId,
		selectedStepInstance,
		selectedBlueprintStep,
		linkedGlobalInstances,
		linkedOtherInstances,
		launchedFromInstance,
		dependsOnLinks,
		visibleStepInstances,
		linkableOtherInstances,
		setSelectedStepInstanceId,
		setInstance,
		refreshInstance
	};
};
