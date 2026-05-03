import {
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    ArrowRight,
    Link2,
    X
} from 'lucide-react';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import {
    LinkType,
    OperationType,
    type ApiResponse
} from '@l-ark/types';
import {
    useOperationInstance
} from '../../../../server/hooks/useOperationInstance';
import type {
    FetchResult
} from '@apollo/client';
import {
    useToast
} from '../../../../shared/hooks/useToast';
import LaunchOperationDialog from '../launch-operation-dialog/launch-operation-dialog';
import SharedDocumentsPanel from '../shared-documents-panel';
import Button from '../../../../shared/components/button';
import { getResponseMessage } from '../../../../server/hooks/useApolloWithToast';

interface Props {
    allowLinkBlueprintIds: number[];
}

const InstanceAllowInstanceLinkStep = ({ allowLinkBlueprintIds }: Props): ReactElement => {
    /** My workspace instance utilities */
    const { instance, blueprint, linkableOtherInstances, refreshInstance } = useWorkspaceInstanceContext();
    /** Operation instance api utilities */
    const { linkInstances, unlinkInstances } = useOperationInstance();
    /** Toast utilities */
    const { onToast } = useToast();
    /** State to manage the link picker */
    const [showLinkPicker, setShowLinkPicker] = useState<boolean>(false);
    /** State to manage the search of the other operation */
    const [linkSearch, setLinkSearch] = useState<string>("");
    /** Loading state for linkage process */
	const [linkingInProgress, setLinkingInProgress] = useState<boolean>(false);
    /** List of all the available other operations */
    const [otherOperationsAvailable, setOtherOperationsAvailable] = useState<any[]>([]);
    /** Pending target instance for which the user is about to confirm + share docs */
    const [pendingTarget, setPendingTarget] = useState<{ id: number; title?: string } | null>(null);

    if( !instance ) {
        return <></>;
    }
    
    /** Manage to refresh the available list of the operations */
    const refreshListOfAvailableOperations = (): void => {
        const alreadyLinkedIds = (instance.sourceLinks ?? []).map(link => link.targetInstance.id);
        setOtherOperationsAvailable(
            linkableOtherInstances.filter(linkable => {
                if (alreadyLinkedIds.includes(linkable.id)) return false;
                if (allowLinkBlueprintIds.length > 0 && !allowLinkBlueprintIds.includes(linkable.blueprintId)) return false;
                return true;
            })
        );
    }
    
    useEffect(() => {
        refreshListOfAvailableOperations();
    }, [allowLinkBlueprintIds])
    
    /** Manage to check if the blueprintId is not a pre-requisite of the current global operation */
    const isPrerequisite = (blueprintId: number) => {
        const preReqIds = (blueprint?.prerequisites ?? []).map(prereq => prereq.requiredBlueprintId);
        
        return preReqIds.includes(blueprintId);
    };

    /** Open the share-docs dialog for the picked target instance — actual linking happens on submit. */
    const onSelectOtherOperation = (target: { id: number; title?: string }): void => {
        setPendingTarget(target);
    }

    /** Confirm linking + share documents in one round-trip */
    const onConfirmLink = async (payload: { sharedFormInstanceIds: number[]; sharedDocumentIds: number[] }): Promise<void> => {
        if ( !pendingTarget ) return;
        setLinkingInProgress(true);
        try {
            const response: FetchResult<{ data: ApiResponse }> = await linkInstances({ input: {
                sourceInstanceId: instance.id,
                targetInstanceIds: [pendingTarget.id],
                linkType: instance.blueprint.type === OperationType.GLOBAL ? LinkType.GLOBAL_OTHER : LinkType.OTHER_OTHER,
                sharedFormInstanceIds: payload.sharedFormInstanceIds,
                sharedDocumentIds: payload.sharedDocumentIds,
            } });
            await refreshInstance();
            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            setPendingTarget(null);
            setShowLinkPicker(false);
            setLinkSearch("");
        } finally {
            setLinkingInProgress(false);
        }
    }

    /** Manage to remove the link between two oter operations */
    const onRemoveLink = async (targetInstanceId: number): Promise<void> => {
        setLinkingInProgress(true);
        try {
            const response: FetchResult<{ data: ApiResponse }> = await unlinkInstances({ input: { sourceInstanceId: instance.id, targetInstanceId } });
            await refreshInstance();
            onToast({ message: response.data?.data.message ?? '', type: response.data?.data.success ? 'success' : 'error' });
        } finally {
            setLinkingInProgress(false);
        }
    }


    /** Manage to open the search operation link */
    const onOpenLinkList = (): void => {
        refreshListOfAvailableOperations();
        setShowLinkPicker(true);
    }

    return (
        <div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
            <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-[Lato-Bold] text-black/70"> Link Existing Instance </h4>
            </div>
            { instance.sourceLinks.length > 0 &&
                <div className="space-y-1 mb-3">
                    { instance.sourceLinks.map(l => (
                        <div key={l.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-50/40 border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="text-xs font-[Lato-Regular] text-blue-600 flex-1 truncate"> { l.targetInstance?.title ?? `Instance #${l.targetInstanceId}` } </span>
                            <span className="text-[9px] font-[Lato-Regular] text-blue-400/70"> { l.targetInstance?.code } </span>
                            { !isPrerequisite(l.targetInstance.blueprintId) && 
                                <button disabled={linkingInProgress} onClick={() => onRemoveLink(l.targetInstanceId)}
                                    className="w-4 h-4 rounded flex items-center justify-center text-blue-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            } 
                        </div>
                    ))}
                </div>
            }

            { !showLinkPicker ?
                <Button variant="secondary" size="sm" onClick={onOpenLinkList} className="w-full">
                    <Link2 className="w-3.5 h-3.5" /> Link Instance
                </Button>
            :
                <div className="space-y-2">
                    <input type="text" placeholder="Search by title or code…"
                        value={linkSearch} onChange={e => setLinkSearch(e.target.value)} autoFocus
                        className="w-full rounded-md border-[0.5px] border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/30 transition-all shadow-sm"
                    />
                    <div className="max-h-48 overflow-y-auto border border-black/6 rounded-lg bg-white p-1 space-y-0.5">
                        { otherOperationsAvailable
                            .filter(i => !linkSearch || i.title?.toLowerCase().includes(linkSearch.toLowerCase()) || i.code?.toLowerCase().includes(linkSearch.toLowerCase()))
                            .map(inst => (
                                <button key={inst.id} disabled={linkingInProgress}
                                    onClick={() => onSelectOtherOperation({ id: inst.id, title: inst.title })}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50/60 transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-[Lato-Bold] text-black/70 truncate"> { inst.title } </p>
                                        <p className="text-[10px] font-[Lato-Regular] text-black/35"> { inst.code } </p>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-black/20 group-hover:text-amber-500 transition-colors shrink-0" />
                                </button>
                            ))}
                        { otherOperationsAvailable.filter(i => !linkSearch || i.title?.toLowerCase().includes(linkSearch.toLowerCase()) || i.code?.toLowerCase().includes(linkSearch.toLowerCase())).length === 0 &&
                            <p className="text-xs text-black/30 font-[Lato-Regular] text-center py-3"> No instances available </p>
                        }
                    </div>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setShowLinkPicker(false); setLinkSearch(""); }}>
                        Cancel
                    </Button>
                </div>
            }

            {/* Per-link "Documents shared" panels — owner side */}
            { (instance.sourceLinks ?? []).filter(l => (l as any).sharedDocuments != null).map(l => (
                <div key={`share-${l.id}`} className="mt-3">
                    <SharedDocumentsPanel
                        instanceLinkId={l.id}
                        sharedDocuments={(l as any).sharedDocuments ?? []}
                        counterpartTitle={l.targetInstance?.title}
                        mode="owner"
                    />
                </div>
            ))}

            { pendingTarget &&
                <LaunchOperationDialog
                    isOpen={!!pendingTarget}
                    onClose={() => setPendingTarget(null)}
                    headerTitle={`Link with ${pendingTarget.title ?? 'operation'}`}
                    headerSubtitle="Optionally share documents from this operation."
                    submitLabel="Confirm link"
                    fixedBlueprint={{ id: pendingTarget.id, title: pendingTarget.title ?? 'Linked operation' }}
                    onSubmit={onConfirmLink}
                />
            }
        </div>
    );
}

export default InstanceAllowInstanceLinkStep;