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
import SharedDocumentsPanel, { getOriginInstanceId, type SharedDocumentRow } from './components/shared-documents-panel';

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
     * Header only surfaces docs that came INTO this op from another. For DEPENDS_ON links,
     * the parent op (we appear as targetInstance) already has the OPEN_OPERATION step (outgoing)
     * and WAIT step (incoming) covering both sides — so skip those here. For the sub op
     * (we appear as sourceInstance) there is no equivalent step, so keep DEPENDS_ON
     * in the header so the sub can see what the parent shared with it.
     */
    const incomingLinks = [
        ...(instance.sourceLinks ?? []).map((l: any) => ({
            id: l.id,
            counterpartTitle: l.targetInstance?.title,
            rows: (l.sharedDocuments ?? []) as SharedDocumentRow[],
            skip: false,
        })),
        ...(instance.targetLinks ?? []).map((l: any) => ({
            id: l.id,
            counterpartTitle: l.sourceInstance?.title,
            rows: (l.sharedDocuments ?? []) as SharedDocumentRow[],
            skip: l.linkType === 'DEPENDS_ON',
        })),
    ].filter(l =>
        !l.skip &&
        l.rows.some(r => {
            const origin = getOriginInstanceId(r);
            return origin == null || origin !== instance.id;
        })
    );

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

			{ incomingLinks.length > 0 &&
				<div className="px-3 pb-2 space-y-2">
					{ incomingLinks.map(l => (
						<SharedDocumentsPanel
							key={`incoming-${l.id}`}
							instanceLinkId={l.id}
							sharedDocuments={l.rows}
							counterpartTitle={l.counterpartTitle}
							mode="viewer"
						/>
					))}
				</div>
			}

			<div className="flex-1 flex gap-3 min-h-0">
				<MyWorkspaceInstanceDetailStepTimeline isReadOnly={isReadOnly} progress={progress} />

				<div className="flex-1 min-w-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
					<MyWorkspaceInstanceDetailStepFocus isReadOnly={isReadOnly} />
				</div>
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