import {
    type ReactElement
} from 'react';
import {
    CheckCircle2
} from 'lucide-react';

const InstanceStandardStep = (): ReactElement => {

    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm font-[Lato-Bold] text-black/60"> Review step </p>
            <p className="text-xs font-[Lato-Regular] text-black/30 mt-1 max-w-xs leading-relaxed">
                No forms or documents required. Mark as complete when done.
            </p>
        </div>
    );
}

export default InstanceStandardStep;