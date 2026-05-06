import {
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    OperationInstanceStatus,
    UserRole
} from '@l-ark/types';
import type {
    FilterStatus
} from '../utils/my-workspace.utils';
import {
    Filter,
    Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../shared/components/button';

type WorkspaceView = 'instances' | 'requests';

interface PropTypes {
    filterStatus: FilterStatus;
    setFilterStatus: Dispatch<SetStateAction<FilterStatus>>;
    goToNewInstance: () => void;
    view: WorkspaceView;
    setView: (v: WorkspaceView) => void;
    user: any;
    pendingCount?: number;
}

const MyWorkspaceHeader = (props: PropTypes): ReactElement => {
    const { filterStatus, setFilterStatus, goToNewInstance, view, setView, user, pendingCount } = props;
    const { t } = useTranslation();

    const canSeeRequests = user?.role?.code === UserRole.DIR || user?.role?.code === UserRole.DG;

    /** Filter definitions */
    const filterOptions: { label: string; value: FilterStatus }[] = [
        { label: t('workspace.filter-all'), value: 'ALL' },
        { label: t('workspace.status-draft'), value: OperationInstanceStatus.DRAFT },
        { label: t('workspace.status-active'), value: OperationInstanceStatus.ACTIVE },
        { label: t('workspace.filter-completed'), value: OperationInstanceStatus.COMPLETED_READY },
        { label: t('workspace.status-linked'), value: OperationInstanceStatus.LINKED },
        { label: t('workspace.status-closed'), value: OperationInstanceStatus.CLOSED },
        { label: t('workspace.status-pending-payment'), value: OperationInstanceStatus.PENDING_PAYMENT },
        { label: t('workspace.status-partially-closed'), value: OperationInstanceStatus.PARTIALLY_CLOSED },
    ];

    return (
       <div className="sticky top-0 z-10">
            <div className="flex justify-between items-end">
                <div className="max-w-xl">
                    <h1 className="text-4xl font-[Lato-Black] tracking-tight text-black mb-3"> { t('workspace.title') } </h1>
                    <p className="text-md text-black/50 font-[Lato-Regular] leading-relaxed">
                        { t('workspace.subtitle') }
                    </p>
                </div>
                { view === 'instances' &&
                    <Button variant="primary" onClick={goToNewInstance}>
                        <Plus className="w-5 h-5" />
                        { t('workspace.new-instance') }
                    </Button>
                }
            </div>

            {/* View tabs for DIR/DG */}
            { canSeeRequests &&
                <div className="flex items-center gap-1 mt-4 border-b border-black/6">
                    <button onClick={() => setView('instances')}
                        className={`px-4 py-2 text-sm font-[Lato-Bold] transition-all duration-200 cursor-pointer border-b-2 -mb-px ${
                            view === 'instances'
                                ? 'border-primary text-black'
                                : 'border-transparent text-black/40 hover:text-black/60'
                        }`}
                    >
                        { t('workspace.operations-tab') }
                    </button>
                    <button onClick={() => setView('requests')}
                        className={`px-4 py-2 text-sm font-[Lato-Bold] transition-all duration-200 cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
                            view === 'requests'
                                ? 'border-primary text-black'
                                : 'border-transparent text-black/40 hover:text-black/60'
                        }`}
                    >
                        { t('workspace.requests-tab') }
                        {(pendingCount ?? 0) > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-[Lato-Bold]">
                                {(pendingCount ?? 0) > 99 ? '99+' : pendingCount}
                            </span>
                        )}
                    </button>
                </div>
            }

            {/* Filter bar — only shown on instances view */}
            { view === 'instances' &&
                <div className="flex items-center gap-2 mt-3">
                    <Filter className="w-4 h-4 text-black/30" />
                    { filterOptions.map((opt) =>
                        <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-[Lato-Bold] transition-all duration-200 cursor-pointer ${
                                filterStatus === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white text-black/50 hover:bg-black/4 border border-black/6'
                            }`}
                        >
                            { opt.label }
                        </button>
                    )}
                </div>
            }
        </div>
    );
}

export default MyWorkspaceHeader;
