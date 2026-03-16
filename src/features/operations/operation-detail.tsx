import { useCallback, useState, type ReactElement } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
	useOperationState,
	useOperationDispatch,
} from "./hooks/use-operation";
import { useAutoLayout } from "./hooks/use-auto-layout";
import OperationForm from "./components/operation/operation-form";
import { FlowEditor } from "./components/flow/flow-editor";
import StepConfigPanel from "./components/flow/step-config-panel";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import type { Operation, Step, StepEdge } from "./types/operation";

const OperationDetail = (): ReactElement | null => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { operations } = useOperationState();
	const dispatch = useOperationDispatch();
	const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

	const isNew = !id;
	const [newOpId] = useState(() => uuid());
	const operationId = id ?? newOpId;

	// Create new operation on first render if needed
	const operation = operations.find((op) => op.id === operationId);
	if (!operation && isNew) {
		const newOp: Operation = {
			id: operationId,
			title: "",
			description: "",
			divisionId: "",
			steps: [],
			edges: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		dispatch({ type: "CREATE_OPERATION", payload: newOp });
		return null; // Re-render will pick up the new operation
	}

	if (!operation) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 animate-fade-in-up">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
					<span className="text-3xl">🔍</span>
				</div>
				<p className="text-base font-medium text-text-secondary">Operation not found</p>
				<Button variant="secondary" onClick={() => navigate("/")}>
					Back to list
				</Button>
			</div>
		);
	}

	const selectedStep = selectedStepId
		? operation.steps.find((s) => s.id === selectedStepId) ?? null
		: null;

	return (
		<OperationEditorInner
			operation={operation}
			selectedStep={selectedStep}
			selectedStepId={selectedStepId}
			setSelectedStepId={setSelectedStepId}
			dispatch={dispatch}
			navigate={navigate}
		/>
	);
}

export default OperationDetail;

// Extracted to a separate component to avoid hook-after-return issues
function OperationEditorInner({
	operation,
	selectedStep,
	selectedStepId,
	setSelectedStepId,
	dispatch,
	navigate,
}: {
	operation: Operation;
	selectedStep: Step | null;
	selectedStepId: string | null;
	setSelectedStepId: (id: string | null) => void;
	dispatch: ReturnType<typeof useOperationDispatch>;
	navigate: ReturnType<typeof useNavigate>;
}) {
	const { getLayoutedElements } = useAutoLayout();

	const onFormChange = useCallback(
		(field: string, value: string) => {
			dispatch({
				type: "UPDATE_OPERATION",
				payload: { id: operation.id, updates: { [field]: value } },
			});
		},
		[dispatch, operation.id]
	);

	const onStepsChange = useCallback(
		(steps: Step[], edges: StepEdge[]) => {
			dispatch({
				type: "UPDATE_STEPS_AND_EDGES",
				payload: { operationId: operation.id, steps, edges },
			});
		},
		[dispatch, operation.id]
	);

	const onStepUpdate = useCallback(
		(updates: Partial<Omit<Step, "id">>) => {
			if (!selectedStepId) return;
			dispatch({
				type: "UPDATE_STEP",
				payload: { operationId: operation.id, stepId: selectedStepId, updates },
			});
		},
		[dispatch, operation.id, selectedStepId]
	);

	const onStepDelete = useCallback(() => {
		if (!selectedStepId) return;
		dispatch({
			type: "DELETE_STEP",
			payload: { operationId: operation.id, stepId: selectedStepId },
		});
		setSelectedStepId(null);
	}, [dispatch, operation.id, selectedStepId, setSelectedStepId]);

	const addStep = useCallback(() => {
		const newStep: Step = {
			id: uuid(),
			title: "New Step",
			description: "",
			isBlocking: false,
			isRequired: false,
			fileTemplateIds: [],
			position: { x: 250, y: operation.steps.length * 150 },
		};
		const newSteps = [...operation.steps, newStep];
		// Auto-connect to last step so dagre lays them out vertically
		const lastStep = operation.steps[operation.steps.length - 1];
		const newEdges = lastStep
			? [
					...operation.edges,
					{ id: `e-${lastStep.id}-${newStep.id}`, source: lastStep.id, target: newStep.id },
				]
			: [...operation.edges];
		const { steps: layouted, edges: layoutedEdges } = getLayoutedElements(newSteps, newEdges);
		dispatch({
			type: "UPDATE_STEPS_AND_EDGES",
			payload: { operationId: operation.id, steps: layouted, edges: layoutedEdges },
		});
		setSelectedStepId(newStep.id);
	}, [operation, getLayoutedElements, dispatch, setSelectedStepId]);

	return (
		<div className="flex h-screen flex-col bg-[#f8fafc]">
			{/* ── Top Bar ── */}
			<div className="flex items-center justify-between px-5 py-2.5 shrink-0 z-10 animate-fade-in">
				<div className="flex items-center gap-2.5">
					<button
						onClick={() => navigate("/operations")}
						className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 cursor-pointer"
						aria-label="Back"
					>
						<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M10 12L6 8l4-4" />
						</svg>
					</button>
					<div className="flex items-center gap-1.5 text-sm">
						<button
							onClick={() => navigate("/operations")}
							className="text-text-muted hover:text-primary-600 transition-colors cursor-pointer"
						>
							Operations
						</button>
						<span className="text-text-muted/40">/</span>
						<span className="font-semibold text-text truncate max-w-xs">
							{operation.title || "New Operation"}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 text-[11px] text-text-muted">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
						Saved
					</div>
					<Button variant="ghost" size="sm" onClick={() => navigate("/")}>
						Back to list
					</Button>
				</div>
			</div>

			{/* ── 3-panel layout with gaps ── */}
			<div className="flex flex-1 min-h-0 gap-3 px-4 pb-4">
				{/* ── Left Sidebar ── */}
				<div className="w-68 shrink-0 flex flex-col rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden animate-slide-in-left">
					<div className="flex-1 overflow-y-auto p-4 space-y-5">
						{/* Configuration section */}
						<div>
							<div className="flex items-center gap-2 mb-2.5">
								<div className="h-3.5 w-0.5 rounded-full bg-primary-500" />
								<h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
									Configuration
								</h2>
							</div>
							<OperationForm
								title={operation.title}
								description={operation.description}
								divisionId={operation.divisionId}
								onChange={onFormChange}
							/>
						</div>

						{/* Steps list section */}
						<div>
							<div className="flex items-center justify-between mb-2.5">
								<div className="flex items-center gap-2">
									<div className="h-3.5 w-0.5 rounded-full bg-primary-500" />
									<h2 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
										Steps
									</h2>
									{operation.steps.length > 0 && (
										<span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-50 px-1 text-[9px] font-bold text-primary-700">
											{operation.steps.length}
										</span>
									)}
								</div>
								<Button size="sm" onClick={addStep}>
									<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
										<path d="M6 2v8M2 6h8" />
									</svg>
									Add
								</Button>
							</div>

							{operation.steps.length === 0 ? (
								<div className="rounded-xl border border-dashed border-primary-200/50 p-4 text-center">
									<div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
										<span className="text-sm">📝</span>
									</div>
									<p className="text-[11px] font-medium text-text-muted">No steps yet</p>
									<button
										onClick={addStep}
										className="mt-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer transition-colors"
									>
										Add your first step
									</button>
								</div>
							) : (
								<div className="space-y-1">
									{operation.steps.map((step, idx) => (
										<button
											key={step.id}
											onClick={() => setSelectedStepId(step.id)}
											className={`w-full text-left rounded-lg px-2.5 py-2 transition-all duration-150 cursor-pointer group ${
												step.id === selectedStepId
													? "bg-primary-50/70 border border-primary-200/50 shadow-xs"
													: "hover:bg-surface-hover border border-transparent"
											}`}
										>
											<div className="flex items-center gap-2">
												<span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold transition-all ${
													step.id === selectedStepId
														? "bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-sm"
														: "bg-primary-50 text-primary-700 group-hover:bg-primary-100"
												}`}>
													{idx + 1}
												</span>
												<span className="text-[13px] font-medium text-text truncate">
													{step.title || "Untitled"}
												</span>
											</div>
											{(step.isBlocking || step.isRequired) && (
												<div className="mt-1 ml-7 flex gap-1">
													{step.isBlocking && <Badge variant="blocking">Blocking</Badge>}
													{step.isRequired && <Badge variant="required">Required</Badge>}
												</div>
											)}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* ── Center — Flow Editor ── */}
				<div className="flex-1 min-w-0 relative rounded-2xl overflow-hidden">
					<div className="absolute inset-0">
						<FlowEditor
							steps={operation.steps}
							edges={operation.edges}
							onStepsChange={onStepsChange}
							onStepSelect={setSelectedStepId}
							selectedStepId={selectedStepId}
						/>
					</div>
				</div>

				{/* ── Right Panel — Step Settings ── */}
				<div className="w-75 shrink-0 rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
					{selectedStep ? (
						<div key={selectedStep.id} className="h-full animate-slide-in-right">
							<StepConfigPanel
								step={selectedStep}
								onUpdate={onStepUpdate}
								onClose={() => setSelectedStepId(null)}
								onDelete={onStepDelete}
							/>
						</div>
					) : (
						<div className="flex h-full flex-col items-center justify-center p-6 text-center animate-fade-in">
							<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 animate-float">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-400">
									<circle cx="12" cy="12" r="3" />
									<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
								</svg>
							</div>
							<p className="text-sm font-medium text-text">
								Step Settings
							</p>
							<p className="mt-1 text-xs text-text-muted leading-relaxed max-w-40">
								Select a step to configure it
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
