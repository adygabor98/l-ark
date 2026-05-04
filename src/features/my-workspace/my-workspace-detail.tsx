import {
    useEffect,
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
	OperationInstanceStatus,
	OperationType,
	StepInstanceStatus
} from '@l-ark/types';
import MyWorkspaceInstanceDetailHeader from './components/my-workspace-instance-detail-header';
import usePermissions from '../../shared/hooks/usePermissions';
import MyWorkspaceInstanceDetailStepTimeline from './components/my-workspace-instance-detail-step-timeline';
import MyWorkspaceInstanceDetailStepFocus from './components/my-workspace-step-focus';
import MyWorkspaceInstanceRightPanel from './components/my-workspace-instance-right-panel';
import { WorkspaceErrorBoundary } from './components/workspace-error-boundary';
import WorkspaceDetailSkeleton from './components/workspace-detail-skeleton';

const MyWorkspaceDetailInner = (): ReactElement => {
    /** User api utilities */
    const { user } = usePermissions();
    /** Operation Instance api utilities (shared via context — single source of truth) */
    const { instance, blueprint, loading, visibleStepInstances } = useWorkspaceInstanceContext();
    /** Status to check if the instance is read only */
    const isReadOnly = (instance?.blueprint.type === OperationType.GLOBAL && Number(instance?.requestedBy?.id) === Number(user?.id) && Number(instance?.assignedTo.id) !== Number(user?.id)) || instance?.status === OperationInstanceStatus.CLOSED;
    /** Retrieve active steps (except the skipped ones) */
    const activeSteps = visibleStepInstances.filter(si => si.status !== StepInstanceStatus.SKIPPED);
    /** Progress bar of the instance */
    const progress = { total: activeSteps.length, completed: activeSteps.filter(si => si.status === StepInstanceStatus.COMPLETED).length };
    const allStepsCompleted = progress.total > 0 && progress.completed === progress.total;
    const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    /** State to manage the displayment of the panel */
    const [contextPanelOpen, setContextPanelOpen] = useState<boolean>(true);

    /** Keyboard shortcut: "]" toggles the right context panel.
     *  Ignored while typing in inputs / textareas / contenteditable areas. */
    useEffect(() => {
        const handler = (e: KeyboardEvent): void => {
            if ( e.key !== ']' || e.metaKey || e.ctrlKey || e.altKey ) return;
            const t = e.target as HTMLElement | null;
            if ( t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) ) return;
            setContextPanelOpen(p => !p);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    if ( loading ) {
        return <WorkspaceDetailSkeleton />;
    }

	if ( !instance || !blueprint ) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-black/40 font-[Lato-Regular]"> Instance not found. </p>
            </div>
    	);
    }

    /**
     * Incoming + outgoing shared-document panels are rendered inside the
     * right context panel "Shared" tab now (see MyWorkspaceInstanceRightPanel)
     * so the header no longer expands vertically with long shared lists.
     */

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

				<main className="flex-1 min-w-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
					<MyWorkspaceInstanceDetailStepFocus isReadOnly={isReadOnly} />
				</main>
				{ contextPanelOpen && <MyWorkspaceInstanceRightPanel /> }
			</div>
		</div>
    );
}

const MyWorkspaceDetail = (): ReactElement => {
    const { id } = useParams<{ id: string }>();
    return (
        <WorkspaceErrorBoundary>
            <WorkspaceInstanceProvider instanceId={id ? parseInt(id) : null}>
                <MyWorkspaceDetailInner />
            </WorkspaceInstanceProvider>
        </WorkspaceErrorBoundary>
    );
}

export default MyWorkspaceDetail;