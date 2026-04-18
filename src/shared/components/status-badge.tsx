import type { ReactElement } from "react";
import { CheckCircle2, Clock, AlertCircle, SkipForward, Globe, PlayCircle, FileText } from "lucide-react";

type StatusVariant = 'completed' | 'active' | 'pending' | 'skipped' | 'draft' | 'global' | 'warning' | 'error';

interface StatusBadgeProps {
	status: StatusVariant | string;
	label?: string;
	size?: 'sm' | 'default';
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; className: string; defaultLabel: string }> = {
	completed: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200', defaultLabel: 'Completed' },
	active: { icon: PlayCircle, className: 'bg-amber-50 text-amber-700 border-amber-200', defaultLabel: 'Active' },
	pending: { icon: Clock, className: 'bg-slate-50 text-slate-500 border-slate-200', defaultLabel: 'Pending' },
	skipped: { icon: SkipForward, className: 'bg-slate-50 text-slate-400 border-slate-200', defaultLabel: 'Skipped' },
	draft: { icon: FileText, className: 'bg-amber-50 text-amber-600 border-amber-200', defaultLabel: 'Draft' },
	global: { icon: Globe, className: 'bg-violet-50 text-violet-700 border-violet-200', defaultLabel: 'Global' },
	warning: { icon: AlertCircle, className: 'bg-amber-50 text-amber-700 border-amber-200', defaultLabel: 'Warning' },
	error: { icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-200', defaultLabel: 'Error' },
};

const StatusBadge = ({ status, label, size = 'default' }: StatusBadgeProps): ReactElement => {
	const config = STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG['pending'];
	const Icon = config.icon;
	const sizeClass = size === 'sm' ? 'text-[9px] px-1.5 py-px gap-1' : 'text-[10px] px-2 py-0.5 gap-1.5';
	const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

	return (
		<span className={`inline-flex items-center rounded-md border font-[Lato-Bold] whitespace-nowrap ${sizeClass} ${config.className}`}>
			<Icon className={iconSize} />
			{label ?? config.defaultLabel}
		</span>
	);
};

export default StatusBadge;
