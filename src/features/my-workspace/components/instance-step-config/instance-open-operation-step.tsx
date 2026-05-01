import {
    useState,
    type ReactElement
} from 'react';
import {
    ArrowRight,
    ExternalLink,
    Loader2
} from 'lucide-react';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import {
    useNavigate
} from 'react-router-dom';
import {
    useOperationInstance
} from '../../../../server/hooks/useOperationInstance';
import Button from '../../../../shared/components/button';
import {
    OperationType
} from '@l-ark/types';
import LaunchOperationDialog from '../launch-operation-dialog/launch-operation-dialog';
import SharedDocumentsPanel from '../shared-documents-panel';

interface PropTypes {
    isReadOnly: boolean;
}

const InstanceOpenOperationStep = (props: PropTypes): ReactElement => {
    const { isReadOnly } = props;
    const [loading, setLoading] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);

    const { instance, blueprint, linkedGlobalInstances, linkedOtherInstances, selectedStepInstance, selectedBlueprintStep, dependsOnLinks } = useWorkspaceInstanceContext();
    const { executeOpenOperationStep } = useOperationInstance();
    const navigate = useNavigate();

    const openBlueprints = (selectedBlueprintStep?.openBlueprints ?? []) as unknown as { id: number; title: string; subType?: string; description?: string }[];
    const stillAvailableInstances = blueprint?.type === OperationType.GLOBAL || (
        blueprint?.type === OperationType.OTHER &&
        dependsOnLinks.length > 0 ||
        (
            !blueprint?.maxGlobalOperations ||
            (
                blueprint?.maxGlobalOperations - (
                    (dependsOnLinks.length ?? 0) +
                    (linkedGlobalInstances.length ?? 0) +
                    (linkedOtherInstances.length ?? 0)
                )
            ) > 0
        )
    );

    const handleLaunch = async (payload: {
        blueprintId: number;
        title: string;
        description: string;
        sharedFormInstanceIds: number[];
        sharedDocumentIds: number[];
    }): Promise<void> => {
        if (!selectedStepInstance) return;
        setLoading(true);
        try {
            const response = await executeOpenOperationStep({
                input: {
                    stepInstanceId: selectedStepInstance.id,
                    selectedBlueprintId: payload.blueprintId,
                    title: payload.title,
                    description: payload.description,
                    sharedFormInstanceIds: payload.sharedFormInstanceIds,
                    sharedDocumentIds: payload.sharedDocumentIds,
                }
            });
            const newInstanceId = response?.data?.data?.entityId;
            setDialogOpen(false);
            if (newInstanceId != null) {
                navigate(`/workspace/detail/${newInstanceId}`);
            }
        } finally {
            setLoading(false);
        }
    };

    /** sourceLinks of an OPEN_OPERATION-launched sub are the parent's targetLinks with type DEPENDS_ON.
     *  Map them to the InstanceLink rows so we can show + edit "documents shared with X". */
    const dependsOnLinksWithShared = (instance?.targetLinks ?? []).filter((l: any) => l.linkType === 'DEPENDS_ON');

    const renderGlobalOpenedOperations = (): ReactElement => (
        <div className="flex-1">
            <p className="text-sm font-[Lato-Bold] text-violet-500"> Global Operation </p>
            <div className="flex flex-col items-start justify-start">
                <p className="text-xs font-[Lato-Regular] text-violet-500/70"> Global operation already launched: </p>
                { linkedGlobalInstances.map(link => (
                    <div key={link.id} className="flex items-center gap-1 text-xs font-[Lato-Regular] text-violet-500">
                        <ArrowRight className="w-3 h-3" />
                        { link.title }
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOtherOpenedOperations = (): ReactElement => (
        <div className="flex-1">
            <p className="text-sm font-[Lato-Bold] text-amber-500"> Other Operation </p>
            <div className="flex flex-col items-start justify-start">
                <p className="text-xs font-[Lato-Regular] text-amber-500/70"> Other operation already launched: </p>
                { linkedOtherInstances.map(link => (
                    <div key={link.id} className="flex items-center gap-1 text-xs font-[Lato-Regular] text-amber-500">
                        <ArrowRight className="w-3 h-3" />
                        { link.title }
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOpenNewOperation = (): ReactElement => (
        <div className="flex-1">
            <p className="text-sm font-[Lato-Bold] text-neutral-700"> New Operation </p>
            <div className='flex items-center justify-between gap-3'>
                <p className="text-xs font-[Lato-Regular] text-neutral-600/70 mt-0.5">
                    Click to launch the sub-operation defined in the blueprint.
                </p>
                { !isReadOnly &&
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={loading || openBlueprints.length === 0}
                        onClick={() => setDialogOpen(true)}
                    >
                        { loading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <>
                                Launch Sub-Operation
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                        }
                    </Button>
                }
            </div>
        </div>
    );

    return (
        <div className='flex flex-col gap-4'>
            { linkedGlobalInstances.length > 0 &&
                <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/20 flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    { renderGlobalOpenedOperations() }
                </div>
            }
            { linkedOtherInstances.length > 0 &&
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    { renderOtherOpenedOperations() }
                </div>
            }
            { stillAvailableInstances &&
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    { renderOpenNewOperation() }
                </div>
            }

            {/* Per-link "Documents shared" panel for the launching side */}
            { dependsOnLinksWithShared.map((link: any) => (
                <SharedDocumentsPanel
                    key={`shared-${link.id}`}
                    instanceLinkId={link.id}
                    sharedDocuments={link.sharedDocuments ?? []}
                    counterpartTitle={link.sourceInstance?.title}
                    mode="owner"
                />
            ))}

            { dialogOpen &&
                <LaunchOperationDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    blueprints={openBlueprints}
                    headerTitle="Launch Sub-Operation"
                    headerSubtitle="Configure the new sub-operation"
                    submitLabel="Launch Sub-Operation"
                    onSubmit={handleLaunch}
                />
            }
        </div>
    );
}

export default InstanceOpenOperationStep;
