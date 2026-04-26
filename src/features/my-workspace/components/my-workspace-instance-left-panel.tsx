import {
    type ReactElement
} from 'react';
import {
    ArrowLeft,
    Check,
    Inbox
} from 'lucide-react';
import Button from '../../../shared/components/button';

interface PropTypes {
    goBack: () => void;
}

const MyWorkspaceInstanceLeftPanel = (props: PropTypes): ReactElement => {
    /** retrieve component properties */
    const { goBack } = props;
    /** Features definition */
    const features: string[] = [
        'Select an operation blueprint to base your instance on',
        'Choose the office this instance belongs to',
        'Work through each step, uploading documents and filling templates',
        'Request global operations when prerequisites are met'
    ]

    return (
        <div className="px-6 py-3 lg:px-12 overflow-y-auto w-full md:w-62.5 lg:w-87.5 shrink-0 flex flex-col justify-between text-white relative animate-in rounded-md slide-in-from-left duration-500 bg-[#FFBF00]">
            <div>
                <Button variant="ghost" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="flex md:block items-center gap-4">
                    <div className="bg-white/20 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-0 md:mb-6 backdrop-blur-md border border-white/10 shadow-xl shrink-0">
                        <Inbox className="w-6 h-6 md:w-8 md:h-8 text-neutral-700" />
                    </div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-[Lato-Black] md:mb-4 tracking-tight text-neutral-700"> New Instance </h1>
                </div>
                <p className="hidden md:block text-neutral-700 font-[Lato-Regular] text-base leading-relaxed mb-8">
                    Start a new operation instance by selecting a blueprint and assigning it to an office.
                </p>

                <div className="hidden md:block space-y-4">
                    <h3 className="text-xs font-[Lato-Bold] uppercase text-neutral-700 mb-4"> How it works </h3>
                    { features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-5 text-neutral-700">
                            <div className="p-1 rounded-full bg-white/20 flex items-center justify-center">
                                <Check className="w-3! h-3!" />
                            </div>
                            <span className="text-sm font-[Lato-Regular]"> { feature } </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MyWorkspaceInstanceLeftPanel;