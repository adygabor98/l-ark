import {
    useState,
    type ReactElement
} from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    ExternalLink,
    FileText,
    GitFork,
    X
} from 'lucide-react';
import {
    EdgeConditionType,
    LinkType,
    OperationInstanceStatus,
    StepInstanceStatus,
    StepType,
    type ApiResponse
} from '@l-ark/types';
import ClosureShareBackDialog from './closure-share-back-dialog';
import {
    getStepCompletionBlockers
} from '../../utils/my-workspace.utils';
import {
    areAllDocsChecked,
    findEntryForDoc
} from '../../utils/checked-documents';
import {
    useStepProgression
} from '../../hooks/useStepProgression';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import Button from '../../../../shared/components/button';
import { useOperationInstance } from '../../../../server/hooks/useOperationInstance';
import type { FetchResult } from '@apollo/client';
import { getResponseMessage } from '../../../../server/hooks/useApolloWithToast';
import { useToast } from '../../../../shared/hooks/useToast';

interface PropTypes {
    isReadOnly: boolean;
}

const InstanceFooterStep = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { isReadOnly } = props;
    /** My workspace utilities (shared via context) */
    const { instance, blueprint, selectedStepInstance, selectedBlueprintStep, dependsOnLinks, setInstance, setSelectedStepInstanceId, refreshInstance } = useWorkspaceInstanceContext();
    /** Step progression utilities */
    const { handleStepStatusChange } = useStepProgression({ instance: instance, blueprint: blueprint, isReadOnly: isReadOnly, onInstanceChange: setInstance, onSelectStep: setSelectedStepInstanceId });
    /** Operation instance api utilities */
    const { closeOperation, updateStepInstance } = useOperationInstance();
    /** Toast utilities */
    const { onToast } = useToast();
    /** State to display the user choice section */
    const [showBranchChoice, setShowBranchChoice] = useState(false);
    /** Pending payment status awaiting share-back confirmation */
    const [pendingClosure, setPendingClosure] = useState<string | null>(null);

	if ( !selectedStepInstance || !selectedBlueprintStep ) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
				<div className="w-12 h-12 bg-black/3 rounded-xl flex items-center justify-center mb-3">
					<FileText className="w-5 h-5 text-black/20" />
				</div>
				<p className="text-sm font-[Lato-Bold] text-black/70"> Step Details </p>
				<p className="mt-1 text-xs font-[Lato-Regular] text-black/40 leading-relaxed max-w-40">
					Select a step to view its details
				</p>
			</div>
		);
	}
    /** Retrieve the blockers for this step */
    const blockers = getStepCompletionBlockers(selectedStepInstance, selectedBlueprintStep);
    /** Block completion when any notification persons haven't been confirmed */
    const requiredPersons = (selectedBlueprintStep.notificationPersons ?? []).filter(Boolean);
    const notifiedPersons: string[] = (selectedStepInstance as any).notifiedPersons ?? [];
    const notificationBlocked = requiredPersons.length > 0 && requiredPersons.some(p => !notifiedPersons.includes(p));
    /** Analyze if this operation have any dependent operations liked which aren't completed */
    const activeDepends = dependsOnLinks.filter((l: any) => l.sourceInstance?.status && !["CLOSED", "PARTIALLY_CLOSED"].includes(l.sourceInstance.status));
    /**
     * Block progression if the step requires document uploads. Each expected doc
     * may be satisfied either by a local upload (plain entry — needs a real file
     * uploaded to this step) or by a doc/form shared with this operation (SHARED
     * entry — no local file required).
     */
    const expectedDocs: string[] = selectedBlueprintStep.allowDocumentUpload ? (selectedBlueprintStep.expectedDocuments ?? []).filter(Boolean) : [];
    const expectedDocCount = expectedDocs.length;
    const checkedDocs: string[] = selectedStepInstance.checkedDocuments ?? [];
    const allChecked = expectedDocCount === 0 || areAllDocsChecked(checkedDocs, expectedDocs);
    const sharedSatisfiedCount = expectedDocs.filter(d => {
        const m = findEntryForDoc(checkedDocs, d);
        return m?.parsed.sharedKind != null;
    }).length;
    const satisfiedCount = expectedDocs.filter(d => findEntryForDoc(checkedDocs, d) != null).length;
    const plainCheckedCount = satisfiedCount - sharedSatisfiedCount;
    const localUploads = selectedStepInstance.documents?.length ?? 0;
    /** Plain-checked requirements must each have a real uploaded file backing them. */
    const uploadsMissing = expectedDocCount > 0 && localUploads < plainCheckedCount;
    const docUploadBlocked = expectedDocCount > 0 && (!allChecked || uploadsMissing);
    /**
     * DEPENDS_ON parent links — the operations that launched this one. When the
     * user closes the operation we surface a blocking dialog so they can pick
     * which forms / docs to share back with each parent.
     */
    const closureParentLinks = ((instance?.sourceLinks ?? []) as any[])
        .filter(l => (l.linkType === LinkType.DEPENDS_ON || l.linkType === LinkType.GLOBAL_OTHER) && l.targetInstance)
        .map(l => ({ linkId: l.id as number, counterpartTitle: l.targetInstance?.title as string }));

    /** Retrieve to get the step type */
    const stepType = selectedBlueprintStep.stepType ?? StepType.STANDARD;
    /** Checks for the step */
	const isWaitBlocked = stepType === StepType.WAIT_FOR_LINKED && activeDepends.length > 0;
	const openOpBlocked = stepType === StepType.WAIT_FOR_LINKED && dependsOnLinks.length === 0;
    /** Information of the user choise if exists in this step */
    const outgoingEdges = (blueprint?.edges ?? []).filter((e: any) => Number(e.sourceId) === Number(selectedBlueprintStep.id));
    const userChoiceEdges = outgoingEdges.filter((e: any) => e.conditionType === EdgeConditionType.USER_CHOICE);
    const hasBranching = userChoiceEdges.length > 1;
    /** The edge the user already picked for this step (if any) */
    const chosenEdge = selectedStepInstance.selectedEdgeId
        ? userChoiceEdges.find((e: any) => Number(e.id) === Number(selectedStepInstance.selectedEdgeId)) ?? null
        : null;
    const chosenTargetStep = chosenEdge ? (blueprint?.steps ?? []).find((s: any) => Number(s.id) === Number(chosenEdge.targetId)) : null;
    /** Payment information */
    const paymentTypes = ["CLOSED", "PARTIALLY_CLOSED", "PENDING_PAYMENT"];
    const labels: Record<string, { icon: ReactElement; label: string; variant: "primary" | "secondary", disabled?: boolean }> = {
        CLOSED: { icon: <DollarSign className="w-4 h-4" />, label: "Close — Fully Paid", variant: "primary", disabled: docUploadBlocked },
        PARTIALLY_CLOSED: { icon: <DollarSign className="w-4 h-4" />, label: "Close — Partially Paid", variant: "secondary", disabled: docUploadBlocked },
        PENDING_PAYMENT: { icon: <CreditCard className="w-4 h-4" />, label: "Close — Pending Payment", variant: "secondary", disabled: instance?.status === OperationInstanceStatus.PARTIALLY_CLOSED || instance?.status === OperationInstanceStatus.PENDING_PAYMENT },
    };

    /** Manage to coplete the current step selected */
    const onCompleteStep = (): void => {
        handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED)
    }

    /** Manage to mark a step as chosen */
    const onSelectStep = async (idPath: number): Promise<void> => {
        await handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED, idPath);
        setShowBranchChoice(false);
    }

    const onPayment = async (payStatus: string): Promise<void> => {
        // If this op was launched by one or more parent operations (DEPENDS_ON),
        // ask the user what to share back before transitioning the status.
        if (closureParentLinks.length > 0) {
            setPendingClosure(payStatus);
            return;
        }
        await runClosure(payStatus, []);
    }

    /** Actually performs the close + share-back round trip. */
    const runClosure = async (
        payStatus: string,
        sharePayload: { sharedFormInstanceIds: number[]; sharedDocumentIds: number[] } | [],
    ): Promise<void> => {
        const shareBack = Array.isArray(sharePayload)
            ? []
            : closureParentLinks.map(p => ({
                parentLinkId: String(p.linkId),
                formInstanceIds: sharePayload.sharedFormInstanceIds.map(String),
                documentIds: sharePayload.sharedDocumentIds.map(String),
            }));
        const response: FetchResult<{ data: ApiResponse }> = await closeOperation({ input: {
            instanceId: String(instance?.id),
            paymentStatus: payStatus,
            ...(shareBack.length > 0 ? { shareBack } : {}),
        } as any });
        // Mark the step completed directly — skipping handleStepStatusChange which would
        // overwrite the payment status (PARTIALLY_CLOSED etc.) with COMPLETED_READY.
        await updateStepInstance({ id: selectedStepInstance.id, input: { status: StepInstanceStatus.COMPLETED } });
        await refreshInstance();
        onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
    }

    return (
        <div className="pt-2 border-t border-black/6 space-y-2">
            {/* Blocker warning */}
            { blockers.length > 0 &&
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-[Lato-Bold] text-amber-700"> Pending forms </p>
                        <p className="text-[11px] font-[Lato-Regular] text-amber-600/70 mt-0.5">
                            { blockers.join(", ") } { blockers.length === 1 ? "has" : "have" } not been submitted yet.
                        </p>
                    </div>
                </div>
            }

            {/* Document upload blocked */}
            { docUploadBlocked &&
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-[Lato-Bold] text-amber-700"> Missing documents </p>
                        { uploadsMissing &&
                            <p className="text-[11px] font-[Lato-Regular] text-amber-600/70 mt-0.5">
                                { localUploads } of { plainCheckedCount } required documents uploaded.
                            </p>
                        }
                        { !allChecked &&
                            <p className="text-[11px] font-[Lato-Regular] text-amber-600/70 mt-0.5">
                                { satisfiedCount } of { expectedDocCount } required documents satisfied
                                { sharedSatisfiedCount > 0 ? ` (${sharedSatisfiedCount} via shared)` : '' }.
                            </p>
                        }
                        { !allChecked &&
                            <p className="text-[11px] font-[Lato-Regular] text-amber-600/70 mt-0.5">
                                Mark each remaining requirement as uploaded — or link it to a document shared with this operation.
                            </p>
                        }
                    </div>
                </div>
            }

            {/* Wait blocked */}
            { isWaitBlocked &&
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200/50">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-[Lato-Regular] text-blue-600">
                        Waiting for sub-operation to close before this step can complete.
                    </p>
                </div>
            }

            {/* Open op blocked */}
            { openOpBlocked &&
                <div className="flex items-start gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200/50">
                    <ExternalLink className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-[Lato-Regular] text-violet-600">
                        Launch the sub-operation above before completing this step.
                    </p>
                </div>
            }

            {/* Closure: payment decision */}
            { stepType === StepType.CLOSURE && instance?.status !== OperationInstanceStatus.CLOSED ?
                <>
                    <p className="text-sm font-[Lato-Bold] text-black/60 mt-5 mb-5"> Close this operation: </p>
                    <div className='flex flex-col gap-3'>
                        { paymentTypes.map(payStatus => {
                            const { icon, label, variant, disabled } = labels[payStatus];

                            return (
                                <div className='flex items-center justify-center'>
                                    <Button key={payStatus} variant={variant} disabled={disabled} size="md" className='w-fit' onClick={() => onPayment(payStatus)}>
                                        { icon }
                                        { label }
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </>
            : stepType === StepType.CLOSURE &&
                <div>
                    <p className="text-sm font-[Lato-Bold] text-black/60 mt-5 mb-5"> The operation has been closed! </p>
                </div>
            }

            {/* Branching */}
            { stepType !== StepType.CLOSURE && !isWaitBlocked && !openOpBlocked && hasBranching && !showBranchChoice && (
                chosenEdge ? (
                    <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200/50">
                        <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs font-[Lato-Bold] text-violet-700"> Path chosen </p>
                            <p className="text-[11px] font-[Lato-Regular] text-violet-600/70 truncate mt-0.5">
                                { chosenEdge.label || chosenTargetStep?.title || "Continue" }
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className='w-full flex items-center justify-center'>
                        <Button variant="primary" size="md" disabled={docUploadBlocked || notificationBlocked} onClick={() => setShowBranchChoice(true)}>
                            <GitFork className="w-5 h-5" />
                            Choose Path & Complete
                        </Button>
                    </div>
                )
            )}

            { stepType !== StepType.CLOSURE && !isWaitBlocked && !openOpBlocked && hasBranching && showBranchChoice &&
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <GitFork className="w-3.5 h-3.5 text-violet-500" />
                        <p className="text-xs font-[Lato-Bold] text-black/70"> Choose the next path </p>
                    </div>
                    { userChoiceEdges.map((edge: any) => {
                        const targetStep = (blueprint?.steps ?? []).find(s => Number(s.id) === Number(edge.targetId));

                        return (
                            <button key={edge.id} onClick={() => !docUploadBlocked && !notificationBlocked && onSelectStep(edge.id)} disabled={docUploadBlocked || notificationBlocked}
                                className={`w-full text-left p-3 rounded-xl border border-black/8 bg-white transition-all duration-200 group ${docUploadBlocked || notificationBlocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-violet-400 hover:bg-violet-50/40 cursor-pointer'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center shrink-0 transition-colors">
                                        <ArrowRight className="w-3.5 h-3.5 text-violet-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-[Lato-Bold] text-black/70 truncate"> { edge.label || targetStep?.title || "Continue" } </p>
                                        { targetStep?.description && <p className="text-[11px] font-[Lato-Regular] text-black/35 truncate mt-0.5">{targetStep.description}</p> }
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    <div className='flex items-center justify-center'>
                        <Button variant="secondary" size="md" onClick={() => setShowBranchChoice(false)}>
                            <X className='w-3 h-3' />
                            Cancel
                        </Button>
                    </div>
                </div>
            }

            {/* Standard completion */}
            { stepType !== StepType.CLOSURE && !isWaitBlocked && !openOpBlocked && !hasBranching && selectedStepInstance.status !== StepInstanceStatus.COMPLETED &&
                <div className='w-full flex items-center justify-center'>
                    <Button variant="primary" size="md" disabled={docUploadBlocked || notificationBlocked} onClick={onCompleteStep}>
                        <CheckCircle2 className="w-5 h-5" />
                        Mark Step as Complete
                    </Button>
                </div>
            }

            {/* Closure share-back dialog (only when this op has DEPENDS_ON parents) */}
            { pendingClosure && closureParentLinks.length > 0 &&
                <ClosureShareBackDialog
                    isOpen={!!pendingClosure}
                    onClose={() => setPendingClosure(null)}
                    parentLinks={closureParentLinks}
                    onConfirm={async (payload) => { await runClosure(pendingClosure, payload); setPendingClosure(null); }}
                    onSkip={async () => { await runClosure(pendingClosure, []); setPendingClosure(null); }}
                />
            }
        </div>
    );
}

export default InstanceFooterStep;