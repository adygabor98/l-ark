import {
	useCallback
} from "react";
import dagre from "@dagrejs/dagre";
import {
	StepType
} from "@l-ark/types";

// Node rendered width (matches w-56 in StepNode)
const NODE_WIDTH = 224;

// Height building blocks derived from StepNode CSS (px)
const H_ACCENT     = 4;   // h-1 top accent bar
const H_HEADER     = 46;  // pt-2.5 (10) + h-7 icon (28) + pb-2 (8)
const H_STATUS     = 28;  // py-1.5 (12) + content (~16)
const H_BUFFER     = 12;  // safety margin against sub-pixel rounding
const H_DESC       = 53;  // pb-2 (8) + inner py-1.5 (12) + 2 clamped lines at 10px/1.625 leading (~33)
const H_BADGE_BASE = 20;  // divider h-px + mb-2 (9) + section pb-2.5 (10) — overhead when badges exist
const H_BADGE_ROW  = 20;  // badge height (16) + flex row gap (4)
const BADGES_PER_ROW = 3; // ~3 badges fit in 200px content width at 8px font

// Graph spacing (px)
const RANKSEP           = 100; // vertical tier gap
const NODESEP_DEFAULT   = 60;  // horizontal gap between linear siblings
const NODESEP_BRANCHING = 100; // gap (edge-to-edge) between USER_CHOICE branches

// Default height for virtual padding nodes when the corresponding real height is unknown
const VIRTUAL_NODE_DEFAULT_HEIGHT = 150;

const VIRTUAL_PREFIX = "__virt__";

function countBadges(step: any): number {
	const templateCount = step.fileTemplateConfigs?.length ?? 0;
	const hasMultiFill  = step.fileTemplateConfigs?.some((c: any) => c.allowMultipleFills) ?? false;
	const isSpecialType = step.stepType && step.stepType !== StepType.STANDARD;

	return [
		isSpecialType,
		step.isBlocking,
		step.isRequired,
		step.allowDocumentUpload,
		step.allowInstanceLink,
		templateCount > 0,
		hasMultiFill,
	].filter(Boolean).length;
}

function estimateNodeHeight(step: any): number {
	let height = H_ACCENT + H_HEADER + H_STATUS + H_BUFFER;

	if (step.description?.trim()) {
		height += H_DESC;
	}

	const badgeCount = countBadges(step);
	if (badgeCount > 0) {
		const rows = Math.ceil(badgeCount / BADGES_PER_ROW);
		height += H_BADGE_BASE + rows * H_BADGE_ROW;
	}

	return height;
}

type LayoutEdge = { source: string; target: string };
type VirtualNode = { id: string; height: number };

/**
 * Walk a single linear branch starting at `start` until the path either
 * forks (multiple outgoing edges), terminates (no outgoing), or hits a merge
 * node (multiple incoming). Returns the visited intermediate nodes (excluding
 * the merge itself) and the merge node, if any.
 *
 * If `start` is itself a merge node, the branch is treated as direct (the
 * source connected straight to the merge with no intermediates).
 */
function walkLinearBranch(
	start: string,
	childMap: Map<string, string[]>,
	incomingCount: Map<string, number>
): { path: string[]; merge: string | null } {
	if ((incomingCount.get(start) ?? 0) > 1) {
		return { path: [], merge: start };
	}

	const path: string[] = [start];
	let current = start;
	while (true) {
		const out = childMap.get(current) ?? [];
		if (out.length !== 1) {
			return { path, merge: null };
		}
		const next = out[0];
		if ((incomingCount.get(next) ?? 0) > 1) {
			return { path, merge: next };
		}
		path.push(next);
		current = next;
	}
}

/**
 * Detect USER_CHOICE forks (a node with ≥2 USER_CHOICE outgoing edges that
 * converge on a common merge target) and pad shorter branches with virtual
 * placeholder nodes so dagre treats both branches symmetrically.
 *
 * Why: when one branch has intermediate steps and the sibling branch goes
 * straight from source to merge, dagre allocates no horizontal lane for the
 * direct edge. Its bezier collapses near the central axis and overlaps with
 * the populated branch. Padding keeps both branches at the same rank depth
 * so dagre reserves equal horizontal space for each.
 *
 * The original visible edges are returned untouched; only the dagre input
 * graph swaps the direct branch→merge connection for a chain through the
 * virtual nodes. The bezier still draws source→merge directly.
 */
function buildSymmetricLayout(
	edges: any[],
	heightMap: Map<string, number>
): { virtualNodes: VirtualNode[]; layoutEdges: LayoutEdge[] } {
	const childMap = new Map<string, string[]>();
	const incomingCount = new Map<string, number>();
	edges.forEach((e) => {
		if (!childMap.has(e.source)) childMap.set(e.source, []);
		childMap.get(e.source)!.push(e.target);
		incomingCount.set(e.target, (incomingCount.get(e.target) ?? 0) + 1);
	});

	const forks = new Map<string, any[]>();
	edges.forEach((e) => {
		if (e.conditionType !== "USER_CHOICE") return;
		if (!forks.has(e.source)) forks.set(e.source, []);
		forks.get(e.source)!.push(e);
	});

	const virtualNodes: VirtualNode[] = [];
	const removedKeys = new Set<string>();
	const extraEdges: LayoutEdge[] = [];

	for (const [forkSource, forkEdges] of forks) {
		if (forkEdges.length < 2) continue;

		const branches = forkEdges.map((fe) => walkLinearBranch(fe.target, childMap, incomingCount));

		const merge = branches[0].merge;
		if (!merge || !branches.every((b) => b.merge === merge)) continue;

		const maxLen = Math.max(...branches.map((b) => b.path.length));
		const longest = branches.find((b) => b.path.length === maxLen)!;

		branches.forEach((branch, branchIdx) => {
			const padding = maxLen - branch.path.length;
			if (padding === 0) return;

			const lastNode = branch.path.length > 0
				? branch.path[branch.path.length - 1]
				: forkSource;

			removedKeys.add(`${lastNode}->${merge}`);

			let prev = lastNode;
			for (let i = 0; i < padding; i++) {
				const correspondingIdx = branch.path.length + i;
				const correspondingNode = longest.path[correspondingIdx];
				const height = correspondingNode
					? heightMap.get(correspondingNode) ?? VIRTUAL_NODE_DEFAULT_HEIGHT
					: VIRTUAL_NODE_DEFAULT_HEIGHT;

				const vid = `${VIRTUAL_PREFIX}${forkSource}_${branchIdx}_${i}`;
				virtualNodes.push({ id: vid, height });
				extraEdges.push({ source: prev, target: vid });
				prev = vid;
			}
			extraEdges.push({ source: prev, target: merge });
		});
	}

	const layoutEdges: LayoutEdge[] = [];
	edges.forEach((e) => {
		if (removedKeys.has(`${e.source}->${e.target}`)) return;
		layoutEdges.push({ source: e.source, target: e.target });
	});
	layoutEdges.push(...extraEdges);

	return { virtualNodes, layoutEdges };
}

export const useAutoLayout = () => {
	const getLayoutedElements = useCallback(
		(steps: any[], edges: any[]): { steps: any[]; edges: any[] } => {
			const g = new dagre.graphlib.Graph();
			g.setDefaultEdgeLabel(() => ({}));

			const hasBranching = edges.some((e) => e.conditionType === "USER_CHOICE");
			const nodesep = hasBranching ? NODESEP_BRANCHING : NODESEP_DEFAULT;

			g.setGraph({ rankdir: "TB", ranksep: RANKSEP, nodesep });

			const heightMap = new Map<string, number>();

			steps.forEach((step) => {
				const height = estimateNodeHeight(step);
				heightMap.set(step.id, height);
				g.setNode(step.id, { width: NODE_WIDTH, height });
			});

			const { virtualNodes, layoutEdges } = buildSymmetricLayout(edges, heightMap);

			virtualNodes.forEach((v) => {
				g.setNode(v.id, { width: NODE_WIDTH, height: v.height });
			});

			layoutEdges.forEach((e) => {
				g.setEdge(e.source, e.target);
			});

			dagre.layout(g);

			const layoutedSteps = steps.map((step) => {
				const node   = g.node(step.id);
				const height = heightMap.get(step.id)!;
				return {
					...step,
					position: {
						x: node.x - NODE_WIDTH / 2,
						y: node.y - height / 2,
					},
				};
			});

			return { steps: layoutedSteps, edges };
		},
		[]
	);

	return { getLayoutedElements };
};
