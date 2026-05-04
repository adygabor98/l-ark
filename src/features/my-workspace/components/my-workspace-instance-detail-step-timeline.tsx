import {
    type ReactElement
} from 'react';
import {
    ArrowRight,
    CheckCircle2,
    Circle,
    ExternalLink,
    Lock,
    PlayCircle,
    SkipForward
} from 'lucide-react';
import {
    StepInstanceStatus,
    type OperationBlueprintDetail,
    type OperationInstance
} from '@l-ark/types';
import {
    canStartStep
} from '../utils/my-workspace.utils';
import {
	useWorkspaceInstanceContext
} from '../context/workspace-instance.context';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '../../../shared/components/tooltip';

interface PropTypes {
	isReadOnly: boolean;
	progress: { completed: number; total: number };
}

const MyWorkspaceInstanceDetailStepTimeline = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { isReadOnly, progress } = props;
    /** Operation Instance api utilities (shared via context) */
    const { instance, blueprint, visibleStepInstances, selectedStepInstanceId, launchedFromInstance, setSelectedStepInstanceId } = useWorkspaceInstanceContext();
	/** Mini progress percentage shown at the top of the timeline */
	const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
	const allCompleted = progress.total > 0 && progress.completed === progress.total;

	return (
        <aside aria-label="Steps" className="w-64 xl:w-72 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
			<div className="sticky top-0 z-10 bg-white border-b border-black/6">
				<div className="px-4 py-3 flex items-center justify-between">
					<h3 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Steps </h3>
					<span className="text-[10px] font-[Lato-Regular] text-black/30">
						{ progress.completed}/{progress.total }
					</span>
				</div>
				<div className="h-1 bg-black/5 overflow-hidden">
					<div style={{ width: `${progressPct}%` }}
						className={`h-full transition-all duration-500 ${ allCompleted ? "bg-emerald-500" : "bg-linear-to-r from-[#FFBF00] to-[#D4AF37]" }`}
					/>
				</div>
			</div>

			{ launchedFromInstance &&
				<div className="px-3 py-2 border-b border-black/6 bg-blue-50/40">
					<div className="flex items-center gap-1.5 mb-1.5">
						<ExternalLink className="w-3 h-3 text-blue-500" />
						<span className="text-[10px] font-[Lato-Bold] text-blue-600 uppercase tracking-widest"> Launched By </span>
					</div>

					<div className="w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
						<span className="text-xs font-[Lato-Regular] text-blue-600 truncate flex-1"> { launchedFromInstance.title } </span>
						<ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
					</div>
				</div>
			}

			{/* Step list */}
			<div className="flex-1 overflow-y-auto p-2">
				<div className="space-y-0.5">
					{ visibleStepInstances.map((si, idx) => {
						const bpStep = (blueprint?.steps ?? []).find(s => Number(s.id) === Number(si.stepId));
						if ( !bpStep ) return null;

						const isSelected = Number(si.id) === Number(selectedStepInstanceId);
						const isCompleted = si.status === StepInstanceStatus.COMPLETED;
						const isActive = si.status === StepInstanceStatus.IN_PROGRESS;
						const isSkipped = si.status === StepInstanceStatus.SKIPPED;
						const isPending = si.status === StepInstanceStatus.PENDING;
						const isBlocked = isPending && !canStartStep(si, blueprint as OperationBlueprintDetail, instance as OperationInstance, isReadOnly);
						const isLast = idx === visibleStepInstances.length - 1;

						return (
							<div key={si.id} className="relative">
								{/* Connector line — visually links consecutive step icons */}
								{ !isLast && <div className={`absolute left-[17px] top-7 w-px h-3 ${isCompleted ? "bg-emerald-200" : "bg-black/6"}`} /> }

								<button onClick={() => setSelectedStepInstanceId(si.id)}
									className={`w-full text-left rounded-xl px-2.5 py-2 transition-all duration-150 cursor-pointer group ${
										isSelected ? "bg-amber-50/80 ring-1 ring-amber-300/60 shadow-sm border-l-2 border-amber-400 pl-2" : "border-l-2 border-transparent hover:bg-black/2 hover:ring-1 hover:ring-black/4"
									}`}
								>
									<div className="flex items-center gap-2.5">
										<div className="shrink-0">
											{ isCompleted ?  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                : isSkipped ? <SkipForward className="w-4 h-4 text-slate-300" />
                                                : isActive ? <PlayCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                                                : isBlocked ? <Lock className="w-3.5 h-3.5 text-red-300" />
                                                : <Circle className="w-4 h-4 text-black/15" />
                                            }
										</div>

										<span className={`text-[11px] font-[Lato-Bold] tabular-nums shrink-0 ${
											isSelected ? "text-amber-600" : "text-black/30"
										}`}>
											{ String(idx + 1).padStart(2, '0') }.
										</span>

										<span className={`text-[13px] font-[Lato-Bold] truncate flex-1 transition-colors ${
											isSelected ? "text-black/90" : (isCompleted || isSkipped) ? "text-black/35" : "text-black/65"
										}`}>
											{ bpStep.title }
										</span>

										{ bpStep.isRequired &&
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" aria-label="Required step" />
												</TooltipTrigger>
												<TooltipContent side="right"> Required step </TooltipContent>
											</Tooltip>
										}
									</div>
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</aside>
    );
}

export default MyWorkspaceInstanceDetailStepTimeline;
