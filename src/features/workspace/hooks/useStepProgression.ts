import { useCallback } from "react";
import {
	OperationInstanceStatus,
	StepInstanceStatus,
	type OperationBlueprintDetail,
	type OperationInstance,
	type OperationInstanceStep
} from "@l-ark/types";
import { useOperation } from "../../../server/hooks/useOperation";
import { useToast } from "../../../shared/hooks/useToast";
import { getStepCompletionBlockers } from "../workspace.utils";

interface UseStepProgressionOptions {
	instance: OperationInstance | null;
	blueprint: OperationBlueprintDetail | null;
	isReadOnly?: boolean;
	onInstanceChange: (updater: (prev: OperationInstance | null) => OperationInstance | null) => void;
	onSelectStep: (stepId: number) => void;
}

export const useStepProgression = ({
	instance,
	blueprint,
	isReadOnly,
	onInstanceChange,
	onSelectStep
}: UseStepProgressionOptions) => {
	const { updateInstanceStatus, updateStepInstance } = useOperation();
	const { onToast, onConfirmationToast } = useToast();

	const handleStepStatusChange = useCallback(async (stepInstance: OperationInstanceStep, newStatus: StepInstanceStatus, selectedEdgeId?: string) => {
		if (isReadOnly || !instance || !blueprint) return;

		// When completing: warn if there are unsubmitted required forms
		if (newStatus === StepInstanceStatus.COMPLETED) {
			const bpStep = blueprint.steps.find((s: any) => s.id == stepInstance.stepId);
			if (bpStep) {
				const blockers = getStepCompletionBlockers(stepInstance, bpStep);

				if (blockers.length > 0) {
					const { confirmed } = await onConfirmationToast({
						title: 'Forms not submitted',
						description: `The following forms have not been submitted yet: ${blockers.join(', ')}. Are you sure you want to mark this step as complete?`,
						actionText: 'Complete anyway',
						cancelText: 'Cancel'
					});

					if (!confirmed) return;
				}
			}
		}

		await updateStepInstance({ id: stepInstance.id, input: { status: newStatus, ...(selectedEdgeId ? { selectedEdgeId } : {}) } });

		const updatedStepInstances: any = instance.stepInstances.map((si: any) =>
			si.id == stepInstance.id ? {
				...si, status: newStatus,
				completedAt: newStatus == StepInstanceStatus.COMPLETED ? new Date().toISOString() : null,
				startedAt: newStatus == StepInstanceStatus.IN_PROGRESS ? new Date().toISOString() : si.startedAt
			} : si
		);

		const requiredStepsCompleted = updatedStepInstances.every((si: OperationInstanceStep) => {
			const bpStep = blueprint.steps.find((s: any) => s.id == si.stepId);
			return !bpStep?.isRequired || si.status == StepInstanceStatus.COMPLETED || si.status == StepInstanceStatus.SKIPPED;
		});
		const anyActive = updatedStepInstances.some((si: OperationInstanceStep) => si.status == StepInstanceStatus.IN_PROGRESS);

		if (requiredStepsCompleted && instance.status !== OperationInstanceStatus.COMPLETED_READY) {
			await updateInstanceStatus({ id: instance.id, status: OperationInstanceStatus.COMPLETED_READY });
			onInstanceChange(prev => prev ? { ...prev, status: OperationInstanceStatus.COMPLETED_READY, stepInstances: updatedStepInstances } : prev);
			onToast({ message: 'All required steps completed! Instance is ready.', type: 'success' });
		} else if (anyActive && instance.status == OperationInstanceStatus.DRAFT) {
			await updateInstanceStatus({ id: instance.id, status: OperationInstanceStatus.ACTIVE });
			onInstanceChange(prev => prev ? { ...prev, status: OperationInstanceStatus.ACTIVE, stepInstances: updatedStepInstances } : prev);
		} else {
			onInstanceChange(prev => prev ? { ...prev, stepInstances: updatedStepInstances } : prev);
		}

		if (newStatus === StepInstanceStatus.COMPLETED) {
			const nextStep = updatedStepInstances.find((si: OperationInstanceStep) =>
				si.status !== StepInstanceStatus.COMPLETED && si.status !== StepInstanceStatus.SKIPPED
			);
			if (nextStep) onSelectStep(nextStep.id);
		}
	}, [instance, blueprint, isReadOnly, onInstanceChange, onSelectStep]);

	return { handleStepStatusChange };
};
