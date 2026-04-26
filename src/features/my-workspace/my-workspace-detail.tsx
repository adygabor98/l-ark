import {
    useState,
    type ReactElement
} from 'react';
import {
    useParams
} from 'react-router-dom';
import {
    WorkspaceInstanceProvider,
    useWorkspaceInstanceContext
} from './context/workspace-instance.context';
import {
    Loader2
} from 'lucide-react';
import {
	OperationInstanceStatus,
	OperationType,
	StepInstanceStatus
} from '@l-ark/types';
import MyWorkspaceInstanceDetailHeader from './components/my-workspace-instance-detail-header';
import usePermissions from '../../shared/hooks/usePermissions';
import MyWorkspaceInstanceDetailStepTimeline from './components/my-workspace-instance-detail-step-timeline';
import MyWorkspaceInstanceDetailStepFocus from './components/my-workspace-step-focus';
import MyWorkspaceInstanceRightPanel from './components/my-workspace-instance-right-panel';

const MyWorkspaceDetailInner = (): ReactElement => {
    /** User api utilities */
    const { user } = usePermissions();
    /** Operation Instance api utilities (shared via context — single source of truth) */
    const { instance, blueprint, loading, visibleStepInstances } = useWorkspaceInstanceContext();
    /** Status to check if the instance is read only */
    const isReadOnly = (instance?.blueprint.type == OperationType.GLOBAL && instance?.requestedBy?.id == user?.id && instance?.assignedTo.id !== user?.id) || instance?.status === OperationInstanceStatus.CLOSED;
    /** Retrieve active steps (except the skipped ones) */
    const activeSteps = visibleStepInstances.filter(si => si.status !== StepInstanceStatus.SKIPPED);
    /** Progress bar of the instance */
    const progress = { total: activeSteps.length, completed: activeSteps.filter(si => si.status == StepInstanceStatus.COMPLETED).length };
    const allStepsCompleted = progress.total > 0 && progress.completed === progress.total;
    const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    /** State to manage the displayment of the panel */
    const [contextPanelOpen, setContextPanelOpen] = useState<boolean>(true);

    if ( loading ) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-sm text-black/40 font-[Lato-Regular]"> Loading instance... </span>
                </div>
            </div>
        );
    }

	if ( !instance || !blueprint ) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-black/40 font-[Lato-Regular]"> Instance not found. </p>
            </div>
    	);
    }

    return (
        <div className="h-full flex flex-col">
			<MyWorkspaceInstanceDetailHeader
				instance={instance}
				isReadOnly={isReadOnly}
				allStepsCompleted={allStepsCompleted}
				progress={progress}
				progressPct={progressPct}
				contextPanelOpen={contextPanelOpen}
				onToggleContextPanel={() => setContextPanelOpen(p => !p)}
			/>

			<div className="flex-1 flex gap-3 min-h-0">
				<MyWorkspaceInstanceDetailStepTimeline isReadOnly={isReadOnly} progress={progress} />

				<div className="flex-1 min-w-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
					<MyWorkspaceInstanceDetailStepFocus isReadOnly={isReadOnly} />
				</div>
				<MyWorkspaceInstanceRightPanel />
			</div>
		</div>
    );
}

const MyWorkspaceDetail = (): ReactElement => {
    const { id } = useParams<{ id: string }>();
    return (
        <WorkspaceInstanceProvider instanceId={id ? parseInt(id) : null}>
            <MyWorkspaceDetailInner />
        </WorkspaceInstanceProvider>
    );
}

export default MyWorkspaceDetail;