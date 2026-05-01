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

interface PropTypes {
	isReadOnly: boolean;
	progress: { completed: number; total: number };
}

const MyWorkspaceInstanceDetailStepTimeline = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { isReadOnly, progress } = props;
    /** Operation Instance api utilities (shared via context) */
    const { instance, blueprint, visibleStepInstances, selectedStepInstanceId, launchedFromInstance, setSelectedStepInstanceId } = useWorkspaceInstanceContext();

	return (
        <div className="w-68 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
			<div className="px-4 py-3 border-b border-black/6 flex items-center justify-between">
				<h3 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Steps </h3>
				<span className="text-[10px] font-[Lato-Regular] text-black/30">
					{ progress.completed}/{progress.total }
				</span>
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
								{/* Connector line */}
								{ !isLast && <div className={`absolute left-4.25 top-8 w-px h-2 ${isCompleted ? "bg-emerald-200" : "bg-black/6"}`} /> }

								<button onClick={() => setSelectedStepInstanceId(si.id)}
									className={`w-full text-left rounded-xl px-2.5 py-2 transition-all duration-150 cursor-pointer group ${
										isSelected ? "bg-amber-50/80 ring-1 ring-amber-300/60 shadow-sm" : "hover:bg-black/2 hover:ring-1 hover:ring-black/4"
									}`}
								>
									<div className="flex items-center gap-2.5">
										<div className="shrink-0">
											{ isCompleted ?  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                : isSkipped ? <SkipForward className="w-4 h-4 text-slate-300" />
                                                : isActive ? <PlayCircle className="w-4 h-4 text-amber-500" />
                                                : isBlocked ? <Lock className="w-3.5 h-3.5 text-red-300" />
                                                : <Circle className="w-4 h-4 text-black/15" />
                                            }
										</div>

										<span className={`text-[13px] font-[Lato-Bold] truncate flex-1 transition-colors ${
											isSelected ? "text-black/90" : (isCompleted || isSkipped) ? "text-black/35" : "text-black/65"
										}`}>
											{ bpStep.title }
										</span>

										{ bpStep.isRequired && <span className="text-red-400 text-[9px] font-[Lato-Bold] shrink-0"> REQ </span> }
									</div>
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
    );
}

export default MyWorkspaceInstanceDetailStepTimeline;