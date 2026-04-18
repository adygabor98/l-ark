import {
    type ReactElement
} from 'react';
import { Badge } from '../../../shared/components/badge';
import type { OperationBlueprintStepInput } from '@l-ark/types';
import Button from '../../../shared/components/button';
import { Plus, Workflow } from 'lucide-react';

interface PropTypes {
    steps: OperationBlueprintStepInput[];
    selectedStepId: string | null;
    
    handleAddStep: () => void;
    setSelectedStepId: (id: string) => void;
}

const OperationBlueprintStepList = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { steps, selectedStepId, handleAddStep, setSelectedStepId } = props;

    const renderStep = (step: OperationBlueprintStepInput, idx: number, isSelected: boolean, accentColor: string): ReactElement => (
        <button key={step.id} onClick={() => setSelectedStepId(step.id)}
            className={`w-full text-left rounded-md transition-all duration-200 cursor-pointer group overflow-hidden ${
                isSelected ? "bg-primary-foreground/10 ring-1 ring-amber-300/60 shadow-sm" : "hover:bg-black/2 ring-1 ring-transparent hover:ring-black/4"
            }`}
        >
            <div className="flex">
                <div className={`w-1 shrink-0 rounded-l-xl ${isSelected ? accentColor : "bg-black/6 group-hover:bg-black/10"} transition-colors`} />

                <div className="flex-1 min-w-0 px-2.5 py-2">
                    <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-[Lato-Bold] transition-all ${
                            isSelected ? "bg-[#FFBF00] text-neutral-800 shadow-sm" : "bg-black/5 text-black/40 group-hover:bg-black/8 group-hover:text-black/60"
                        }`}>
                            { idx + 1 }
                        </span>
                        <span className={`text-[13px] font-[Lato-Bold] truncate transition-colors ${ isSelected ? "text-black/90" : "text-black/70 group-hover:text-black/80" }`}>
                            { step.title || "Untitled" }
                        </span>
                    </div>

                    { step.description &&
                        <p className="mt-0.5 ml-7 text-[10px] font-[Lato-Regular] text-black/35 truncate leading-snug">
                            { step.description }
                        </p>
                    }

                    <div className="mt-1.5 ml-7 flex items-center justify-between gap-2">
                        <div className="flex gap-1 flex-wrap">
                            { step.isBlocking &&
                                <span className="text-[8px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-red-50 text-red-600 border border-red-200/50"> Blocking </span>
                            }
                            { step.isRequired &&
                                <span className="text-[8px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/50"> Required </span>
                            }
                            { step.allowDocumentUpload &&
                                <span className="text-[8px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50"> Upload </span>
                            }
                            { step.allowInstanceLink &&
                                <span className="text-[8px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200/50"> Link </span>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );

    return (
        <div className="w-60 shrink-0 flex flex-col bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-black/6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Steps </h2>
                        { steps.length > 0 &&
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0"> { steps.length } </Badge>
                        }
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleAddStep}>
                        <Plus className="w-3.5 h-3.5" />
                        Add
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                { steps.length === 0 ?
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-10 h-10 bg-black/3 rounded-xl flex items-center justify-center mb-3">
                            <Workflow className="w-5 h-5 text-black/20" />
                        </div>
                        <p className="text-[11px] font-[Lato-Regular] text-black/40 mb-2"> No steps yet </p>
                        <Button variant='ghost' onClick={handleAddStep}>
                            Add your first step
                        </Button>
                    </div>
                :
                    <div className="space-y-1.5">
                        { steps.map((step: OperationBlueprintStepInput, idx: number) => {
                            const isSelected = step.id === selectedStepId;
                            const accentColor = step.isBlocking ? "bg-red-400" : step.isRequired ? "bg-indigo-400" : "bg-[#FFBF00]";

                            return renderStep(step, idx, isSelected, accentColor);
                        })}
                    </div>
                }
            </div>
        </div>
    );
}

export default OperationBlueprintStepList;