import {
    type ReactElement
} from 'react';
import {
    ChevronDown,
    ChevronLeft,
    Rocket,
    Save,
    Trash2Icon
} from 'lucide-react';
import type { OperationBlueprintVersionInfo } from '@l-ark/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../shared/components/dropdown-button';
import {
    useToast
} from '../../../shared/hooks/useToast';
import Button from '../../../shared/components/button';
import PermissionGate from '../../../shared/components/permission-gate';

interface PropTypes {
    operationId: number;
    latestVersion?: OperationBlueprintVersionInfo | null;
    title: string;
    description: string
    onBack: () => void;
    onDelete: () => void;
    onPublish: () => void;
    handleSaveDraft: () => void;
}

const OperationBlueprintHeader = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { title, description, operationId, latestVersion, onBack, handleSaveDraft, onPublish, onDelete } = props;
    /** Toast utilities */
    const { onConfirmationToast } = useToast();

    /** Manage to confirm the deletion of a blueprint */
    const handleDeletion = async (): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: 'Delete this operation?',
            description: 'This will permanently delete the operation and all its steps.',
            actionText: 'Delete',
            cancelText: 'Cancel',
            actionColor: 'error',
        });
        if ( confirmed ) {
            onDelete();
        }
    }
    return (
       <header className="min-h-20 flex items-center justify-between bg-white rounded-lg pr-4 shadow-sm z-20 shrink-0 sticky top-0 mb-5">
            <div className="flex items-center gap-2">
                <Button variant="icon" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-md font-[Lato-Bold]"> { title } </span>
                        { latestVersion &&
                            <span className={`text-[10px] font-[Lato-Bold] uppercase tracking-wide px-2 py-0.5 rounded-full ${ latestVersion.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : latestVersion.status === 'DEPRECATED' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700' }`}>
                                v{ latestVersion.versionNumber } &middot; { latestVersion.status }
                            </span>
                        }
                    </div>
                    <span className="text-xs font-[Lato-Light] line-clamp-1 max-w-50"> { description } </span>
                </div>
            </div>

            <div className="flex items-center justify-end flex-wrap gap-3">
                <Button variant="primary" onClick={onPublish}>
                    <Rocket className="w-4 h-4" />
                    Publish
                </Button>

                <div className="flex items-center">
                    <Button variant="secondary" onClick={handleSaveDraft} className="rounded-r-none border-r-0">
                        <Save className="w-4 h-4" />
                        Save Draft
                    </Button>
                    { operationId &&
                        <PermissionGate permissions="operations.permanent_delete">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button onClick={handleSaveDraft} className="h-9.5 px-1.5 bg-secondary text-secondary-foreground border border-border/60 border-l-border/30 rounded-r-sm hover:bg-secondary/70 transition-colors cursor-pointer flex items-center">
                                        <ChevronDown className="w-3.5 h-3.5 text-black/40" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                    <DropdownMenuItem className="rounded-lg cursor-pointer p-2.5 gap-2 text-destructive focus:text-destructive" onClick={handleDeletion}>
                                        <Trash2Icon className="w-4 h-4" />
                                        Delete Operation
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </PermissionGate>
                    }
                </div>
            </div>
        </header>
    );
}

export default OperationBlueprintHeader;