import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
	StepInstanceStatus,
	type OperationBlueprintDetail,
	type OperationInstance
} from "@l-ark/types";
import { useOperation } from "../../../server/hooks/useOperation";
import type { FetchResult } from "@apollo/client";

export const useWorkspaceInstance = (stateId: number | undefined) => {
	const { instances, retrieveInstanceById, retrieveBlueprintById, retrieveInstances } = useOperation();

	const [instance, setInstance] = useState<OperationInstance | null>(null);
	const [blueprint, setBlueprint] = useState<OperationBlueprintDetail | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [selectedStepInstanceId, setSelectedStepInstanceId] = useState<number | null>(null);

	useEffect(() => {
		if (!stateId) {
			setLoading(false);
			return;
		}
		const initialize = async () => {
			const [response] = await Promise.all([
				retrieveInstanceById({ id: stateId }),
				retrieveInstances(),
			]);
			if (response.data?.data) {
				setInstance(response.data.data);

				if (response.data.data.stepInstances.length > 0) {
					const firstActionable = response.data.data.stepInstances.find(si => si.status !== StepInstanceStatus.COMPLETED);
					setSelectedStepInstanceId(firstActionable?.id ?? response.data.data.stepInstances[0].id);
				}

				const bp: FetchResult<{ data: OperationBlueprintDetail }> = await retrieveBlueprintById({ id: response.data.data.blueprintId });
				if (bp.data?.data) setBlueprint(bp.data.data);
			}
			setLoading(false);
		};
		initialize();
	}, [stateId]);

	const selectedStepInstance = useMemo(() => {
		if (!selectedStepInstanceId || !instance) return null;
		return instance.stepInstances.find(si => si.id == selectedStepInstanceId) ?? null;
	}, [selectedStepInstanceId, instance]);

	const selectedBlueprintStep = useMemo(() => {
		if (!selectedStepInstance || !blueprint) return null;
		return blueprint.steps.find((s: any) => s.id == selectedStepInstance.stepId) ?? null;
	}, [selectedStepInstance, blueprint]);

	const linkedGlobalInstances = useMemo(() => {
		if (!instance) return [];
		return instance.targetLinks
			.filter((link: any) => link.linkType === 'GLOBAL_OTHER' || link.linkType === 'DEPENDS_ON')
			.map((link: any) => instances.find((i: any) => i.id == link.sourceInstance?.id))
			.filter(Boolean) as OperationInstance[];
	}, [instance?.targetLinks, instances]);

	// For GLOBAL instances: the OTHER instances that were linked to this operation
	const linkedOtherInstances = useMemo(() => {
		if (!instance) return [];
		return instance.sourceLinks
			.filter((link: any) => link.linkType === 'GLOBAL_OTHER')
			.map((link: any) => link.targetInstance)
			.filter(Boolean);
	}, [instance?.sourceLinks]);

	// The instance that launched this one (via OPEN_OPERATION step)
	const launchedFromInstance = useMemo(() => {
		if (!instance) return null;
		return (instance as any).launchedFromInstance ?? null;
	}, [instance]);

	// DEPENDS_ON links — sub-operations launched from OPEN_OPERATION steps
	const dependsOnLinks = useMemo(() => {
		if (!instance) return [];
		return instance.targetLinks.filter((link: any) => link.linkType === 'DEPENDS_ON');
	}, [instance?.targetLinks]);

	// Instances eligible to be linked via OTHER_OTHER (for allowInstanceLink steps)
	const linkableOtherInstances = useMemo(() => {
		if (!instance) return [];
		const linkedTargetIds = new Set(
			instance.sourceLinks
				.filter((l: any) => l.linkType === 'OTHER_OTHER')
				.map((l: any) => l.targetInstanceId)
		);
		return (instances as any[]).filter((i: any) =>
			i.id !== instance.id &&
			i.blueprint?.type === 'OTHER' &&
			!linkedTargetIds.has(i.id)
		);
	}, [instances, instance?.id, instance?.sourceLinks]);

	// An instance is "launched" (i.e. linked from another operation) when:
	// 1. It was opened by an OPEN_OPERATION step (launchedFromInstanceId is set), OR
	// 2. It was created via Request Global Operation modal (has GLOBAL_OTHER source links)
	const isLaunched = useMemo(() => {
		if (!instance) return false;
		return !!(instance as any).launchedFromInstanceId
			|| instance.sourceLinks.some((l: any) => l.linkType === 'GLOBAL_OTHER');
	}, [(instance as any)?.launchedFromInstanceId, instance?.sourceLinks]);

	// Filtered step instances based on conditionalVisibility
	const visibleStepInstances = useMemo(() => {
		if (!instance || !blueprint) return instance?.stepInstances ?? [];
		return instance.stepInstances.filter((si: any) => {
			const bpStep = blueprint.steps.find((s: any) => s.id == si.stepId) as any;
			if (!bpStep) return true;
			const cv = bpStep.conditionalVisibility;
			if (cv === 'LINKED_ONLY' && !isLaunched) return false;
			if (cv === 'STANDALONE_ONLY' && isLaunched) return false;
			return true;
		});
	}, [instance?.stepInstances, blueprint?.steps, isLaunched]);

	// After visibleStepInstances is computed (blueprint loaded), correct the selection
	// if the currently selected step is filtered out by conditionalVisibility.
	const correctionRanRef = useRef(false);
	useEffect(() => {
		if (!blueprint || visibleStepInstances.length === 0) return;
		if (correctionRanRef.current) return;
		correctionRanRef.current = true;

		const isCurrentVisible = visibleStepInstances.some((si: any) => si.id == selectedStepInstanceId);
		if (!isCurrentVisible) {
			const firstVisible = visibleStepInstances.find((si: any) => si.status !== StepInstanceStatus.COMPLETED);
			setSelectedStepInstanceId(firstVisible?.id ?? visibleStepInstances[0]?.id ?? null);
		}
	}, [visibleStepInstances, blueprint]);

	const refreshInstance = useCallback(async () => {
		if (!stateId) return;
		const response = await retrieveInstanceById({ id: stateId });
		if (response.data?.data) setInstance(response.data.data);
	}, [stateId]);

	return {
		instance,
		setInstance,
		blueprint,
		loading,
		selectedStepInstanceId,
		setSelectedStepInstanceId,
		selectedStepInstance,
		selectedBlueprintStep,
		linkedGlobalInstances,
		linkedOtherInstances,
		launchedFromInstance,
		dependsOnLinks,
		visibleStepInstances,
		linkableOtherInstances,
		refreshInstance
	};
};
