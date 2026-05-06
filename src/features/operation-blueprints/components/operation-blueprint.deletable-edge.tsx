import type {
	ReactElement
} from "react";
import {
    useTranslation
} from "react-i18next";
import {
	BaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
	type EdgeProps,
} from "@xyflow/react";
import {
	X,
	GitFork,
	Settings
} from "lucide-react";
import {
    EdgeConditionType
} from '@l-ark/types';

type DeletableEdgeData = {
	onDelete?: (id: string) => void;
	onEdit?: (id: string) => void;
	label?: string;
	conditionType?: string;
	branchSide?: "left" | "right";
};

// Lateral offset applied to the source point so sibling USER_CHOICE edges visibly
// leave from different x positions on the same handle.  44px total gap between siblings.
const BRANCH_SOURCE_OFFSET = 22;
// Slightly higher curvature than the default 0.25 so USER_CHOICE edges have a cleaner arc.
const USER_CHOICE_CURVATURE = 0.35;

export const OperationBlueprintDeletableEdge = (props: EdgeProps): ReactElement => {
	/** Retrieve component properties */
	const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected, data } = props;
    const { t } = useTranslation();
	const edgeData = data as DeletableEdgeData;
	/** Determine the type condition of the edge */
	const isUserChoice = edgeData?.conditionType === EdgeConditionType.USER_CHOICE;
	/**
	 * USER_CHOICE branches should stay on one side (left or right) for the whole path:
	 *   - Leaves the source offset to that side (clear fork at the source)
	 *   - Arrives at the target offset to the same side (clear merge at the target)
	 *
	 * Keeping the same side end-to-end means skip-edges (that jump over an intermediate
	 * node) naturally route *around* that node instead of passing through the middle.
	 */
	const branchSide   = edgeData?.branchSide;
	const sideShift    = branchSide === "left" ? -BRANCH_SOURCE_OFFSET
		: branchSide === "right" ? BRANCH_SOURCE_OFFSET
		: 0;

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX: sourceX + sideShift,
		sourceY,
		sourcePosition,
		targetX: targetX + sideShift,
		targetY,
		targetPosition,
		curvature: isUserChoice ? USER_CHOICE_CURVATURE : 0.25,
	});
	/** Determine the color depending on the type of the condition */
	const edgeColor = isUserChoice ? (selected ? "#8B5CF6" : "#A78BFA") : (selected ? "#FFBF00" : "#D4AF37");
	/** Determine the style of the edge depending on the conditional type */
	const dashArray = isUserChoice ? "6 3" : undefined;

	/** Manage to delete the edge */
	const onDelete = (e: React.MouseEvent): void => {
		e.stopPropagation();
		edgeData?.onDelete?.(id);
	};

	/** Manage to edit the edge*/
	const onEdit = (e: React.MouseEvent): void => {
		e.stopPropagation();
		edgeData?.onEdit?.(id);
	};

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: selected ? 2.5 : 1.5, stroke: edgeColor, strokeDasharray: dashArray }} />
			<EdgeLabelRenderer>
				<div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all" }} className="nodrag nopan flex flex-col items-center gap-1">
					{ edgeData?.label &&
						<div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-[Lato-Bold] shadow-sm border ${
							isUserChoice ? 'bg-violet-50 text-violet-600 border-violet-200/60' : 'bg-white text-black/60 border-black/10'
						}`}>
							{ isUserChoice && <GitFork className="w-2.5 h-2.5" /> }
							{ edgeData.label }
						</div>
					}
					<div className="flex items-center gap-0.5">
						<button
							onClick={onEdit}
							className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-500 hover:scale-110 text-black/40"
							title={ t('edge.edit-connection') }
						>
							<Settings className="w-2.5 h-2.5" />
						</button>
						<button
							onClick={onDelete}
							className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:bg-red-50 hover:border-red-300 hover:text-red-500 hover:scale-110 text-black/40"
							title={ t('edge.remove-connection') }
						>
							<X className="w-2.5 h-2.5" />
						</button>
					</div>
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
