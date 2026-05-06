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
	LinkType,
	OperationInstanceStatus,
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
import { computeVisibleSteps } from "../utils/step-visibility";
import { useSocketEvents } from "../../../shared/hooks/useSocketEvents";

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

				const versionId = (response.data.data as any).blueprintVersionId?.toString();
				const blueprint: FetchResult<{ data: OperationBlueprintDetail }> = await retrieveBlueprintById({ id: response.data.data.blueprintId.toString(), versionId });
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

		return instance.stepInstances.find(si => Number(si.id) === Number(selectedStepInstanceId)) ?? null;
	}, [selectedStepInstanceId, instance]);

	/** Manage to memorize the blueprint step */
	const selectedBlueprintStep: BlueprintStep | null = useMemo(() => {
		if ( !selectedStepInstance || !blueprint ) return null;

		return blueprint.steps.find(s => Number(s.id) === Number(selectedStepInstance.stepId)) ?? null;
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

		return instance.targetLinks.filter(link =>
			link.linkType === LinkType.DEPENDS_ON || link.linkType === LinkType.GLOBAL_OTHER
		) as Partial<OperationInstance>[];
	}, [instance?.targetLinks]);

	// Instances eligible to be linked via OTHER_OTHER (for allowInstanceLink steps).
	// Filters: same office as the source op, blueprint not at its maxGlobalOperations cap, not already linked.
	const linkableOtherInstances: OperationInstance[] = useMemo(() => {
		if ( !instance ) return [];

		const linkedTargetIds = new Set(
			instance.sourceLinks
				.filter(link => link.linkType === LinkType.OTHER_OTHER || link.linkType === LinkType.GLOBAL_OTHER)
				.map(link => link.targetInstanceId)
		);

		const TERMINAL_STATUSES: OperationInstanceStatus[] = [
			OperationInstanceStatus.CLOSED,
			OperationInstanceStatus.COMPLETED_READY,
			OperationInstanceStatus.PENDING_PAYMENT,
			OperationInstanceStatus.PARTIALLY_CLOSED,
		];

		const activeCountByBlueprint = new Map<number, number>();
		for (const i of instances) {
			if (TERMINAL_STATUSES.includes(i.status as OperationInstanceStatus)) continue;
			if (i.officeId !== instance.officeId) continue;
			activeCountByBlueprint.set(i.blueprintId, (activeCountByBlueprint.get(i.blueprintId) ?? 0) + 1);
		}

		return instances.filter(i => {
			if (i.id === instance.id) return false;
			if (i.blueprint?.type !== OperationType.OTHER) return false;
			if (linkedTargetIds.has(i.id)) return false;
			if (i.officeId !== instance.officeId) return false;

			const cap = i.blueprint?.maxGlobalOperations ?? null;
			if (cap != null && (activeCountByBlueprint.get(i.blueprintId) ?? 0) >= cap) return false;

			return true;
		});
	}, [instances, instance?.id, instance?.officeId, instance?.sourceLinks]);

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

		return computeVisibleSteps({
			stepInstances: instance.stepInstances,
			blueprintSteps: blueprint.steps,
			edges: blueprint.edges ?? [],
			isLaunched,
		});
	}, [instance?.stepInstances, blueprint, isLaunched]);

	// After visibleStepInstances is computed (blueprint loaded), correct the selection
	// if the currently selected step is filtered out by conditionalVisibility.
	const correctionRanRef = useRef(false);
	
	useEffect(() => {
		if ( !blueprint || visibleStepInstances.length === 0 ) return;
		if ( correctionRanRef.current ) return;

		correctionRanRef.current = true;

		const firstNonCompleted = visibleStepInstances.find(si => si.status !== StepInstanceStatus.COMPLETED);
		setSelectedStepInstanceId(firstNonCompleted?.id ?? visibleStepInstances[0]?.id ?? null);
	}, [visibleStepInstances, blueprint]);

	const refreshInstance = useCallback(async () => {
		if ( !instanceId ) return;

		const response: FetchResult<{ data: OperationInstance }> = await retrieveInstanceById({ id: instanceId });
		if ( response.data?.data ) {
			setInstance(response.data.data);
		}
	}, [instanceId]);

	useSocketEvents('updation-step-instance-event', refreshInstance);
	useSocketEvents('updation-instance-event', refreshInstance);

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
