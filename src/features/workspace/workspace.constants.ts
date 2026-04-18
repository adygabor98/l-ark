
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
	CLOSED: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-700/20' },
	PENDING_PAYMENT: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-600/20' },
	PARTIALLY_CLOSED: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-600/20' },
} as const;
