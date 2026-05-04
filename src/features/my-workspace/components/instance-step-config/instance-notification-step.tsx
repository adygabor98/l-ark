import {
    type ReactElement
} from 'react';
import {
    Bell,
    CheckCircle2,
    Circle
} from 'lucide-react';
import {
    useWorkspaceInstanceContext
} from '../../context/workspace-instance.context';
import {
    useOperationInstance
} from '../../../../server/hooks/useOperationInstance';

interface PropTypes {
    isReadOnly: boolean;
}

const InstanceNotificationStep = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { isReadOnly } = props;
    /** My workspace utilities */
    const { selectedStepInstance, selectedBlueprintStep, refreshInstance } = useWorkspaceInstanceContext();
    /** Operation instance api utilities */
    const { updateStepInstance } = useOperationInstance();

    if( !selectedBlueprintStep || !selectedStepInstance ) {
        return <></>;
    }

    /** Manage to mark a person as notified */
    const onMarkAsNotified = async (isNotified: boolean, person: string): Promise<void> => {
        if ( isReadOnly ) {
            return;
        }

        const current: string[] = selectedStepInstance.notifiedPersons ?? [];
        const updated = isNotified ? current.filter(x => x !== person) : [...current, person];

        await updateStepInstance({ id: selectedStepInstance.id, input: { notifiedPersons: updated } });
        await refreshInstance();
    }

    return (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
            <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-[Lato-Bold] text-amber-700"> Notification Checklist </p>
                <span className="text-[9px] font-[Lato-Regular] text-amber-500/70 ml-auto">
                    { (selectedStepInstance.notifiedPersons ?? []).length } / { selectedBlueprintStep.notificationPersons.length } confirmed
                </span>
            </div>
            <div className="space-y-1">
                { selectedBlueprintStep.notificationPersons.map((person: string) => {
                    const isNotified = ((selectedStepInstance as any).notifiedPersons ?? []).includes(person);

                    return (
                        <button key={person} disabled={isReadOnly} onClick={() => onMarkAsNotified(isNotified, person)}
                            className={`w-full flex items-center gap-2 text-left rounded-lg px-2.5 py-2 transition-colors ${!isReadOnly ? "hover:bg-amber-100/60 cursor-pointer" : "cursor-default"} ${isNotified ? "bg-amber-100/40" : ""}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className="text-xs font-[Lato-Regular] text-amber-700 flex-1"> { person } </span>
                            { isNotified ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-black/20 shrink-0" /> }
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default InstanceNotificationStep;