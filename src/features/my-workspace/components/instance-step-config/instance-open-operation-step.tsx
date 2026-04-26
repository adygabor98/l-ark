import {
    useState,
    type ReactElement
} from 'react';
import {
    ArrowRight,
    ExternalLink
} from 'lucide-react';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import {
    useNavigate
} from 'react-router-dom';
import Button from '../../../../shared/components/button';
import MyWorkspaceRequestOperation from '../my-workspace-request-operation';

interface PropTypes {
    isReadOnly: boolean;
}

const InstanceOpenOperationStep = (props: PropTypes): ReactElement => {
    const { isReadOnly } = props;
    /** State to manage the didsplayment of the request operation */
	const [showRequestGlobal, setShowRequestGlobal] = useState<boolean>(false)
    /** My workspace utilities (shared via context) */
    const { blueprint, linkedGlobalInstances, linkedOtherInstances } = useWorkspaceInstanceContext();
    /** Navigation utilities */
    const navigate = useNavigate();

    /** Manage to render the operations generated for this sub-operation */
    const renderGlobalOpenedOperations = (): ReactElement => (
        <div className="flex-1">
            <p className="text-sm font-[Lato-Bold] text-violet-500"> Global Operation </p>
            <div className="flex flex-col items-start justify-start">
                <p className="text-xs font-[Lato-Regular] text-violet-500/70"> Global operation already launched: </p>
                { linkedGlobalInstances.map(link => (
                    <Button variant='link' onClick={() => navigate(`/workspace/detail/${link.id}`)} key={link.id} className="text-violet-500">
                        <ArrowRight className="w-3 h-3" />
                        { link.title }
                    </Button>
                ))}
            </div>
        </div>
    );
    
    /** Manage to render the operations generated for this sub-operation */
    const renderOtherOpenedOperations = (): ReactElement => (
        <div className="flex-1">
            <p className="text-sm font-[Lato-Bold] text-amber-500"> Other Operation </p>
            <div className="flex flex-col items-start justify-start">
                <p className="text-xs font-[Lato-Regular] text-amber-500/70"> Other operation already launched: </p>
                { linkedOtherInstances.map(link => (
                    <span key={link.id} onClick={() => navigate(`/workspace/detail/${link.id}`)} className="text-amber-500">
                        <ArrowRight className="w-3 h-3" />
                        { link.title }
                    </span>
                ))}
            </div>
        </div>
    );

    /** Manage to render the open new operation instance */
    const renderOpenNewOperation = (): ReactElement => (
        <div className="flex-1">
            <p className="text-sm font-[Lato-Bold] text-neutral-700"> New Operation </p>
            <div className='flex items-center justify-between gap-3'>
                <p className="text-xs font-[Lato-Regular] text-neutral-600/70 mt-0.5">
                   Click to launch the sub-operation defined in the blueprint.
                </p>

                { !isReadOnly &&
                    <Button variant="primary" size="sm" onClick={() => setShowRequestGlobal(true)}>
                        Launch Sub-Operation
                        <ArrowRight className="w-3.5 h-3.5" />
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
            { (!blueprint?.maxGlobalOperations || blueprint.maxGlobalOperations > 1) &&
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    { renderOpenNewOperation() }
                </div>
            }
            { showRequestGlobal &&
				<MyWorkspaceRequestOperation onClose={() => setShowRequestGlobal(false)} />
			}
        </div>
    );
}

export default InstanceOpenOperationStep;
