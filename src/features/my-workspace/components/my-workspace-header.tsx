import {
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    OperationInstanceStatus
} from '@l-ark/types';
import type {
    FilterStatus
} from '../utils/my-workspace.utils';
import {
    Filter,
    Plus
} from 'lucide-react';
import Button from '../../../shared/components/button';

interface PropTypes {
    filterStatus: FilterStatus;

    setFilterStatus: Dispatch<SetStateAction<FilterStatus>>;
    goToNewInstance: () => void;
}

const MyWorkspaceHeader = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { filterStatus, setFilterStatus, goToNewInstance } = props;

    /** Filter definitions */
    const filterOptions: { label: string; value: FilterStatus }[] = [
        { label: 'All', value: 'ALL' },
        { label: 'Draft', value: OperationInstanceStatus.DRAFT },
        { label: 'Active', value: OperationInstanceStatus.ACTIVE },
        { label: 'Completed', value: OperationInstanceStatus.COMPLETED_READY },
        { label: 'Linked', value: OperationInstanceStatus.LINKED },
        { label: 'Closed', value: OperationInstanceStatus.CLOSED },
        { label: 'Pending Payment', value: OperationInstanceStatus.PENDING_PAYMENT },
        { label: 'Partially Closed', value: OperationInstanceStatus.PARTIALLY_CLOSED },
    ];

    return (
       <div className="sticky top-0 z-10">
            <div className="flex justify-between items-end">
                <div className="max-w-xl">
                    <h1 className="text-4xl font-[Lato-Black] tracking-tight text-black mb-3"> My Workspace </h1>
                    <p className="text-md text-black/50 font-[Lato-Regular] leading-relaxed">
                        Track and manage your operation instances across all workflows.
                    </p>
                </div>
                <Button variant="primary" onClick={goToNewInstance}>
                    <Plus className="w-5 h-5" />
                    New Instance
                </Button>
            </div>

            {/* Filter bar */}
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
        </div>
    );
}

export default MyWorkspaceHeader;