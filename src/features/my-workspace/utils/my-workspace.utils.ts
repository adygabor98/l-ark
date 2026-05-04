import {
	FormInstanceStatus,
	OperationInstanceStatus,
	OperationType,
	StepInstanceStatus,
	UserRole,
	type BlueprintStep,
	type OperationBlueprintDetail,
	type OperationInstance,
	type OperationInstanceStep
} from "@l-ark/types";

export type FilterStatus = 'ALL' | OperationInstanceStatus;

/**
 * Frontend mirror of backend `assertInstanceAccess` — used purely for UX gating
 * (disabling rows / blocking navigation). Backend remains the source of truth
 * and will return FORBIDDEN for any leak.
 *
 *  - DG  → always true.
 *  - DIR → true if (officeId, divisionId) is one he manages, OR if he is
 *          the assignee/creator/requester.
 *  - C   → false for GLOBAL; otherwise true only if creator or assignee.
 *  - else (ADM / unknown) → false.
 */
export const canOpenInstance = (user: { id?: number; role?: { code?: string }; managedDivisions?: Array<{ office?: { id: number | string }; division?: { id: number | string } }> } | null | undefined, instance: Pick<OperationInstance, 'officeId' | 'divisionId' | 'assignedTo' | 'createdById' | 'requestedById' | 'blueprint'> | null | undefined): boolean => {
	if ( !user || !instance ) return false;

	const role = user.role?.code;
	const userId = user.id;

	if ( role === UserRole.DG ) return true;

	const isOwner = instance.assignedTo.id === userId || instance.createdById === userId || instance.requestedById === userId;

	if ( role === UserRole.DIR ) {
		const managed = user.managedDivisions ?? [];
		const inScope = managed.some(d =>
			String(d.office?.id) === String(instance.officeId) &&
			String(d.division?.id) === String(instance.divisionId),
		);
		return inScope || isOwner;
	}

	if ( role === UserRole.C ) {
		if ( instance.blueprint?.type === OperationType.GLOBAL ) return false;
		return isOwner;
	}

	return false;
};

/** Status color mappings shared across workspace components */
export const STEP_STATUS_COLORS = {
	PENDING: { bg: 'bg-black/5', text: 'text-black/40', dot: 'bg-black/20' },
	IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
	COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
	SKIPPED: { bg: 'bg-slate-50', text: 'text-slate-400', dot: 'bg-slate-300' },
} as const;

export const FORM_STATUS_COLORS = {
	DRAFT: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200/50', dot: 'bg-amber-500' },
	SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200/50', dot: 'bg-blue-500' },
	APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200/50', dot: 'bg-emerald-500' },
} as const;

export const INSTANCE_STATUS_COLORS = {
	DRAFT: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-600/20' },
	ACTIVE: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-600/20' },
	COMPLETED_READY: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-600/20' },
	LINKED: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-600/20' },
	PENDING_PAYMENT: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-600/20' },
	PARTIALLY_CLOSED: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-600/20' },
	CLOSED: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-700/20' }
} as const;

export const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draft",
	ACTIVE: "Active",
	COMPLETED_READY: "Completed",
	LINKED: "Linked",
	CLOSED: "Closed",
	PENDING_PAYMENT: "Pending Payment",
	PARTIALLY_CLOSED: "Partially Closed",
} as const;

export const StepTypeBadge: Record<string, { label: string; color: string }> = {
	STANDARD: { label: "Standard", color: "bg-black/4 text-black/40" },
	NOTIFICATION: { label: "Notification", color: "bg-amber-50 text-amber-600" },
	OPEN_OPERATION: { label: "Opens Sub-Op", color: "bg-violet-50 text-violet-600" },
	WAIT_FOR_LINKED: { label: "Waiting", color: "bg-blue-50 text-blue-600" },
	CLOSURE: { label: "Closure", color: "bg-emerald-50 text-emerald-600" },
};

/** Retrieve the status color classes derived from shared constants */
export const getStatusInstanceBg = (status: OperationInstanceStatus): string => {
	const colors = INSTANCE_STATUS_COLORS[status as keyof typeof INSTANCE_STATUS_COLORS];
	return colors ? `${colors.bg} ${colors.text} ${colors.ring}` : 'bg-slate-50 text-slate-500 ring-slate-500/20';
};

/** Retrieve the label depending on the status of the operation instance */
export const getStatusInstanceLabel = (status: OperationInstanceStatus): string => {
	switch (status) {
		case OperationInstanceStatus.DRAFT: return 'Draft';
		case OperationInstanceStatus.ACTIVE: return 'Active';
		case OperationInstanceStatus.COMPLETED_READY: return 'Completed';
		case OperationInstanceStatus.LINKED: return 'Linked';
		case OperationInstanceStatus.CLOSED: return 'Closed';
		case OperationInstanceStatus.PENDING_PAYMENT: return 'Pending Payment';
		case OperationInstanceStatus.PARTIALLY_CLOSED: return 'Partially Closed';
		default: return status;
	}
};

/** Check if a step can be started (all blocking predecessors must be completed) */
export const canStartStep = (stepInstance: OperationInstanceStep, blueprint: OperationBlueprintDetail, instance: OperationInstance, isReadOnly?: boolean): boolean => {
	if ( isReadOnly ) return false;
	if ( stepInstance.status !== StepInstanceStatus.PENDING ) return false;

	const bpStep = blueprint.steps.find((s: any) => Number(s.id) === Number(stepInstance.stepId));
	if ( !bpStep ) return false;

	const predecessorEdges = blueprint.edges.filter((e: any) => Number(e.targetId) === Number(bpStep.id));
	for (const edge of predecessorEdges) {
		const predStep = blueprint.steps.find((s: any) => Number(s.id) === Number(edge.sourceId));

		if ( predStep?.isBlocking ) {
			const predInstance = instance.stepInstances.find(si => Number(si.stepId) === Number(edge.sourceId));
			if ( predInstance && predInstance.status !== StepInstanceStatus.COMPLETED && predInstance.status !== StepInstanceStatus.SKIPPED ) {
				return false;
			}
		}
	}
	return true;
};

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

/** Get list of unsubmitted required form names that block step completion */
export const getStepCompletionBlockers = (stepInstance: OperationInstanceStep, bpStep: Partial<BlueprintStep>): string[] => {
	const blockers: string[] = [];
	const templates = bpStep.fileTemplates ?? [];

	for (const ft of templates) {
		if ( !ft.isOptional ) {
			const hasFilled = (stepInstance.formInstances ?? []).some((fi: any) => {
				const status = fi.formInstance?.status;
				const formTemplateId = fi.formInstance?.templateVersion?.templateId;

				return ( status === FormInstanceStatus.SUBMITTED || status === FormInstanceStatus.APPROVED ) && formTemplateId === ft.templateId;
			});

			if ( !hasFilled ) blockers.push(ft.template?.title ?? `Template #${ft.id}`);
		}
	}

	const requiredPersons = (bpStep.notificationPersons ?? []).filter(Boolean);
	if ( requiredPersons.length > 0 ) {
		const notified = new Set((stepInstance as any).notifiedPersons ?? []);
		const pending = requiredPersons.filter(p => !notified.has(p));
		if ( pending.length > 0 ) blockers.push(`Pending notifications: ${pending.join(', ')}`);
	}

	return blockers;
};