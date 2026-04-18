import {
	memo,
	type ReactElement
} from "react";
import {
	Handle,
	Position,
	type NodeProps
} from "@xyflow/react";
import {
	ShieldAlert,
	ShieldCheck,
	Upload,
	FileText,
	Copy,
    Link
} from "lucide-react";
import type {
	OperationBlueprintStepInput
} from "@l-ark/types";
import {
	StepType
} from "@l-ark/types";
import {
    getAccentColorStepNode,
    getIconStepNode,
    getIconStyleStepNode,
    getStepNodeLabel,
    getStepNodeNumberBackground,
    getStepNodeStatusDotStyle
} from "../utils/blueprint.utils";

type StepNodeData = OperationBlueprintStepInput & { selected?: boolean; stepIndex?: number };

const StepNodeInner = (props: NodeProps): ReactElement => {
	/** Retrieve component properties */
	const { data, selected } = props;
	/** Retrieve step information from the node */
	const step = data as unknown as StepNodeData;
	/** Calculate the template amount */
	const templateCount = step.fileTemplateConfigs?.length ?? 0;
	/** Analyze if there is any multi fills allowed in this step */
	const hasMultiFill = step.fileTemplateConfigs?.some(c => c.allowMultipleFills) ?? false;
	/** Retrieve the step order */
	const stepNumber = (step.stepIndex ?? 0) + 1;
	/** Analyze if is a special case */
	const isSpecialType = step.stepType && step.stepType !== StepType.STANDARD;
	/** Analyze if there is active badges */
	const hasBadges = step.isBlocking || step.isRequired || step.allowDocumentUpload || step.allowInstanceLink || templateCount > 0 || isSpecialType;
	/** Determine accent color based on step type and priority */
	const accentGradient = getAccentColorStepNode(step.stepType, step.isBlocking, step.isRequired);
	/** Determine the icon style based on step type */
	const iconStyle = getIconStyleStepNode(step.stepType, step.isBlocking, step.isRequired);
	/** Determine the icon based on the step type */
	const StepIcon = getIconStepNode(step.stepType);
	/** Determine the color of the number */
	const numberBg = getStepNodeNumberBackground(step.isBlocking, step.isRequired);
	/** Determine the color of the dot */
	const statusDot = getStepNodeStatusDotStyle(step.isBlocking, step.isRequired);
	/** Determine the label styling */
	const statusLabel = getStepNodeLabel(step.isBlocking, step.isRequired);

	return (
		<div className={`group relative w-56 rounded-xl transition-all duration-200 hover:-translate-y-0.5 ${
			selected
				? "shadow-[0_0_0_2px_rgba(212,175,55,0.4),0_8px_24px_-4px_rgba(212,175,55,0.15)] scale-[1.02]"
				: "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-black/6"
		}`}>
			<div className="relative rounded-xl bg-white overflow-hidden">
				{/* Top accent gradient bar */}
				<div className={`h-1 bg-linear-to-r ${accentGradient}`} />

				{/* Header */}
				<div className="flex items-center gap-2.5 px-3 pt-2.5 pb-2">
					<div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[0.5px] ${iconStyle}`}>
						<StepIcon className="w-3.5 h-3.5" />
					</div>

					<div className="flex-1 min-w-0">
						<h3 className="text-[13px] font-[Lato-Bold] text-black/85 leading-tight truncate">
							{ step.title }
						</h3>
					</div>

					<span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-[Lato-Bold] text-white shrink-0 ${numberBg}`}>
						{ stepNumber }
					</span>
				</div>

				{ step.description &&
					<div className="px-3 pb-2">
						<div className="rounded-md bg-black/2 px-2 py-1.5">
							<p className="text-[10px] font-[Lato-Regular] text-black/45 leading-relaxed line-clamp-2">
								{ step.description }
							</p>
						</div>
					</div>
				}

				{ hasBadges &&
					<div className="px-3 pb-2.5">
						<div className="h-px bg-linear-to-r from-transparent via-black/6 to-transparent mb-2" />
						<div className="flex items-center gap-1 flex-wrap">
							{ isSpecialType &&
								<span className={`inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md border ${
									step.stepType === StepType.CLOSURE ? 'bg-violet-50 text-violet-600 border-violet-200/40'
									: step.stepType === StepType.WAIT_FOR_LINKED ? 'bg-cyan-50 text-cyan-600 border-cyan-200/40'
									: 'bg-teal-50 text-teal-600 border-teal-200/40'
								}`}>
									<StepIcon className="w-2.5 h-2.5" />
									{ step.stepType === StepType.CLOSURE ? 'Closure' : step.stepType === StepType.WAIT_FOR_LINKED ? 'Wait' : step.stepType === StepType.NOTIFICATION ? 'Notification' : step.stepType === StepType.STANDARD ? 'Standard' : 'Open Op.' }
								</span>
							}

							{ step.isBlocking &&
								<span className="inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md bg-red-50 text-red-600 border border-red-200/40">
									<ShieldAlert className="w-2.5 h-2.5" />
									Blocking
								</span>
							}

							{ step.isRequired &&
								<span className="inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/40">
									<ShieldCheck className="w-2.5 h-2.5" />
									Required
								</span>
							}

							{ step.allowDocumentUpload &&
								<span className="inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/40">
									<Upload className="w-2.5 h-2.5" />
									Upload
								</span>
							}

							{ step.allowInstanceLink &&
								<span className="inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md bg-yellow-50 text-yellow-600 border border-yellow-200/40">
									<Link className="w-2.5 h-2.5" />
									Link
								</span>
							}

							{ templateCount > 0 &&
								<span className="inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md bg-blue-50 text-blue-600 border border-blue-200/40">
									<FileText className="w-2.5 h-2.5" />
									{ templateCount } file{ templateCount > 1 ? "s" : "" }
								</span>
							}

							{ hasMultiFill &&
								<span className="inline-flex items-center gap-1 text-[8px] font-[Lato-Bold] px-1.5 py-0.75 rounded-md bg-violet-50 text-violet-600 border border-violet-200/40">
									<Copy className="w-2.5 h-2.5" />
									Multi-fill
								</span>
							}
						</div>
					</div>
				}

				{/* Bottom status bar */}
				<div className="flex items-center justify-between px-3 py-1.5 border-t border-black/4 bg-black/1.5">
					<div className="flex items-center gap-1.5">
						<div className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
						<span className="text-[9px] font-[Lato-Regular] text-black/30">
							{ statusLabel }
						</span>
					</div>
					{ templateCount > 0 &&
						<span className="text-[9px] font-[Lato-Regular] text-black/25">
							{ templateCount } template{ templateCount !== 1 ? "s" : "" }
						</span>
					}
				</div>
			</div>

			{/* Handles */}
			<Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-white border-2 border-[#D4AF37] hover:border-[#FFBF00] -top-1.5 transition-colors rounded-full"/>
			<Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-white border-2 border-[#D4AF37] hover:border-[#FFBF00] -bottom-1.5 transition-colors rounded-full" />
		</div>
	);
};

export const OperationBlueprintStepNode = memo(StepNodeInner);
