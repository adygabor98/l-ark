import {
    type ReactElement
} from 'react';
import {
    StepInstanceStatus,
    StepType,
    type OperationBlueprintDetail,
    type OperationInstance,
    type StepInstance
} from '@l-ark/types';
import {
    Badge
} from '../../../shared/components/badge';
import {
    CheckCircle2,
    Circle,
    Lock,
    PlayCircle,
    SkipForward
} from 'lucide-react';
import {
    canStartStep,
    getStepProgress,
    StepTypeBadge
} from '../utils/my-workspace.utils';
import {
    useWorkspaceInstanceContext
} from '../context/workspace-instance.context';
import StepRenderers from './step-renderers';

interface PropTypes {
    isReadOnly: boolean;
}

const MyWorkspaceInstanceDetailStepFocus = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { isReadOnly } = props;
    /** My workspace utilities (shared via context) */
    const { instance, blueprint, selectedBlueprintStep, selectedStepInstance } = useWorkspaceInstanceContext();
    
    if( !selectedBlueprintStep ) {
        return <></>
    }
    
    /** Step progress */
    const stepProgress = getStepProgress(selectedStepInstance as StepInstance, selectedBlueprintStep);
    const stepProgressPct = stepProgress.total > 0 ? (stepProgress.done / stepProgress.total) * 100 : 0;

    const stepType = selectedBlueprintStep.stepType ?? StepType.STANDARD;
    const typeBadge = StepTypeBadge[stepType];

    return (
        <>
            <div className="px-5 py-4 border-b border-black/6 shrink-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-[Lato-Bold] text-black/80"> { selectedBlueprintStep.title } </h3>

                            { typeBadge && stepType !== StepType.STANDARD &&
                                <span className={`text-[9px] font-[Lato-Bold] px-2 py-0.5 rounded-full uppercase tracking-wide ${typeBadge.color}`}>
                                    { typeBadge.label }
                                </span>
                            }
                        </div>
                        { selectedBlueprintStep.description &&
                            <p className="mt-1 text-sm font-[Lato-Regular] text-black/40 leading-relaxed">
                                { selectedBlueprintStep.description }
                            </p>
                        }
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                        { selectedStepInstance?.status === StepInstanceStatus.COMPLETED &&
                            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200/40">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                            </Badge>
                        }
                        { selectedStepInstance?.status === StepInstanceStatus.SKIPPED &&
                            <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-400">
                                <SkipForward className="w-3 h-3 mr-1" /> Skipped
                            </Badge>
                        }
                        { selectedStepInstance?.status === StepInstanceStatus.IN_PROGRESS &&
                            <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200/40">
                                <PlayCircle className="w-3 h-3 mr-1" /> In Progress
                            </Badge>
                        }
                        { selectedStepInstance?.status === StepInstanceStatus.PENDING && !canStartStep(selectedStepInstance, blueprint as OperationBlueprintDetail, instance as OperationInstance, isReadOnly) &&
                            <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-400">
                                <Lock className="w-3 h-3 mr-1" /> Blocked
                            </Badge>
                        }
                        { selectedStepInstance?.status === StepInstanceStatus.PENDING && canStartStep(selectedStepInstance, blueprint as OperationBlueprintDetail, instance as OperationInstance, isReadOnly) && !isReadOnly &&
                            <Badge variant="secondary" className="text-[10px] bg-black/4 text-black/40">
                                <Circle className="w-3 h-3 mr-1" /> Ready
                            </Badge>
                        }
                    </div>
                </div>

                {/* Task progress bar (only when in progress or completed) */}
                { (selectedStepInstance?.status === StepInstanceStatus.IN_PROGRESS || selectedStepInstance?.status === StepInstanceStatus.COMPLETED) && getStepProgress(selectedStepInstance, selectedBlueprintStep).total > 0 &&
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${stepProgressPct === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                                style={{ width: `${stepProgressPct}%` }}
                            />
                        </div>
                        <span className={`text-[10px] font-[Lato-Regular] shrink-0 ${stepProgressPct === 100 ? "text-emerald-600" : "text-black/40"}`}>
                            { stepProgress.label }
                        </span>
                    </div>
                }
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <StepRenderers
                    blueprintStep={selectedBlueprintStep}
                    instance={instance}
                    isReadOnly={isReadOnly}
                />
            </div>
        </>
    );
}

export default MyWorkspaceInstanceDetailStepFocus;