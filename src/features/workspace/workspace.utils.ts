import {
	StepInstanceStatus,
	FormInstanceStatus,
	type OperationInstanceStep,
	type OperationInstance,
	type OperationBlueprintDetail
} from "@l-ark/types";

/** Calculate step progress (submitted forms + uploaded docs) */
export const getStepProgress = (si: OperationInstanceStep, bpStep: any): { done: number; total: number; label: string } => {
	const formCount = bpStep.fileTemplates?.length ?? 0;

	const submittedForms = (si.formInstances ?? []).filter((fi: any) => {
		const status = fi.formInstance?.status;

		return status === FormInstanceStatus.SUBMITTED || status === FormInstanceStatus.APPROVED;
	}).length;

	const docCount = si.documents?.length ?? 0;
	const hasUpload = bpStep.allowDocumentUpload;

	const total = formCount + (hasUpload ? 1 : 0);
	const done = submittedForms + (hasUpload && docCount > 0 ? 1 : 0);

	if ( total === 0 )
		return { done: 0, total: 0, label: 'No tasks' };

	const parts: string[] = [];

	if ( formCount > 0 ) parts.push(`${submittedForms}/${formCount} forms`);
	if ( hasUpload ) parts.push(`${docCount} doc${docCount !== 1 ? 's' : ''}`);

	return { done, total, label: parts.join(' · ') };
};

/** Format a date relative to now */
export const formatRelativeDate = (dateStr: string | null | undefined): string => {
	if (!dateStr) return '';

	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return '';

	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return 'just now';
	if (diffMins < 60) return `${diffMins}m ago`;

	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `${diffHours}h ago`;

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d ago`;

	return d.toLocaleDateString();
};

/** Check if a step can be started (all blocking predecessors must be completed) */
export const canStartStep = (stepInstance: OperationInstanceStep, blueprint: OperationBlueprintDetail, instance: OperationInstance, isReadOnly?: boolean): boolean => {
	if ( isReadOnly ) return false;
	if ( stepInstance.status !== StepInstanceStatus.PENDING ) return false;

	const bpStep = blueprint.steps.find((s: any) => s.id == stepInstance.stepId);
	if ( !bpStep ) return false;

	const predecessorEdges = blueprint.edges.filter((e: any) => e.targetId == bpStep.id);
	for (const edge of predecessorEdges) {
		const predStep = blueprint.steps.find((s: any) => s.id == edge.sourceId);

		if ( predStep?.isBlocking ) {
			const predInstance = instance.stepInstances.find((si: any) => si.stepId == edge.sourceId);
			if ( predInstance && predInstance.status !== StepInstanceStatus.COMPLETED && predInstance.status !== StepInstanceStatus.SKIPPED ) return false;
		}
	}
	return true;
};

/** Get list of unsubmitted required form names that block step completion */
export const getStepCompletionBlockers = (stepInstance: OperationInstanceStep, bpStep: any): string[] => {
	const blockers: string[] = [];
	const templates = bpStep.fileTemplates ?? [];

	for (const ft of templates) {
		if ( !ft.isOptional ) {
			const hasFilled = (stepInstance.formInstances ?? []).some((fi: any) => {
				const status = fi.formInstance?.status;
				const formTemplateId = fi.formInstance?.templateVersion?.templateId;
				return (status === FormInstanceStatus.SUBMITTED || status === FormInstanceStatus.APPROVED)
					&& formTemplateId === ft.templateId;
			});

			if ( !hasFilled ) blockers.push(ft.template?.title ?? `Template #${ft.id}`);
		}
	}
	return blockers;
};
