import {
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    EdgeConditionType,
    type OperationBlueprintStepEdgeInput
} from '@l-ark/types';
import {
    ArrowRight,
    GitFork,
    X
} from 'lucide-react';
import Button from '../../../shared/components/button';

interface PropTypes {
    edge: OperationBlueprintStepEdgeInput;
    sourceTitle: string;
    targetTitle: string;
    
    onUpdate: (id: string, patch: Partial<OperationBlueprintStepEdgeInput>) => void;
    onClose: Dispatch<SetStateAction<string | null>>;
}

const OperationBlueprintEdgeConfigurationPanel = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { edge, sourceTitle, targetTitle, onUpdate, onClose } = props;
    /** Conditional Types */
	const conditionalTypes: { value: EdgeConditionType, label: string, description: string }[] = [
		{ value: EdgeConditionType.ALWAYS, label: 'Always', description: 'Flow continues automatically' },
		{ value: EdgeConditionType.USER_CHOICE, label: 'User Choice', description: 'User selects this branch' }
	];

    return (
        <div className="w-72 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
						<GitFork className="w-3 h-3 text-violet-600" />
					</div>
					<h3 className="text-sm font-[Lato-Bold] text-black/80"> Connection Settings </h3>
				</div>
				<button onClick={() => onClose(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-black/30 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
					<X className="w-3.5 h-3.5" />
				</button>
			</div>

			{/* Body */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				<div className="flex items-center gap-2 p-2.5 bg-[#F8F9FA] rounded-lg text-xs font-[Lato-Regular] text-black/50">
					<span className="truncate font-[Lato-Bold] text-black/60"> { sourceTitle } </span>
					<ArrowRight className="w-3 h-3 shrink-0 text-black/30" />
					<span className="truncate font-[Lato-Bold] text-black/60"> { targetTitle } </span>
				</div>

				{/* Condition Type */}
				<div className="space-y-2">
					<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Condition Type </label>
					<div className="grid grid-cols-2 gap-2 mt-3">
						{ conditionalTypes.map(({ value, label, description }) => (
							<button key={value} onClick={() => onUpdate(edge.id, { conditionType: value })}
								className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
									edge.conditionType === value
										? 'border-violet-400 bg-violet-50/50 ring-2 ring-violet-400/20'
										: 'border-black/8 bg-white hover:border-black/15'
								}`}
							>
								<p className="text-xs font-[Lato-Bold] text-black/70"> { label } </p>
								<p className="text-[10px] font-[Lato-Regular] text-black/40 mt-0.5 leading-relaxed"> { description } </p>
							</button>
						))}
					</div>
				</div>

				{/* Label — only relevant for USER_CHOICE */}
				<div className="space-y-2">
					<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest">
						Label { edge.conditionType !== EdgeConditionType.USER_CHOICE && <span className="normal-case text-black/25 ml-1"> ( shown for user choice ) </span> }
					</label>
					<input
						type="text"
						value={edge.label ?? ''}
						placeholder="e.g. Approved, Rejected..."
						onChange={e => onUpdate(edge.id, { label: e.target.value || undefined })}
						className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-[Lato-Regular] text-black/70 placeholder:text-black/25 focus:outline-none focus:border-violet-400 transition-colors"
					/>
				</div>
			</div>

			{/* Footer */}
			<div className="px-4 py-3 border-t border-black/6">
				<Button variant="primary" size="md" className="w-full" onClick={() => onClose(null) }>
					Update information
				</Button>
			</div>
		</div>
    );
}

export default OperationBlueprintEdgeConfigurationPanel;