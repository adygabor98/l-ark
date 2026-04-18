import {
	useEffect,
	useState,
	type ReactElement
} from "react";
import {
	useParams,
	useNavigate
} from "react-router-dom";
import {
	CheckCircle2,
	Circle,
	PlayCircle,
	Upload,
	FileText,
	Globe,
	Link2,
	Lock,
	Loader2,
	Pencil,
	Eye,
	ClipboardCheck,
	Trash2,
	X,
	Download,
	AlertTriangle,
	Clock,
	ArrowRight,
	Share2,
	SkipForward,
	GitFork,
	DollarSign,
	CreditCard,
	Bell,
	ExternalLink,
	ListChecks
} from "lucide-react";
import {
	Badge
} from "../../shared/components/badge";
import {
	useToast
} from "../../shared/hooks/useToast";
import {
	EdgeConditionType,
	FormInstanceStatus,
	OperationInstanceStatus,
	OperationType,
	StepInstanceStatus,
	StepType,
} from "@l-ark/types";
import {
	useFileTemplate
} from "../../server/hooks/useFileTemplate";
import {
	useOperation
} from "../../server/hooks/useOperation";
import {
	useWorkspaceInstance
} from "./hooks/useWorkspaceInstance";
import {
	useDocumentManagement
} from "./hooks/useDocumentManagement";
import {
	useStepProgression
} from "./hooks/useStepProgression";
import {
	getStepProgress,
	formatRelativeDate,
	canStartStep,
	getStepCompletionBlockers
} from "./workspace.utils";
import WorkspaceDetailHeader from "./components/workspace-detail-header";
import RequestGlobalModal from "./components/request-global-modal";
import FillFormModal from "./components/fill-form-modal";
import ExportFormModal from "./components/export-form-modal";
import OtpDocumentModal from "./components/otp-document-modal";
import GrantAccessModal from "./components/grant-access-modal";
import Button from "../../shared/components/button";
import usePermissions from "../../shared/hooks/usePermissions";

const WorkspaceDetail = (): ReactElement => {
	/** URL parameter utilities */
	const { id } = useParams<{ id: string }>();
	/** Navigation utilities */
	const navigate = useNavigate();
	/** File template api utilities */
	const { removeFormInstance } = useFileTemplate();
	/** Toast utilities */
	const { onConfirmationToast } = useToast();
	/** Permissions utilities */
	const { user } = usePermissions();
	/** Workspace instances */
	const {
		instance, selectedStepInstanceId, blueprint, loading,
		selectedStepInstance, selectedBlueprintStep,
		linkedGlobalInstances, linkedOtherInstances,
		launchedFromInstance, dependsOnLinks, visibleStepInstances,
		linkableOtherInstances,
		setSelectedStepInstanceId, setInstance,
		refreshInstance
	} = useWorkspaceInstance(id ? Number(id) : undefined);
	/** State to manage the read only */
	const isReadOnly = instance?.blueprint.type == OperationType.GLOBAL && instance?.requestedBy?.id == user?.id && instance?.assignedTo.id !== user?.id;
	/** Document utilities */
	const { uploading, fileInputRef, handleFileUpload, handleDeleteDocument } = useDocumentManagement({ instanceId: id ? Number(id) : null, onInstanceUpdate: refreshInstance });
	/** Step Progression utilities */
	const { handleStepStatusChange } = useStepProgression({ instance, blueprint, isReadOnly, onInstanceChange: setInstance, onSelectStep: setSelectedStepInstanceId });
	/** Operation mutations for closure */
	const { closeOperation: closeOperationMutation, executeOpenOperationStep, selectDocumentsToShare, updateStepInstance, linkInstances } = useOperation();

	useEffect(() => {
	  	console.log(instance);
	}, [instance]);
	
	const [showRequestGlobal, setShowRequestGlobal] = useState(false);
	const [showBranchChoice, setShowBranchChoice] = useState(false);
	const [executingOpenStep, setExecutingOpenStep] = useState(false);
	const [showLinkPicker, setShowLinkPicker] = useState(false);
	const [linkingInProgress, setLinkingInProgress] = useState(false);
	const [linkSearch, setLinkSearch] = useState('');
	const [shareDocIds, setShareDocIds] = useState<string[]>([]);
	const [fillFormConfig, setFillFormConfig] = useState<{ templateId: number; stepInstanceId: number; formInstanceId?: number } | null>(null);
	const [exportConfig, setExportConfig] = useState<{ templateId: number; formInstanceId: number; templateName?: string } | null>(null);
	const [otpConfig, setOtpConfig] = useState<{ docId: number; fileName: string } | null>(null);
	const [grantAccessConfig, setGrantAccessConfig] = useState<{ docId: number; fileName: string } | null>(null);

	if ( loading ) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-amber-500" />
					<span className="text-sm text-black/40 font-[Lato-Regular]"> Loading instance... </span>
				</div>
			</div>
		);
	}

	if ( !instance || !blueprint ) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-sm text-black/40 font-[Lato-Regular]"> Instance not found. </p>
			</div>
		);
	}

	const maxGlobal = (blueprint as any).maxGlobalOperations ?? null;
	const currentGlobalCount = instance.targetLinks.filter((l: any) => l.linkType === 'GLOBAL_OTHER' || l.linkType === 'DEPENDS_ON').length;
	const canRequestGlobal = instance.blueprint.type == OperationType.OTHER
		&& instance.status == OperationInstanceStatus.COMPLETED_READY
		&& (maxGlobal === null || currentGlobalCount < maxGlobal);

	const activeSteps = visibleStepInstances.filter(si => si.status !== StepInstanceStatus.SKIPPED);
	const progress = { total: activeSteps.length, completed: activeSteps.filter(si => si.status == StepInstanceStatus.COMPLETED).length };
	const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
	const allStepsCompleted = progress.total > 0 && progress.completed === progress.total;

	return (
		<div className="h-full flex flex-col">
			<WorkspaceDetailHeader
				instance={instance}
				isReadOnly={isReadOnly}
				allStepsCompleted={allStepsCompleted}
				progress={progress}
				progressPct={progressPct}
			/>

			{/* Main 2-panel layout */}
			<div className="flex-1 flex gap-3 min-h-0">
				{/* ── Left Panel — Step list ── */}
				<div className="w-72 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
					<div className="px-4 py-3 border-b border-black/6 flex items-center justify-between">
						<h3 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Steps </h3>
						<span className="text-[10px] font-[Lato-Regular] text-black/30">
							{ progress.completed }/{ progress.total }
						</span>
					</div>

					{/* Launched from instance banner */}
					{ launchedFromInstance &&
						<div className="px-3 py-2 border-b border-black/6 bg-blue-50/30">
							<div className="flex items-center gap-1.5 mb-1.5">
								<ExternalLink className="w-3 h-3 text-blue-500" />
								<span className="text-[10px] font-[Lato-Bold] text-blue-600 uppercase tracking-widest"> Launched By </span>
							</div>
							<button onClick={() => navigate(`/workspace/detail/${launchedFromInstance.id}`)}
								className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-100/60 transition-colors cursor-pointer flex items-center gap-2"
							>
								<span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
								<span className="text-xs font-[Lato-Regular] text-blue-600 truncate"> { launchedFromInstance.title } </span>
								<ArrowRight className="w-3 h-3 text-blue-400 shrink-0 ml-auto" />
							</button>
						</div>
					}

					{/* Linked instances — shown at top for visibility */}
					{ linkedGlobalInstances.length > 0 &&
						<div className="px-3 py-2 border-b border-black/6 bg-violet-50/30">
							<div className="flex items-center gap-1.5 mb-1.5">
								<Link2 className="w-3 h-3 text-violet-500" />
								<span className="text-[10px] font-[Lato-Bold] text-violet-600 uppercase tracking-widest"> Linked Operations </span>
								<span className="text-[9px] bg-violet-100 text-violet-500 font-[Lato-Bold] px-1.5 py-px rounded-full"> {linkedGlobalInstances.length} </span>
							</div>
							{ linkedGlobalInstances.map(gi =>
								<button key={gi.id} onClick={() => navigate(`/workspace/detail/${gi.id}`)}
									className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-violet-100/60 transition-colors cursor-pointer flex items-center gap-2"
								>
									<span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
									<span className="text-xs font-[Lato-Regular] text-violet-600 truncate"> { gi.title } </span>
									<ArrowRight className="w-3 h-3 text-violet-400 shrink-0 ml-auto" />
								</button>
							)}
						</div>
					}

					{/* Linked other instances — shown for GLOBAL operations */}
					{ linkedOtherInstances.length > 0 &&
						<div className="px-3 py-2 border-b border-black/6 bg-amber-50/30">
							<div className="flex items-center gap-1.5 mb-1.5">
								<Link2 className="w-3 h-3 text-amber-500" />
								<span className="text-[10px] font-[Lato-Bold] text-amber-600 uppercase tracking-widest"> From Operations </span>
								<span className="text-[9px] bg-amber-100 text-amber-500 font-[Lato-Bold] px-1.5 py-px rounded-full"> {linkedOtherInstances.length} </span>
							</div>
							{ linkedOtherInstances.map((oi: any) => (
								<button key={oi.id} onClick={() => navigate(`/workspace/detail/${oi.id}`)}
									className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer flex items-center gap-2"
								>
									<span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
									<div className="flex-1 min-w-0">
										<span className="text-xs font-[Lato-Regular] text-amber-700 truncate block"> { oi.title } </span>
										<span className="text-[9px] font-[Lato-Regular] text-amber-400/80"> { oi.code } </span>
									</div>
									<ArrowRight className="w-3 h-3 text-amber-400 shrink-0 ml-auto" />
								</button>
							))}
						</div>
					}

					<div className="flex-1 overflow-y-auto p-2">
						<div className="space-y-1">
							{ visibleStepInstances.map((si) => {
								const bpStep = blueprint.steps.find((s: any) => s.id == si.stepId);
								if (!bpStep) return null;
								const isSelected = si.id == selectedStepInstanceId;
								const isCompleted = si.status == StepInstanceStatus.COMPLETED;
								const isActive = si.status == StepInstanceStatus.IN_PROGRESS;
								const isPending = si.status == StepInstanceStatus.PENDING;
								const isSkipped = si.status == StepInstanceStatus.SKIPPED;
								const isBlocked = isPending && !canStartStep(si, blueprint, instance, isReadOnly);

								return (
									<div key={si.id}>
										<button onClick={() => setSelectedStepInstanceId(si.id)}
											className={`w-full text-left rounded-xl p-2.5 transition-all duration-200 cursor-pointer group ${
												isSelected ? 'bg-amber-50/80 ring-1 ring-amber-300/60 shadow-sm' : 'hover:bg-black/2 hover:ring-1 hover:ring-black/4'
											}`}
										>
											<div className="flex items-center gap-2">
												{
													isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
													: isSkipped ? <SkipForward className="w-4 h-4 text-slate-300 shrink-0" />
													: isActive ? <PlayCircle className="w-4 h-4 text-amber-500 shrink-0" />
													: isBlocked ? <Lock className="w-3.5 h-3.5 text-red-300 shrink-0" />
													: <Circle className="w-4 h-4 text-black/20 shrink-0" />
												}
												<span className={`text-[13px] font-[Lato-Bold] truncate transition-colors ${
													isSelected ? 'text-black/90' : (isCompleted || isSkipped) ? 'text-black/40' : 'text-black/70'
												}`}>
													{ bpStep.title }
												</span>
												{ bpStep.isRequired &&
													<span className="text-red-400 text-[9px] font-[Lato-Bold] shrink-0">REQ</span>
												}
											</div>

											{ isActive && (si as any).startedAt &&
												<div className="mt-1 ml-6 flex items-center gap-1 text-[9px] text-black/25 font-[Lato-Regular]">
													<Clock className="w-2.5 h-2.5" />
													Started { formatRelativeDate((si as any).startedAt) }
												</div>
											}
										</button>
									</div>
								);
							})}
						</div>
					</div>

				</div>

				{/* ── Right Panel — Step detail ── */}
				<div className="flex-1 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
					{ selectedStepInstance && selectedBlueprintStep ?
						<>
							<div className="px-6 py-4 border-b border-black/6">
								<div className="flex items-center justify-between">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3">
											<h3 className="text-lg font-[Lato-Bold] text-black/80"> { selectedBlueprintStep.title } </h3>
											{ selectedStepInstance.status == StepInstanceStatus.PENDING && !canStartStep(selectedStepInstance, blueprint, instance, isReadOnly) &&
												<Badge variant="secondary" className="text-[10px]">
													<Lock className="w-3 h-3 mr-1" />
													Blocked
												</Badge>
											}
											{ selectedStepInstance.status == StepInstanceStatus.IN_PROGRESS &&
												<Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600">
													<PlayCircle className="w-3 h-3 mr-1" />
													In Progress
												</Badge>
											}
											{ selectedStepInstance.status == StepInstanceStatus.COMPLETED &&
												<Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600">
													<CheckCircle2 className="w-3 h-3 mr-1" />
													Completed
												</Badge>
											}
											{ selectedStepInstance.status == StepInstanceStatus.SKIPPED &&
												<Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-400">
													<SkipForward className="w-3 h-3 mr-1" />
													Skipped
												</Badge>
											}
										</div>
										{ selectedBlueprintStep.description &&
											<p className="mt-1 text-sm font-[Lato-Regular] text-black/40"> { selectedBlueprintStep.description } </p>
										}
									</div>
								</div>

								{/* Contextual summary bar */}
								{ (selectedStepInstance.status === StepInstanceStatus.IN_PROGRESS || selectedStepInstance.status === StepInstanceStatus.COMPLETED) &&
									(() => {
										const sp = getStepProgress(selectedStepInstance, selectedBlueprintStep);
										if (sp.total === 0) return null;

										const pct = sp.total > 0 ? (sp.done / sp.total) * 100 : 0;

										return (
											<div className="mt-3 flex items-center gap-3">
												<div className="flex-1">
													<div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
														<div className={`h-full rounded-full transition-all duration-500 ${ pct === 100 ? 'bg-emerald-500' : 'bg-amber-400' }`} style={{ width: `${pct}%` }} />
													</div>
												</div>
												<span className={`text-[10px] font-[Lato-Regular] shrink-0 ${ pct === 100 ? 'text-emerald-600' : 'text-black/40' }`}>
													{ sp.label }
												</span>
											</div>
										);
									})()
								}
							</div>

							{/* Step content */}
							{ selectedStepInstance.status == StepInstanceStatus.PENDING && canStartStep(selectedStepInstance, blueprint, instance, isReadOnly) && !isReadOnly ?
								<div className="flex-1 overflow-y-auto p-6 space-y-5">
									{/* Ready-to-start card */}
									<div className="w-full bg-[#FAFAFA] border border-black/6 rounded-2xl p-5 flex flex-col items-center gap-4 text-center">
										<div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
											<PlayCircle className="w-6 h-6 text-amber-500" />
										</div>
										<div>
											<p className="text-sm font-[Lato-Bold] text-black/70"> Ready to start </p>
											<p className="text-xs font-[Lato-Regular] text-black/35 mt-1.5 leading-relaxed">
												{ selectedBlueprintStep.fileTemplates?.length > 0 && selectedBlueprintStep.allowDocumentUpload
													? `Fill ${selectedBlueprintStep.fileTemplates.length} form${selectedBlueprintStep.fileTemplates.length > 1 ? 's' : ''} and upload documents.`
													: selectedBlueprintStep.fileTemplates?.length > 0
													? `Fill ${selectedBlueprintStep.fileTemplates.length} form${selectedBlueprintStep.fileTemplates.length > 1 ? 's' : ''} to complete this step.`
													: selectedBlueprintStep.allowDocumentUpload
													? "Upload required documents for this step."
													: "Review and mark this step as complete when done."
												}
											</p>
										</div>
										<Button variant="primary" size="lg" className="w-full rounded-xl!"
											onClick={() => handleStepStatusChange(selectedStepInstance, StepInstanceStatus.IN_PROGRESS)}
										>
											<PlayCircle className="w-4 h-4" />
											Start Step
										</Button>
									</div>

									{/* Preview: expected documents (read-only) */}
									{ (selectedBlueprintStep as any).expectedDocuments?.length > 0 &&
										<div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center gap-2 mb-3">
												<ListChecks className="w-4 h-4 text-blue-600" />
												<h4 className="text-sm font-[Lato-Bold] text-black/70"> Documents to Prepare </h4>
											</div>
											<div className="space-y-1.5">
												{ (selectedBlueprintStep as any).expectedDocuments.map((docName: string) => (
													<div key={docName} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-black/6 bg-white">
														<Circle className="w-3.5 h-3.5 text-black/20 shrink-0" />
														<span className="text-xs font-[Lato-Regular] text-black/55"> { docName } </span>
													</div>
												))}
											</div>
										</div>
									}

									{/* Preview: notification persons (read-only) */}
									{ (selectedBlueprintStep as any).stepType === StepType.NOTIFICATION && (selectedBlueprintStep as any).notificationPersons?.length > 0 &&
										<div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
											<div className="flex items-center gap-2 mb-2">
												<Bell className="w-4 h-4 text-amber-500" />
												<p className="text-sm font-[Lato-Bold] text-amber-700"> Persons to Notify </p>
											</div>
											<div className="space-y-1">
												{ (selectedBlueprintStep as any).notificationPersons.map((p: string) => (
													<div key={p} className="flex items-center gap-1.5 px-1 py-0.5">
														<span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
														<span className="text-xs font-[Lato-Regular] text-amber-700"> { p } </span>
													</div>
												))}
											</div>
										</div>
									}

									{/* Preview: file templates to fill (read-only) */}
									{ selectedBlueprintStep.fileTemplates?.length > 0 &&
										<div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center gap-2 mb-3">
												<ClipboardCheck className="w-4 h-4 text-blue-600" />
												<h4 className="text-sm font-[Lato-Bold] text-black/70"> Forms to Fill </h4>
											</div>
											<div className="space-y-1.5">
												{ selectedBlueprintStep.fileTemplates.map((ft: any) => (
													<div key={ft.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-black/6 bg-white">
														<FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
														<span className="text-xs font-[Lato-Bold] text-black/60 flex-1"> { ft.template?.title ?? `Template #${ft.templateId}` } </span>
														{ !ft.isOptional && <span className="text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-amber-100 text-amber-600"> Required </span> }
													</div>
												))}
											</div>
										</div>
									}
								</div>
							: selectedStepInstance.status == StepInstanceStatus.PENDING && !canStartStep(selectedStepInstance, blueprint, instance, isReadOnly) ?
								/* ── Blocked ── */
								<div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
									<div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
										<Lock className="w-8 h-8 text-red-300" />
									</div>
									<p className="text-sm font-[Lato-Bold] text-black/50"> This step is blocked </p>
									<p className="text-xs font-[Lato-Regular] text-black/30 mt-1.5 max-w-xs leading-relaxed">
										Complete the blocking predecessor steps before you can start this one.
									</p>
									{ (() => {
										const bpStep = selectedBlueprintStep;
										const blockers = blueprint.edges
											.filter((e: any) => e.targetId == bpStep.id)
											.map((e: any) => blueprint.steps.find((s: any) => s.id == e.sourceId))
											.filter((s: any): s is NonNullable<typeof s> => !!s?.isBlocking);

										if (blockers.length === 0) return null;

										return (
											<div className="mt-4 space-y-1">
												{ blockers.map((b: any) => {
													const bInstance = instance.stepInstances.find(si => si.stepId == b.id);

													return (
														<button key={b.id} onClick={() => bInstance && setSelectedStepInstanceId(bInstance.id)}
															className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
														>
															<ArrowRight className="w-3 h-3" />
															<span className="font-[Lato-Regular]"> { b.title } </span>
															{ bInstance?.status == StepInstanceStatus.COMPLETED
																? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
																: <Circle className="w-3 h-3 text-red-300" />
															}
														</button>
													);
												})}
											</div>
										);
									})()}
								</div>
							:
								<div className="flex-1 overflow-y-auto p-6 space-y-6">
									{/* WAIT_FOR_LINKED info banner */}
									{ (selectedBlueprintStep as any).stepType === StepType.WAIT_FOR_LINKED &&
										<div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
											<Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
											<div className="flex-1">
												<p className="text-sm font-[Lato-Bold] text-blue-700"> Waiting for linked operation </p>
												<p className="text-xs font-[Lato-Regular] text-blue-600/70 mt-0.5 leading-relaxed">
													This step will automatically complete once the linked sub-operation finishes.
												</p>
												{ dependsOnLinks.length > 0 && (
													<div className="mt-2 space-y-1">
														{ dependsOnLinks.map((link: any) => (
															<button key={link.id} onClick={() => navigate(`/workspace/detail/${link.sourceInstance?.id}`)}
																className="flex items-center gap-1.5 text-xs text-blue-600 font-[Lato-Bold] hover:underline cursor-pointer"
															>
																<ArrowRight className="w-3 h-3" />
																{ link.sourceInstance?.title ?? `Instance #${link.sourceInstanceId}` }
																<span className={`ml-1 text-[9px] px-1.5 py-px rounded-full font-[Lato-Regular] ${ link.sourceInstance?.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-500' }`}>
																	{ link.sourceInstance?.status ?? '...' }
																</span>
															</button>
														))}
													</div>
												)}
											</div>
										</div>
									}

									{/* OPEN_OPERATION — launch sub-operation */}
									{ (selectedBlueprintStep as any).stepType === StepType.OPEN_OPERATION && selectedStepInstance.status === StepInstanceStatus.IN_PROGRESS &&
										(() => {
											const alreadyLaunched = dependsOnLinks.length > 0;
											return (
												<div className="p-4 rounded-xl border border-violet-200 bg-violet-50/60 flex items-start gap-3">
													<ExternalLink className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
													<div className="flex-1">
														<p className="text-sm font-[Lato-Bold] text-violet-700"> Open Sub-Operation </p>
														{ alreadyLaunched ? (
															<div className="mt-1 space-y-1">
																<p className="text-xs font-[Lato-Regular] text-violet-600/70"> Sub-operation already launched: </p>
																{ dependsOnLinks.map((link: any) => (
																	<button key={link.id} onClick={() => navigate(`/workspace/detail/${link.sourceInstance?.id}`)}
																		className="flex items-center gap-1.5 text-xs text-violet-700 font-[Lato-Bold] hover:underline cursor-pointer"
																	>
																		<ArrowRight className="w-3 h-3" />
																		{ link.sourceInstance?.title ?? `Instance #${link.sourceInstanceId}` }
																	</button>
																))}
															</div>
														) : (
															<>
																<p className="text-xs font-[Lato-Regular] text-violet-600/70 mt-0.5">
																	Click to launch the sub-operation defined in the blueprint.
																</p>
																<Button variant="primary" size="sm" className="mt-2"
																	disabled={executingOpenStep}
																	onClick={async () => {
																		setExecutingOpenStep(true);
																		try {
																			await executeOpenOperationStep({ input: { stepInstanceId: String(selectedStepInstance.id) } });
																			await refreshInstance();
																		} finally {
																			setExecutingOpenStep(false);
																		}
																	}}
																>
																	{ executingOpenStep
																		? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Launching...</>
																		: <><PlayCircle className="w-3.5 h-3.5" /> Launch Sub-Operation</>
																	}
																</Button>
															</>
														)}
													</div>
												</div>
											);
										})()
									}

									{/* ALLOW_INSTANCE_LINK section */}
									{ (selectedBlueprintStep as any).allowInstanceLink && selectedStepInstance.status === StepInstanceStatus.IN_PROGRESS && !isReadOnly &&
										<div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center gap-2 mb-3">
												<Link2 className="w-4 h-4 text-blue-600" />
												<h4 className="text-sm font-[Lato-Bold] text-black/70"> Link Existing Instance </h4>
											</div>

											{ instance.sourceLinks.filter((l: any) => l.linkType === 'OTHER_OTHER').length > 0 &&
												<div className="space-y-1 mb-3">
													{ instance.sourceLinks
														.filter((l: any) => l.linkType === 'OTHER_OTHER')
														.map((l: any) => (
															<button key={l.id}
																onClick={() => navigate(`/workspace/detail/${l.targetInstance?.id}`)}
																className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50/60 transition-colors cursor-pointer flex items-center gap-2"
															>
																<span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
																<span className="text-xs font-[Lato-Regular] text-blue-600 truncate flex-1">
																	{ l.targetInstance?.title ?? `Instance #${l.targetInstanceId}` }
																</span>
																<span className="text-[9px] font-[Lato-Regular] text-blue-400/70">
																	{ l.targetInstance?.code }
																</span>
																<ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
															</button>
														))
													}
												</div>
											}

											{ !showLinkPicker ? (
												<Button variant="secondary" size="sm" onClick={() => setShowLinkPicker(true)} className="w-full">
													<Link2 className="w-3.5 h-3.5" />
													Link Instance
												</Button>
											) : (
												<div className="space-y-2">
													<input
														type="text"
														placeholder="Search by title or code..."
														value={linkSearch}
														onChange={e => setLinkSearch(e.target.value)}
														autoFocus
														className="w-full rounded-md border-[0.5px] border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/30 transition-all shadow-sm"
													/>
													<div className="max-h-48 overflow-y-auto border border-black/6 rounded-lg bg-white p-1 space-y-0.5">
														{ linkableOtherInstances
															.filter((i: any) => !linkSearch || i.title?.toLowerCase().includes(linkSearch.toLowerCase()) || i.code?.toLowerCase().includes(linkSearch.toLowerCase()))
															.map((inst: any) => (
																<button key={inst.id}
																	disabled={linkingInProgress}
																	onClick={async () => {
																		setLinkingInProgress(true);
																		try {
																			await linkInstances({ input: { sourceInstanceId: String(instance.id), targetInstanceIds: [String(inst.id)], linkType: 'OTHER_OTHER' } });
																			await refreshInstance();
																			setShowLinkPicker(false);
																			setLinkSearch('');
																		} finally {
																			setLinkingInProgress(false);
																		}
																	}}
																	className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50/60 transition-all cursor-pointer flex items-center gap-2 group disabled:opacity-50"
																>
																	<div className="flex-1 min-w-0">
																		<p className="text-xs font-[Lato-Bold] text-black/70 truncate"> { inst.title } </p>
																		<p className="text-[10px] font-[Lato-Regular] text-black/35"> { inst.code } </p>
																	</div>
																	<ArrowRight className="w-3 h-3 text-black/20 group-hover:text-amber-500 transition-colors shrink-0" />
																</button>
															))
														}
														{ linkableOtherInstances.filter((i: any) => !linkSearch || i.title?.toLowerCase().includes(linkSearch.toLowerCase()) || i.code?.toLowerCase().includes(linkSearch.toLowerCase())).length === 0 &&
															<p className="text-xs text-black/30 font-[Lato-Regular] text-center py-3"> No instances available </p>
														}
													</div>
													<Button variant="ghost" size="sm" className="w-full"
														onClick={() => { setShowLinkPicker(false); setLinkSearch(''); }}
													>
														Cancel
													</Button>
												</div>
											)}
										</div>
									}

									{/* NOTIFICATION step renderer */}
									{ (selectedBlueprintStep as any).stepType === StepType.NOTIFICATION &&
										<div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
											<div className="flex items-center gap-2 mb-2">
												<Bell className="w-4 h-4 text-amber-500" />
												<p className="text-sm font-[Lato-Bold] text-amber-700"> Notification Step </p>
											</div>
											{ (selectedBlueprintStep as any).notificationPersons?.length > 0 && (
												<div className="space-y-1">
													<p className="text-[11px] font-[Lato-Bold] text-amber-600/70 uppercase tracking-widest mb-1"> Notified </p>
													{ (selectedBlueprintStep as any).notificationPersons.map((p: string) => {
														const isNotified = ((selectedStepInstance as any).notifiedPersons ?? []).includes(p);
														const canToggle = selectedStepInstance.status === StepInstanceStatus.IN_PROGRESS && !isReadOnly;
														return (
															<button
																key={p}
																disabled={!canToggle}
																onClick={async () => {
																	if (!canToggle) return;
																	const current: string[] = (selectedStepInstance as any).notifiedPersons ?? [];
																	const updated = isNotified ? current.filter(x => x !== p) : [...current, p];
																	await updateStepInstance({ id: selectedStepInstance.id, input: { notifiedPersons: updated } });
																	await refreshInstance();
																}}
																className={`w-full flex items-center gap-1.5 text-left rounded-md px-1 py-0.5 transition-colors ${canToggle ? 'hover:bg-amber-100/60 cursor-pointer' : 'cursor-default'}`}
															>
																<span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
																<span className="text-xs font-[Lato-Regular] text-amber-700 flex-1"> { p } </span>
																{ isNotified
																	? <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto shrink-0" />
																	: <Circle className="w-3 h-3 text-black/20 ml-auto shrink-0" />
																}
															</button>
														);
													})}
												</div>
											)}
										</div>
									}

									{/* Expected Documents checklist */}
									{ (selectedBlueprintStep as any).expectedDocuments?.length > 0 &&
										<div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center gap-2 mb-3">
												<ListChecks className="w-4 h-4 text-blue-600" />
												<h4 className="text-sm font-[Lato-Bold] text-black/70"> Required Documents </h4>
											</div>
											<div className="space-y-2">
												{ (selectedBlueprintStep as any).expectedDocuments.map((docName: string) => {
													const isChecked = ((selectedStepInstance as any).checkedDocuments ?? []).includes(docName);
													const canToggle = selectedStepInstance.status === StepInstanceStatus.IN_PROGRESS && !isReadOnly;
													return (
														<button
															key={docName}
															disabled={!canToggle}
															onClick={async () => {
																if (!canToggle) return;
																const current: string[] = (selectedStepInstance as any).checkedDocuments ?? [];
																const updated = isChecked
																	? current.filter(d => d !== docName)
																	: [...current, docName];
																await updateStepInstance({ id: selectedStepInstance.id, input: { checkedDocuments: updated } });
																await refreshInstance();
															}}
															className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
																isChecked ? 'border-emerald-200 bg-emerald-50/40' : 'border-black/6 bg-white'
															} ${canToggle ? 'cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/20' : 'cursor-default'}`}
														>
															{ isChecked
																? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
																: <Circle className="w-4 h-4 text-black/20 shrink-0" />
															}
															<span className={`text-sm font-[Lato-Regular] flex-1 ${ isChecked ? 'text-emerald-700 line-through' : 'text-black/60' }`}>
																{ docName }
															</span>
														</button>
													);
												})}
											</div>
										</div>
									}

									{ selectedBlueprintStep.allowDocumentUpload &&
										<div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<Upload className="w-4 h-4 text-emerald-600" />
													<h4 className="text-sm font-[Lato-Bold] text-black/70"> Documents </h4>
													{ uploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> }
												</div>
												{ selectedStepInstance.documents.length > 0 &&
													<span className="text-[10px] font-[Lato-Regular] text-black/35">
														{ selectedStepInstance.documents.length } uploaded
													</span>
												}
											</div>

											{ !isReadOnly && selectedStepInstance.status !== StepInstanceStatus.COMPLETED &&
												<div
													className="border-2 border-dashed border-black/10 rounded-lg p-6 text-center hover:border-[#FFBF00]/40 transition-colors cursor-pointer"
													onClick={() => fileInputRef.current?.click()}
													onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-[#FFBF00]/60', 'bg-amber-50/30'); }}
													onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-[#FFBF00]/60', 'bg-amber-50/30'); }}
													onDrop={e => {
														e.preventDefault();
														e.currentTarget.classList.remove('border-[#FFBF00]/60', 'bg-amber-50/30');
														if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files, selectedStepInstance.id);
													}}
												>
													<Upload className="w-6 h-6 text-black/20 mx-auto mb-1.5" />
													<p className="text-sm text-black/40 font-[Lato-Regular]"> Drop files here or click to upload </p>
													<p className="text-xs text-black/25 font-[Lato-Regular] mt-1"> PDF, DOCX, XLSX, images — up to 10MB each </p>
													<input ref={fileInputRef} type="file" multiple className="hidden"
														onChange={e => { if (e.target.files && e.target.files.length > 0) handleFileUpload(e.target.files, selectedStepInstance.id); }}
													/>
												</div>
											}

											{ selectedStepInstance.documents.length > 0 &&
												<div className="mt-3 space-y-1">
													{ selectedStepInstance.documents.map((doc: any) => {
														const sizeKB = doc.fileSize ? Math.round(doc.fileSize / 1024) : 0;
														const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

														return (
															<div key={doc.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-black/4 group">
																<div className="flex items-center gap-2 min-w-0">
																	<FileText className="w-4 h-4 text-blue-400 shrink-0" />
																	<div className="min-w-0">
																		<span className="text-xs font-[Lato-Regular] text-black/70 truncate block"> { doc.fileName } </span>
																		<span className="text-[10px] font-[Lato-Regular] text-black/30"> { sizeLabel } </span>
																	</div>
																</div>
																<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																	<button onClick={() => setOtpConfig({ docId: doc.id, fileName: doc.fileName })} className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer" title="Download">
																		<Download className="w-3.5 h-3.5 text-black/40" />
																	</button>
																	<button onClick={() => setGrantAccessConfig({ docId: doc.id, fileName: doc.fileName })} className="p-1 rounded hover:bg-violet-50 transition-colors cursor-pointer" title="Manage access">
																		<Share2 className="w-3.5 h-3.5 text-black/40" />
																	</button>
																	{ !isReadOnly && selectedStepInstance.status !== StepInstanceStatus.COMPLETED &&
																		<button onClick={() => handleDeleteDocument(doc.id, doc.fileName)} className="p-1 rounded hover:bg-red-50 transition-colors cursor-pointer" title="Remove">
																			<X className="w-3.5 h-3.5 text-red-400" />
																		</button>
																	}
																</div>
															</div>
														);
													})}
												</div>
											}

											{ selectedStepInstance.documents.length == 0 && ( isReadOnly || selectedStepInstance.status == StepInstanceStatus.COMPLETED ) &&
												<p className="text-xs text-black/30 font-[Lato-Regular] text-center py-4"> No documents uploaded </p>
											}
										</div>
									}

									{ selectedBlueprintStep.fileTemplates.length > 0 &&
										<div className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<ClipboardCheck className="w-4 h-4 text-blue-600" />
													<h4 className="text-sm font-[Lato-Bold] text-black/70"> Forms </h4>
												</div>
												{ (() => {
													const total = selectedBlueprintStep.fileTemplates.length;
													const submitted = (selectedStepInstance.formInstances ?? []).filter((fi: any) => {
														const s = fi.formInstance?.status;
														return s === FormInstanceStatus.SUBMITTED || s === FormInstanceStatus.APPROVED;
													}).length;

													return (
														<span className={`text-[10px] font-[Lato-Bold] px-2 py-0.5 rounded-full ${submitted === total && total > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-black/5 text-black/35' }`}>
															{ submitted } / { total } submitted
														</span>
													);
												})()}
											</div>
											<div className="space-y-3">
												{ selectedBlueprintStep.fileTemplates.map((fileTemplate: any) => {
													const existingForms = (selectedStepInstance.formInstances ?? []).filter((fi: any) => {
														if (!fi.formInstance) return false;
														const formTemplateId =
															fi.formInstance?.templateVersion?.templateId
															?? fi.formInstance?.templateId
															?? fi.formInstance?.template?.id;
														return String(formTemplateId) === String(fileTemplate.templateId);
													});
													const canFill = !isReadOnly && selectedStepInstance.status !== StepInstanceStatus.COMPLETED && (fileTemplate.allowMultipleFills || existingForms.length === 0);
													const hasSubmittedForm = existingForms.some((fi: any) => {
														const s = fi.formInstance?.status;
														return s === FormInstanceStatus.SUBMITTED || s === FormInstanceStatus.APPROVED;
													});
													const isRequiredForm = !fileTemplate.isOptional;
													const needsAction = isRequiredForm && !hasSubmittedForm && selectedStepInstance.status === StepInstanceStatus.IN_PROGRESS;

													return (
														<div key={fileTemplate.id} className={`rounded-xl border overflow-hidden ${
															hasSubmittedForm ? 'border-emerald-200 bg-emerald-50/30'
															: needsAction ? 'border-amber-300 bg-amber-50/20'
															: 'border-black/6 bg-white'
														}`}>
															<div className="flex items-center justify-between p-3">
																<div className="flex items-center gap-2">
																	{ hasSubmittedForm
																		? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
																		: needsAction
																		? <AlertTriangle className="w-4 h-4 text-amber-500" />
																		: <FileText className="w-4 h-4 text-blue-400" />
																	}
																	<span className="text-sm font-[Lato-Bold] text-black/70"> { fileTemplate.template?.title ?? `Template ${ fileTemplate.id }`} </span>
																	{ isRequiredForm && !hasSubmittedForm &&
																		<span className="text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-amber-100 text-amber-600 border border-amber-200/60">
																			Required
																		</span>
																	}
																</div>
																{ canFill &&
																	<Button variant="ghost" size="sm" onClick={() => setFillFormConfig({ templateId: fileTemplate.templateId, stepInstanceId: selectedStepInstance.id })}>
																		<Pencil className="w-3.5 h-3.5" />
																		Fill Form
																	</Button>
																}
															</div>

															{ existingForms.length > 0 &&
																<div className="border-t border-black/4">
																	{ existingForms.map((fi: any) => {
																		const status = fi.formInstance?.status ?? FormInstanceStatus.DRAFT;
																		const isDraft = status == FormInstanceStatus.DRAFT;
																		const isSubmitted = status == FormInstanceStatus.SUBMITTED;
																		const isApproved = status == FormInstanceStatus.APPROVED;
																		const updatedAt = fi.formInstance?.updatedAt;

																		return (
																			<div key={fi.id} className="flex items-center justify-between px-3 py-2.5 border-b border-black/3 last:border-0">
																				<div className="flex items-center gap-2">
																					<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isApproved ? 'bg-emerald-500' : isSubmitted ? 'bg-blue-500' : 'bg-amber-500' }`} />
																					<span className="text-xs font-[Lato-Regular] text-black/60">
																						Form #{ fi.formInstanceId }
																					</span>
																					<span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full ${
																						isApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
																						isSubmitted ? 'bg-blue-50 text-blue-600 border border-blue-200/50' :
																						'bg-amber-50 text-amber-600 border border-amber-200/50'
																					}`}>
																						{ status }
																					</span>
																					{ updatedAt &&
																						<span className="text-[9px] text-black/25 font-[Lato-Regular]">
																							{ formatRelativeDate(updatedAt) }
																						</span>
																					}
																				</div>
																				<div className="flex items-center gap-1">
																					<Button variant="ghost" size="sm"
																						onClick={() => setFillFormConfig({
																							templateId: fileTemplate.templateId,
																							stepInstanceId: selectedStepInstance.id,
																							formInstanceId: fi.formInstanceId
																						})}
																					>
																						{ isDraft && !isReadOnly ?
																							<>
																								<Pencil className="w-3.5 h-3.5" />
																								Edit
																							</>
																						:
																							<>
																								<Eye className="w-3.5 h-3.5" />
																								View or Edit
																							</>
																						}
																					</Button>
																					{ (isSubmitted || isApproved) &&
																						<Button variant="ghost" size="sm"
																							onClick={() => setExportConfig({
																								templateId: fileTemplate.templateId,
																								formInstanceId: fi.formInstanceId,
																								templateName: fileTemplate.template?.title
																							})}
																						>
																							<Download className="w-3.5 h-3.5 text-blue-500" /> Export
																						</Button>
																					}
																					{ isDraft && !isReadOnly &&
																						<Button variant="ghost" size="sm"
																							onClick={async () => {
																								const { confirmed } = await onConfirmationToast({
																									title: 'Remove form?',
																									description: `Are you sure you want to remove Form #${fi.formInstanceId}? This action cannot be undone.`,
																									actionText: 'Remove', cancelText: 'Cancel', actionColor: 'error'
																								});
																								if (!confirmed) return;

																								const res = await removeFormInstance({ id: fi.formInstanceId });
																								if ( res.data?.data?.success && id ) {
																									await refreshInstance();
																								}
																							}}
																						>
																							<Trash2 className="w-3.5 h-3.5 text-red-500" />
																						</Button>
																					}
																				</div>
																			</div>
																		);
																	})}
																</div>
															}
														</div>
													);
												})}
											</div>
										</div>
									}

									{/* Empty state — actionable guidance */}
									{ !selectedBlueprintStep.allowDocumentUpload && selectedBlueprintStep.fileTemplates.length == 0 &&
										selectedStepInstance.status == StepInstanceStatus.IN_PROGRESS ?
											<div className="flex flex-col items-center justify-center py-12 text-center">
												<div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
													<CheckCircle2 className="w-6 h-6 text-amber-400" />
												</div>
												<p className="text-sm font-[Lato-Bold] text-black/60"> Review step </p>
												<p className="text-xs font-[Lato-Regular] text-black/30 mt-1 max-w-xs leading-relaxed">
													This step doesn't require uploading documents or filling forms. Review the step details and mark it as complete when you're done.
												</p>
											</div>
										: selectedStepInstance.status == StepInstanceStatus.COMPLETED &&
											<div className="flex flex-col items-center justify-center py-12 text-center">
												<div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
													<CheckCircle2 className="w-6 h-6 text-emerald-400" />
												</div>
												<p className="text-sm font-[Lato-Bold] text-black/50"> Step completed </p>
												<p className="text-xs font-[Lato-Regular] text-black/30 mt-1">
													No additional actions are needed for this step.
												</p>
											</div>

									}

									{/* Complete Step button / Branching / Closure */}
									{ selectedStepInstance.status == StepInstanceStatus.IN_PROGRESS && !isReadOnly &&
										(() => {
											const blockers = getStepCompletionBlockers(selectedStepInstance, selectedBlueprintStep);
											const isClosure = selectedBlueprintStep.stepType === StepType.CLOSURE;
											const isWaitForLinked = (selectedBlueprintStep as any).stepType === StepType.WAIT_FOR_LINKED;
											const isOpenOperation = (selectedBlueprintStep as any).stepType === StepType.OPEN_OPERATION;

											// Phase 3: block manual completion of WAIT_FOR_LINKED if sub-op is still active
											const activeDepends = dependsOnLinks.filter((l: any) => l.sourceInstance?.status && !['CLOSED', 'PARTIALLY_CLOSED'].includes(l.sourceInstance.status));
											const isWaitBlocked = isWaitForLinked && activeDepends.length > 0;

											// Phase 8: block manual completion of OPEN_OPERATION until sub-op is launched
											const openOpBlocked = isOpenOperation && dependsOnLinks.length === 0;

											// Check for USER_CHOICE outgoing edges
											const outgoingEdges = blueprint.edges.filter((e: any) => e.sourceId == selectedBlueprintStep.id);
											const userChoiceEdges = outgoingEdges.filter((e: any) => e.conditionType === EdgeConditionType.USER_CHOICE);
											const hasBranching = userChoiceEdges.length > 1;

											if (isWaitBlocked) return (
												<div className="pt-4 border-t border-black/6">
													<div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200/50">
														<Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
														<p className="text-xs font-[Lato-Regular] text-blue-600">
															Waiting for sub-operation to close before this step can complete.
														</p>
													</div>
												</div>
											);

											if (openOpBlocked) return (
												<div className="pt-4 border-t border-black/6">
													<div className="flex items-start gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200/50">
														<ExternalLink className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
														<p className="text-xs font-[Lato-Regular] text-violet-600">
															Launch the sub-operation above before completing this step.
														</p>
													</div>
												</div>
											);

											return (
												<div className="pt-4 border-t border-black/6">
													{ blockers.length > 0 &&
														<div className="flex items-start gap-2 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200/50">
															<AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
															<div>
																<p className="text-xs font-[Lato-Bold] text-amber-700"> Pending forms </p>
																<p className="text-[11px] font-[Lato-Regular] text-amber-600/70 mt-0.5">
																	{ blockers.join(', ') } { blockers.length === 1 ? 'has' : 'have' } not been submitted yet.
																</p>
															</div>
														</div>
													}

													{ isClosure ? (
														/* Closure step: payment decision buttons + optional doc sharing */
														<div className="space-y-2">
															<p className="text-xs font-[Lato-Bold] text-black/60 mb-2"> Close this operation: </p>

															{/* Phase 9: doc sharing when launched by another operation */}
															{ launchedFromInstance && (
																<div className="mb-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50">
																	<p className="text-[11px] font-[Lato-Bold] text-blue-700 mb-2">
																		Share documents with "{ launchedFromInstance.title }"?
																	</p>
																	{ selectedStepInstance.documents.length > 0 ? (
																		<div className="space-y-1.5">
																			{ selectedStepInstance.documents.map((doc: any) => (
																				<label key={doc.id} className="flex items-center gap-2 cursor-pointer text-xs text-blue-700 font-[Lato-Regular]">
																					<input type="checkbox" checked={shareDocIds.includes(String(doc.id))}
																						onChange={e => {
																							const id = String(doc.id);
																							setShareDocIds(prev => e.target.checked ? [...prev, id] : prev.filter(d => d !== id));
																						}}
																						className="rounded border-blue-300"
																					/>
																					{ doc.fileName }
																				</label>
																			))}
																		</div>
																	) : (
																		<p className="text-[11px] text-blue-500/70 font-[Lato-Regular]"> No documents uploaded to share. </p>
																	)}
																</div>
															)}

															<Button variant="primary" size="lg" className="w-full rounded-xl!"
																onClick={async () => {
																	if (launchedFromInstance && shareDocIds.length > 0) {
																		await selectDocumentsToShare({ input: { instanceId: String(instance.id), targetInstanceId: String(launchedFromInstance.id), documentIds: shareDocIds } });
																	}
																	await closeOperationMutation({ input: { instanceId: String(instance.id), paymentStatus: 'CLOSED' } });
																	await handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED);
																	await refreshInstance();
																}}
															>
																<DollarSign className="w-5 h-5" />
																Close — Fully Paid
															</Button>
															<Button variant="secondary" size="lg" className="w-full rounded-xl!"
																onClick={async () => {
																	if (launchedFromInstance && shareDocIds.length > 0) {
																		await selectDocumentsToShare({ input: { instanceId: String(instance.id), targetInstanceId: String(launchedFromInstance.id), documentIds: shareDocIds } });
																	}
																	await closeOperationMutation({ input: { instanceId: String(instance.id), paymentStatus: 'PENDING_PAYMENT' } });
																	await handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED);
																	await refreshInstance();
																}}
															>
																<CreditCard className="w-5 h-5" />
																Close — Pending Payment
															</Button>
															<Button variant="secondary" size="lg" className="w-full rounded-xl!"
																onClick={async () => {
																	if (launchedFromInstance && shareDocIds.length > 0) {
																		await selectDocumentsToShare({ input: { instanceId: String(instance.id), targetInstanceId: String(launchedFromInstance.id), documentIds: shareDocIds } });
																	}
																	await closeOperationMutation({ input: { instanceId: String(instance.id), paymentStatus: 'PARTIALLY_CLOSED' } });
																	await handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED);
																	await refreshInstance();
																}}
															>
																<DollarSign className="w-5 h-5 text-teal-600" />
																Close — Partially Paid
															</Button>
														</div>
													) : hasBranching && !showBranchChoice ? (
														/* Step has USER_CHOICE edges: show "choose path" button first */
														<Button variant="primary" size="lg" className="w-full rounded-xl!"
															onClick={() => setShowBranchChoice(true)}
														>
															<GitFork className="w-5 h-5" />
															Choose Path & Complete
														</Button>
													) : hasBranching && showBranchChoice ? (
														/* Show the branch options */
														<div className="space-y-3">
															<div className="flex items-center gap-2">
																<GitFork className="w-3.5 h-3.5 text-violet-500" />
																<p className="text-xs font-[Lato-Bold] text-black/70"> Choose the next path </p>
															</div>
															<p className="text-[11px] font-[Lato-Regular] text-black/40">
																Select which path to follow — other branches will be skipped.
															</p>
															{ userChoiceEdges.map((edge: any) => {
																const targetStep = blueprint.steps.find((s: any) => s.id == edge.targetId);
																return (
																	<button key={edge.id}
																		className="w-full text-left p-3 rounded-xl border border-black/8 bg-white hover:border-violet-400 hover:bg-violet-50/40 transition-all duration-200 cursor-pointer group"
																		onClick={async () => {
																			await handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED, String(edge.id));
																			setShowBranchChoice(false);
																		}}
																	>
																		<div className="flex items-center gap-3">
																			<div className="w-7 h-7 rounded-lg bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center shrink-0 transition-colors">
																				<ArrowRight className="w-3.5 h-3.5 text-violet-500" />
																			</div>
																			<div className="min-w-0">
																				<p className="text-sm font-[Lato-Bold] text-black/70 truncate">
																					{ edge.label || targetStep?.title || 'Continue' }
																				</p>
																				{ targetStep?.description &&
																					<p className="text-[11px] font-[Lato-Regular] text-black/35 truncate mt-0.5">
																						{ targetStep.description }
																					</p>
																				}
																			</div>
																		</div>
																	</button>
																);
															})}
															<Button variant="ghost" size="sm" className="w-full" onClick={() => setShowBranchChoice(false)}>
																Cancel
															</Button>
														</div>
													) : instance.blueprint.type === OperationType.OTHER && instance.status === OperationInstanceStatus.COMPLETED_READY && maxGlobal !== null && currentGlobalCount >= maxGlobal ? (
														/* Global limit reached */
														<div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
															<p className="text-xs font-[Lato-Bold] text-amber-700"> Global operation limit reached </p>
															<p className="text-[11px] font-[Lato-Regular] text-amber-600/70 mt-0.5">
																This operation can have at most { maxGlobal } linked global operation{ maxGlobal > 1 ? 's' : '' }.
															</p>
														</div>
													) : (
														/* Standard completion */
														<Button variant="primary" size="lg" className="w-full rounded-xl!"
															onClick={() => handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED)}
														>
															<CheckCircle2 className="w-5 h-5" />
															Mark Step as Complete
														</Button>
													)}
												</div>
											);
										})()
									}
								</div>
							}
						</>
					:
						<div className="flex h-full flex-col items-center justify-center p-6 text-center">
							<div className="w-12 h-12 bg-black/3 rounded-xl flex items-center justify-center mb-3">
								<FileText className="w-5 h-5 text-black/20" />
							</div>
							<p className="text-sm font-[Lato-Bold] text-black/70"> Step Details </p>
							<p className="mt-1 text-xs font-[Lato-Regular] text-black/40 leading-relaxed max-w-40">
								Select a step to view its details and interact with it
							</p>
						</div>
					}
				</div>
			</div>

			{/* Modals */}
			{ showRequestGlobal &&
				<RequestGlobalModal
					instance={instance}
					onClose={() => setShowRequestGlobal(false)}
					onSuccess={() => {
						if (selectedStepInstance) {
							handleStepStatusChange(selectedStepInstance, StepInstanceStatus.COMPLETED);
						}
					}}
				/>
			}

			{ fillFormConfig &&
				<FillFormModal
					templateId={fillFormConfig.templateId}
					stepInstanceId={fillFormConfig.stepInstanceId}
					formInstanceId={fillFormConfig.formInstanceId}
					readOnly={isReadOnly}
					onClose={() => setFillFormConfig(null)}
					onSaved={refreshInstance}
				/>
			}

			{ exportConfig &&
				<ExportFormModal
					templateId={exportConfig.templateId}
					formInstanceId={exportConfig.formInstanceId}
					templateName={exportConfig.templateName}
					onClose={() => setExportConfig(null)}
				/>
			}

			{ otpConfig &&
				<OtpDocumentModal
					docId={otpConfig.docId}
					fileName={otpConfig.fileName}
					onClose={() => setOtpConfig(null)}
				/>
			}

			{ grantAccessConfig &&
				<GrantAccessModal
					docId={grantAccessConfig.docId}
					fileName={grantAccessConfig.fileName}
					onClose={() => setGrantAccessConfig(null)}
				/>
			}
		</div>
	);
};

export default WorkspaceDetail;
