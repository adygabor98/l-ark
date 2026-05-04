import {
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    CheckCircle2,
    XCircle,
    Globe,
    Inbox,
    Loader2,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../../../shared/components/badge';
import Button from '../../../shared/components/button';
import { useOperationRequest } from '../../../server/hooks/useOperationRequest';
import { useToast } from '../../../shared/hooks/useToast';
import { getResponseMessage } from '../../../server/hooks/useApolloWithToast';
import type { OperationRequest } from '@l-ark/types';

type RequestFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const STATUS_STYLES: Record<string, string> = {
    PENDING:  'bg-amber-50 text-amber-700 ring-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    REJECTED: 'bg-red-50 text-red-600 ring-red-200',
};

const MyWorkspaceRequestsPanel = (): ReactElement => {
    const { requests, retrieveRequests, handleRequest } = useOperationRequest();
    const { onToast } = useToast();

    const [filter, setFilter] = useState<RequestFilter>('PENDING');
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        retrieveRequests(filter !== 'ALL' ? { status: filter } : undefined);
    }, [filter]);

    const handleApprove = async (req: OperationRequest): Promise<void> => {
        setActionLoading(req.id);
        try {
            const res = await handleRequest({ input: { requestId: req.id, action: 'APPROVED' } });
            onToast({ message: getResponseMessage(res?.data?.data) ?? 'Request approved.', type: 'success' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (req: OperationRequest): Promise<void> => {
        if (!rejectionReason.trim()) {
            onToast({ message: 'Please provide a rejection reason.', type: 'warning' });
            return;
        }
        setActionLoading(req.id);
        try {
            const res = await handleRequest({ input: { requestId: req.id, action: 'REJECTED', rejectionReason: rejectionReason.trim() } });
            onToast({ message: getResponseMessage(res?.data?.data) ?? 'Request rejected.', type: 'success' });
            setRejectingId(null);
            setRejectionReason('');
        } finally {
            setActionLoading(null);
        }
    };

    const filterOptions: { label: string; value: RequestFilter }[] = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'All', value: 'ALL' },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Status filter */}
            <div className="flex items-center gap-2">
                { filterOptions.map(opt => (
                    <button key={opt.value} onClick={() => setFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-[Lato-Bold] transition-all duration-200 cursor-pointer ${
                            filter === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white text-black/50 hover:bg-black/4 border border-black/6'
                        }`}
                    >
                        { opt.label }
                    </button>
                ))}
            </div>

            { requests.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-black/6 border-dashed">
                    <div className="w-16 h-16 bg-black/3 rounded-2xl flex items-center justify-center mb-4">
                        <Inbox className="w-8 h-8 text-black/25" />
                    </div>
                    <h3 className="text-xl font-[Lato-Black] text-black mb-1">No requests</h3>
                    <p className="text-sm text-black/45 font-[Lato-Regular]">
                        { filter === 'PENDING' ? 'No pending global operation requests.' : 'No requests match this filter.' }
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-black/6 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_120px] gap-4 px-6 py-3.5 bg-black/2 border-b border-black/6">
                        <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider">Requested by</span>
                        <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider">Source Operation</span>
                        <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider">Global Blueprint</span>
                        <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider">Date</span>
                        <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider">Status</span>
                    </div>

                    { requests.map((req: OperationRequest) => (
                        <div key={req.id} className="border-b border-black/4 last:border-b-0">
                            <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_120px] gap-4 px-6 py-4 items-center">
                                {/* Requester */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-black/6 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-[Lato-Bold] text-black/50 uppercase">
                                            { req.requestedBy?.firstName?.charAt(0) }{ req.requestedBy?.lastName?.charAt(0) }
                                        </span>
                                    </div>
                                    <span className="text-sm font-[Lato-Regular] text-black/70 truncate">
                                        { req.requestedBy?.firstName } { req.requestedBy?.lastName }
                                    </span>
                                </div>

                                {/* Source operation */}
                                <div className="min-w-0 flex items-center gap-2">
                                    <span className="text-sm font-[Lato-Regular] text-black/70 truncate">
                                        { req.sourceInstance?.title ?? '—' }
                                    </span>
                                    { req.sourceInstance?.code &&
                                        <Badge variant="secondary" className="text-[10px] shrink-0">{ req.sourceInstance.code }</Badge>
                                    }
                                </div>

                                {/* Target blueprint */}
                                <div className="min-w-0 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                    <span className="text-sm font-[Lato-Regular] text-black/70 truncate">
                                        { req.targetBlueprint?.title ?? '—' }
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="text-xs font-[Lato-Regular] text-black/40 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    { format(new Date(req.createdAt), 'dd MMM yyyy') }
                                </div>

                                {/* Status + actions */}
                                <div className="flex items-center justify-end">
                                    { req.status === 'PENDING' ? (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                disabled={actionLoading === req.id}
                                                onClick={() => handleApprove(req)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-[Lato-Bold] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                { actionLoading === req.id
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <CheckCircle2 className="w-3 h-3" />
                                                }
                                                Approve
                                            </button>
                                            <button
                                                disabled={actionLoading === req.id}
                                                onClick={() => { setRejectingId(req.id); setRejectionReason(''); }}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-[Lato-Bold] text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-[Lato-Bold] ring-1 ${STATUS_STYLES[req.status] ?? ''}`}>
                                            { req.status }
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Rejection reason input (inline) */}
                            { rejectingId === req.id && (
                                <div className="px-6 pb-4 flex items-center gap-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Reason for rejection (required)"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleReject(req); if (e.key === 'Escape') { setRejectingId(null); setRejectionReason(''); } }}
                                        className="flex-1 px-3 py-2 text-sm font-[Lato-Regular] border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                                    />
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        disabled={actionLoading === req.id || !rejectionReason.trim()}
                                        onClick={() => handleReject(req)}
                                    >
                                        { actionLoading === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Reject' }
                                    </Button>
                                    <button
                                        onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                                        className="text-xs font-[Lato-Regular] text-black/40 hover:text-black/60 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {/* Show rejection reason for rejected requests */}
                            { req.status === 'REJECTED' && req.rejectionReason && (
                                <div className="px-6 pb-3">
                                    <p className="text-xs font-[Lato-Regular] text-red-500/80">
                                        Reason: { req.rejectionReason }
                                    </p>
                                </div>
                            )}

                            {/* Show optional message from Commercial */}
                            { req.message && (
                                <div className="px-6 pb-3">
                                    <p className="text-xs font-[Lato-Regular] text-black/40 italic">
                                        "{ req.message }"
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyWorkspaceRequestsPanel;
