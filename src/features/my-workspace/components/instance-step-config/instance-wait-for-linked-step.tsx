import {
    useEffect,
    type ReactElement
} from 'react';
import {
    ArrowRight,
    Clock
} from 'lucide-react';
import {
    OperationInstanceStatus
} from '@l-ark/types';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';

/** Linked operations are considered "ready" for wait-step completion in any of these statuses. */
const COMPLETING_STATUSES: OperationInstanceStatus[] = [
    OperationInstanceStatus.CLOSED,
    OperationInstanceStatus.PENDING_PAYMENT,
    OperationInstanceStatus.PARTIALLY_CLOSED,
];

const InstanceWaitForLinkedStep = (): ReactElement => {
    /** My workspace utilities (shared via context) */
    const { dependsOnLinks } = useWorkspaceInstanceContext();

    return (
        <div className="space-y-2">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-[Lato-Bold] text-blue-700"> Waiting for linked operation </p>
                    <p className="text-xs font-[Lato-Regular] text-blue-600/70 mt-0.5 leading-relaxed">
                        This step will auto-complete once the linked sub-operation finishes.
                    </p>
                    { dependsOnLinks.length > 0 &&
                        <div className="mt-3 space-y-2">
                            { dependsOnLinks.map((link: any) => {
                                const subOp = link.sourceInstance;
                                const isClosed = COMPLETING_STATUSES.includes(subOp?.status as OperationInstanceStatus);

                                return (
                                    <div key={link.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-100/40 border border-blue-200/60">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
                                            <span className="text-xs font-[Lato-Bold] text-blue-700 truncate">
                                                { subOp?.title ?? `#${subOp?.id ?? link.sourceInstanceId}` }
                                            </span>
                                            <span className={`shrink-0 text-[9px] px-1.5 py-px rounded-full font-[Lato-Regular] ${isClosed ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-600"}`}>
                                                { subOp?.status ?? "…" }
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    }
                    { dependsOnLinks.length === 0 &&
                        <p className="text-xs font-[Lato-Regular] text-blue-500/60 mt-1 italic">
                            No sub-operation launched yet.
                        </p>
                    }
                </div>
            </div>
        </div>
    );
}

export default InstanceWaitForLinkedStep;