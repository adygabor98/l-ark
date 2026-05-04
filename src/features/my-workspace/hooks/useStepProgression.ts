import {
	useCallback
} from "react";
import {
	LinkType,
	OperationInstanceStatus,
	StepInstanceStatus,
	type ApiResponse,
	type BlueprintStep,
	type OperationBlueprintDetail,
	type OperationInstance,
	type OperationInstanceStep
} from "@l-ark/types";
import {
	useToast
} from "../../../shared/hooks/useToast";
import {
	useOperationInstance
} from "../../../server/hooks/useOperationInstance";
import type {
	FetchResult
} from "@apollo/client";
import { getStepCompletionBlockers } from "../utils/my-workspace.utils";
import { computeVisibleSteps } from "../utils/step-visibility";

interface UseStepProgressionOptions {
	instance: OperationInstance | null;
	blueprint: OperationBlueprintDetail | null;
	isReadOnly?: boolean;

	onInstanceChange: (updater: (prev: OperationInstance | null) => OperationInstance | null) => void;
	onSelectStep: (stepId: number) => void;
}

export const useStepProgression = (props: UseStepProgressionOptions) => {
	/** Retrieve component properties */
	const { instance, blueprint, isReadOnly, onInstanceChange, onSelectStep } = props;
	/** Operation instance api utilities */
	const { updateInstanceStatus, updateStepInstance } = useOperationInstance();
	/** Toast utilities */
	const { onToast, onConfirmationToast } = useToast();

	const handleStepStatusChange = useCallback(async (stepInstance: OperationInstanceStep, newStatus: StepInstanceStatus, selectedEdgeId?: number) => {
		if ( isReadOnly || !instance || !blueprint ) return;

		if ( newStatus === StepInstanceStatus.COMPLETED ) {
			const bpStep = blueprint.steps.find(s => Number(s.id) === Number(stepInstance.stepId));

			if ( bpStep ) {
				const blockers = getStepCompletionBlockers(stepInstance, bpStep as BlueprintStep);

				if ( blockers.length > 0 ) {
					const { confirmed } = await onConfirmationToast({
						title: 'Forms not submitted',
						description: `The following forms have not been submitted yet: ${blockers.join(', ')}. Are you sure you want to mark this step as complete?`,
						actionText: 'Complete anyway',
						cancelText: 'Cancel'
					});

					if ( !confirmed )
						return;
				}
			}
		}
		try {
			const response: FetchResult<{ data: ApiResponse }> = await updateStepInstance({ id: stepInstance.id, input: { status: newStatus, ...(selectedEdgeId ? { selectedEdgeId } : {}) } });

			const updatedStepInstances: any = instance.stepInstances.map((si: any) =>
				Number(si.id) === Number(stepInstance.id) ? {
					...si, status: newStatus,
					...(selectedEdgeId ? { selectedEdgeId: selectedEdgeId } : {}),
					completedAt: newStatus === StepInstanceStatus.COMPLETED ? new Date().toISOString() : null,
					startedAt: newStatus === StepInstanceStatus.IN_PROGRESS ? new Date().toISOString() : si.startedAt
				} : si
			);

			const requiredStepsCompleted = updatedStepInstances.every((si: OperationInstanceStep) => {
				const bpStep = blueprint.steps.find((s: any) => Number(s.id) === Number(si.stepId));

				return !bpStep?.isRequired || si.status === StepInstanceStatus.COMPLETED || si.status === StepInstanceStatus.SKIPPED;
			});
			const anyActive = updatedStepInstances.some((si: OperationInstanceStep) =>
				si.status === StepInstanceStatus.IN_PROGRESS || si.status === StepInstanceStatus.COMPLETED
			);

			if ( requiredStepsCompleted && instance.status !== OperationInstanceStatus.COMPLETED_READY ) {
				await updateInstanceStatus({ id: instance.id, status: OperationInstanceStatus.COMPLETED_READY });

				onInstanceChange(prev => prev ? { ...prev, status: OperationInstanceStatus.COMPLETED_READY, stepInstances: updatedStepInstances } : prev);
			} else if ( anyActive && instance.status === OperationInstanceStatus.DRAFT ) {
				await updateInstanceStatus({ id: instance.id, status: OperationInstanceStatus.ACTIVE });

				onInstanceChange(prev => prev ? { ...prev, status: OperationInstanceStatus.ACTIVE, stepInstances: updatedStepInstances } : prev);
			} else {
				onInstanceChange(prev => prev ? { ...prev, stepInstances: updatedStepInstances } : prev);
			}

			if ( newStatus === StepInstanceStatus.COMPLETED ) {
				const isLaunched = !!instance.launchedFromInstanceId || (instance.sourceLinks ?? []).some(l => l.linkType === LinkType.GLOBAL_OTHER);

				const visibleSteps = computeVisibleSteps({
					stepInstances: updatedStepInstances,
					blueprintSteps: blueprint.steps,
					edges: blueprint.edges ?? [],
					isLaunched,
				});

				const nextStep = visibleSteps.find((si: OperationInstanceStep) => si.status !== StepInstanceStatus.COMPLETED && si.status !== StepInstanceStatus.SKIPPED);
				if ( nextStep )
					onSelectStep(nextStep.id);
			}

			onToast({ message: response.data?.data.message ?? '', type: response.data?.data.success ? 'success' : 'error' });
		} catch ( e: any ) {
			console.error(e);
		}
	}, [instance, blueprint, isReadOnly, onInstanceChange, onSelectStep]);

	return { handleStepStatusChange };
};
