import { memo, type ReactElement } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "../../components/ui/badge";
import type { Step } from "../../types/operation";

type StepNodeData = Step & { selected?: boolean };

const StepNodeInner = ({ data, selected }: NodeProps): ReactElement => {
	const step = data as unknown as StepNodeData;
	const templateCount = step.fileTemplateIds?.length ?? 0;

	return (
		<div
			className={`group relative w-50 rounded-lg bg-white transition-all duration-200 hover:-translate-y-px ${
				selected
					? "shadow-[0_0_0_1.5px_rgba(79,70,229,0.5),0_4px_12px_-2px_rgba(79,70,229,0.12)]"
					: "shadow-sm hover:shadow-md border border-border/50"
			}`}
		>
			{/* Thin top accent */}
			<div className={`h-0.75 rounded-t-lg ${ step.isBlocking ? "bg-linear-to-r from-amber-400 to-orange-400" : "bg-linear-to-r from-primary-500 to-primary-400"}`} />

			<Handle type="target" position={Position.Top}
				className="w-2 h-2 bg-white border-[1.5px] border-primary-300 hover:border-primary-500 -top-1 transition-colors"
			/>

			<div className="px-2.5 py-2">
				<h3 className="text-[13px] font-medium text-text leading-snug truncate">
					{ step.title || "Untitled Step" }
				</h3>

				{ step.description &&
					<p className="mt-0.5 text-[11px] text-text-secondary leading-snug line-clamp-2">
						{ step.description }
					</p>
				}

				{ (step.isBlocking || step.isRequired || templateCount > 0) &&
					<div className="mt-1.5 flex items-center gap-1 flex-wrap">
						{ step.isBlocking && <Badge variant="blocking"> Blocking </Badge> }
						{ step.isRequired && <Badge variant="required"> Required </Badge> }
						{ templateCount > 0 &&
							<Badge variant="info">
								{ templateCount } file { templateCount > 1 ? "s" : "" }
							</Badge>
						}
					</div>
				}
			</div>

			<Handle type="source" position={Position.Bottom}
				className="w-2 h-2 bg-white border-[1.5px] border-primary-300 hover:border-primary-500 -bottom-1 transition-colors"
			/>
		</div>
	);
}

export const StepNode = memo(StepNodeInner);
