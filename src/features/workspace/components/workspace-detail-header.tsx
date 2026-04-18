import {
    type ReactElement
} from 'react'
import {
    ChevronLeft,
    Lock
} from 'lucide-react';
import {
    useNavigate
} from 'react-router-dom';
import {
    Badge
} from '../../../shared/components/badge';
import Button from '../../../shared/components/button';
import { INSTANCE_STATUS_COLORS } from '../workspace.constants';

interface PropTypes {
    instance: any;
    isReadOnly: boolean;
    progress: { completed: number, total: number };
    progressPct: number;
    allStepsCompleted: boolean;
}

const WorkspaceDetailHeader = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { instance, isReadOnly, progress, progressPct, allStepsCompleted } = props;
    /** Navigation utilities */
    const navigate = useNavigate();

    return (
        <header className="min-h-20 flex items-center justify-between bg-white rounded-lg pr-4 shadow-sm z-20 shrink-0 sticky top-0 mb-3">
            <div className="flex items-center gap-2">
                <Button variant="icon" onClick={() => navigate('/workspace')}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-md font-[Lato-Bold]"> { instance.title || 'Untitled Instance' } </span>
                        <Badge variant="secondary" className="text-[10px] font-[Lato-Bold]"> { instance.code } </Badge>
                        { (() => {
                            const colors = INSTANCE_STATUS_COLORS[instance.status as keyof typeof INSTANCE_STATUS_COLORS];
                            if (!colors) return null;
                            return (
                                <span className={`text-[10px] font-[Lato-Bold] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                                    { instance.status.replace(/_/g, ' ') }
                                </span>
                            );
                        })() }
                        { isReadOnly &&
                            <div className="flex items-center gap-1 text-amber-600">
                                <Lock className="w-3 h-3" />
                                <span className="text-[10px] font-[Lato-Bold]" >Read-only </span>
                            </div>
                        }
                    </div>
                    <span className="text-xs font-[Lato-Light] line-clamp-1 max-w-80"> { instance.description || 'No description' } </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-black/30 font-[Lato-Regular]">
                                { progress.completed } / { progress.total } steps
                            </span>
                            <span className="text-[10px] text-black/30 font-[Lato-Bold]">
                                { Math.round(progressPct) }%
                            </span>
                        </div>
                        <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${allStepsCompleted ? 'bg-emerald-500' : 'bg-linear-to-r from-[#FFBF00] to-[#D4AF37]'}`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default WorkspaceDetailHeader;