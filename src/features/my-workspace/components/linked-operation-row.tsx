import { type ReactElement } from 'react';
import { ArrowRight } from 'lucide-react';
import { INSTANCE_STATUS_COLORS } from '../utils/my-workspace.utils';

export type LinkedOpTone = 'blue' | 'violet' | 'amber';

interface PropTypes {
	icon: ReactElement;
	title: string;
	code?: string | null;
	status?: string | null;
	tone?: LinkedOpTone;
}

const TONE: Record<LinkedOpTone, { title: string; code: string; arrow: string }> = {
	blue:   { title: 'text-blue-700',   code: 'text-blue-400/80',   arrow: 'text-blue-300' },
	violet: { title: 'text-violet-700', code: 'text-violet-400/80', arrow: 'text-violet-300' },
	amber:  { title: 'text-amber-700',  code: 'text-amber-400/80',  arrow: 'text-amber-300' },
};

/**
 * Single-row presentation for a linked operation in the right context panel.
 * Unifies what was previously 4 near-identical inline blocks.
 */
const LinkedOperationRow = ({ icon, title, code, status, tone = 'blue' }: PropTypes): ReactElement => {
	const t = TONE[tone];
	const colors = status ? INSTANCE_STATUS_COLORS[status as keyof typeof INSTANCE_STATUS_COLORS] : undefined;

	return (
		<div className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/3 transition-colors">
			<span className="shrink-0">{ icon }</span>
			<div className="flex-1 min-w-0">
				<span className={`text-xs font-[Lato-Regular] truncate block ${t.title}`}>{ title }</span>
				{ code && <span className={`text-[9px] font-[Lato-Regular] ${t.code}`}>{ code }</span> }
			</div>
			{ colors &&
				<span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
					{ status?.replace(/_/g, ' ') }
				</span>
			}
			<ArrowRight className={`w-3 h-3 shrink-0 ${t.arrow}`} />
		</div>
	);
};

export default LinkedOperationRow;
