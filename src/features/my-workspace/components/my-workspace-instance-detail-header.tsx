import {
    type ReactElement
} from 'react';
import type {
    OperationInstance
} from '@l-ark/types';
import {
    ChevronLeft,
    Lock,
    PanelRightClose,
    PanelRightOpen
} from 'lucide-react';
import {
    useNavigate
} from 'react-router-dom';
import {
    Badge
} from '../../../shared/components/badge';
import {
    INSTANCE_STATUS_COLORS,
    STATUS_LABELS
} from '../utils/my-workspace.utils';
import Button from '../../../shared/components/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '../../../shared/components/tooltip';

interface PropTypes {
    instance: OperationInstance;
	isReadOnly: boolean;
	allStepsCompleted: boolean;
	progress: { completed: number; total: number };
	progressPct: number;
	contextPanelOpen: boolean;
    
	onToggleContextPanel: () => void;
}

const MyWorkspaceInstanceDetailHeader = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { instance, isReadOnly, progress, progressPct, allStepsCompleted, contextPanelOpen, onToggleContextPanel } = props;
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Retrieve colors of the header */
    const colors = INSTANCE_STATUS_COLORS[instance.status as keyof typeof INSTANCE_STATUS_COLORS];

    /** Manage to redirect the user to the workspace list */
    const goBack = (): void => {
        navigate("/workspace");
    }

    return (
        <header className="shrink-0 mb-3 bg-white rounded-xl border border-black/6 shadow-sm px-4 py-3 flex items-center gap-3">
			<Tooltip>
				<TooltipTrigger asChild>
					<span>
						<Button variant="icon" onClick={goBack} className="shrink-0">
							<ChevronLeft className="w-5 h-5" aria-label="Back to workspace" />
						</Button>
					</span>
				</TooltipTrigger>
				<TooltipContent side="bottom"> Back to workspace </TooltipContent>
			</Tooltip>

			<div className="w-px h-8 bg-black/6 shrink-0" />

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="text-sm font-[Lato-Bold] text-black truncate cursor-default">
								{ instance.title || "Untitled Instance" }
							</span>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-sm">
							{ instance.title || "Untitled Instance" }
						</TooltipContent>
					</Tooltip>
					{ instance.code &&
						<Badge variant="secondary" className="text-[10px] font-[Lato-Bold] shrink-0">
							{ instance.code }
						</Badge>
					}
					{ colors &&
						<span className={`text-[10px] font-[Lato-Bold] px-2 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
							{ STATUS_LABELS[instance.status] ?? instance.status.replace(/_/g, " ") }
						</span>
					}
					{ isReadOnly &&
						<Badge variant="warning" className="text-[10px] font-[Lato-Bold] shrink-0 gap-1">
							<Lock className="w-3 h-3" /> Read-only
						</Badge>
					}
					{/* Compact progress for small screens */}
					<span className="md:hidden ml-auto text-[10px] font-[Lato-Bold] text-black/45 shrink-0">
						{ progress.completed }/{ progress.total } · { Math.round(progressPct) }%
					</span>
				</div>
				 { instance.description &&
					<Tooltip>
						<TooltipTrigger asChild>
							<p className="text-xs font-[Lato-Regular] text-black/40 truncate mt-0.5 max-w-md cursor-default">
								{ instance.description }
							</p>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-md whitespace-pre-wrap wrap-break-word">
							{ instance.description }
						</TooltipContent>
					</Tooltip>
				}
			</div>

			<div className="flex items-center gap-3 shrink-0">
				<div className="text-right hidden md:block">
					<div className="flex items-center gap-1.5 justify-end mb-1">
						<span className="text-[10px] font-[Lato-Regular] text-black/35">
							{ progress.completed}/{progress.total } steps
						</span>
						<span className={`text-[10px] font-[Lato-Bold] ${allStepsCompleted ? "text-emerald-600" : "text-black/40"}`}>
							{ Math.round(progressPct) }%
						</span>
					</div>
					<div className="w-36 h-1.5 bg-black/5 rounded-full overflow-hidden">
						<div style={{ width: `${progressPct}%` }}
							className={`h-full rounded-full transition-all duration-500 ${ allStepsCompleted ? "bg-emerald-500" : "bg-linear-to-r from-[#FFBF00] to-[#D4AF37]" }`}
						/>
					</div>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<span>
							<Button variant="icon" onClick={onToggleContextPanel} className="shrink-0">
								{ contextPanelOpen
									? <PanelRightClose className="w-4 h-4" aria-label="Hide details panel" />
									: <PanelRightOpen className="w-4 h-4" aria-label="Show details panel" />
								}
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{ contextPanelOpen ? "Hide details" : "Show details" } <span className="opacity-60 ml-1">]</span>
					</TooltipContent>
				</Tooltip>
			</div>
		</header>
    );
}

export default MyWorkspaceInstanceDetailHeader;