import {
	useEffect,
	useState,
	useMemo,
	type ReactElement
} from "react";
import {
	useNavigate,
	useLocation
} from "react-router-dom";
import {
	ArrowLeft,
	Check,
	FolderCog,
	Globe,
	Inbox,
	ChevronRight,
	AlertTriangle,
	Link2
} from "lucide-react";
import {
	useOperation
} from "../../server/hooks/useOperation";
import {
	OperationBlueprintStatus,
	OperationInstanceStatus,
	OperationType,
	type OperationBlueprint,
	type OperationInstance
} from "@l-ark/types";
import {
	useTranslation
} from "react-i18next";
import {
	useOffice
} from "../../server/hooks/useOffice";
import Button from "../../shared/components/button";
import usePermissions from "../../shared/hooks/usePermissions";

const WorkspaceNew = (): ReactElement => {
	/** Navigation utilities */
	const navigate = useNavigate();
	/** Location utilities */
	const { state } = useLocation();
	/** Operation api utilities */
	const { blueprints, retrieveBlueprints, createInstance, instances, retrieveInstances, linkInstances } = useOperation();
	/** State to manage the blueprint selected */
	const [selectedBlueprint, setSelectedBlueprint] = useState<OperationBlueprint | null>(null);
	/** State to manage the selected office */
	const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
	/** State to manage the operation type tab */
	const [activeType, setActiveType] = useState<OperationType>(OperationType.OTHER);
	/** State to manage the custom description */
	const [customDescription, setCustomDescription] = useState<string>('');
	/** State to manage the selected prerequisite instance IDs */
	const [prereqInstanceIds, setPrereqInstanceIds] = useState<Record<number, number | null>>({});
	/** Translation utilities */
	const { t } = useTranslation();
	/** Office api utilities */
	const { officesUser, retrieveOfficeByUser } = useOffice();
	/** Permissions utilities */
	const { user } = usePermissions();

	useEffect(() => {
		retrieveBlueprints();
		retrieveOfficeByUser({ idUser: user?.id as number });
		retrieveInstances();
	}, []);

	// Auto-select blueprint when navigated with a preselectedBlueprintId
	useEffect(() => {
		if (!state?.preselectedBlueprintId || blueprints.length === 0) return;
		const bp = blueprints.find((b) => b.id === Number(state.preselectedBlueprintId));
		if (bp) {
			setActiveType(bp.type);
			setSelectedBlueprint(bp);
		}
	}, [blueprints, state?.preselectedBlueprintId]);

	// Sync description when blueprint changes
	useEffect(() => {
		setCustomDescription(selectedBlueprint?.description ?? '');
		setPrereqInstanceIds({});
	}, [selectedBlueprint]);

	/** List of blueprints filtered by active type */
	const filteredBlueprints = blueprints.filter(op => op.type === activeType && op.status !== OperationBlueprintStatus.DRAFT);

	/** Prerequisites for the selected GLOBAL blueprint */
	const prerequisites = useMemo(() => {
		if (!selectedBlueprint || selectedBlueprint.type !== OperationType.GLOBAL) return [];
		return (selectedBlueprint as any).prerequisites ?? [];
	}, [selectedBlueprint]);

	/** Whether all prerequisites have a selected instance */
	const allPrereqsMet = useMemo(() => {
		if (prerequisites.length === 0) return true;
		return prerequisites.every((p: any) => !!prereqInstanceIds[Number(p.requiredBlueprintId)]);
	}, [prerequisites, prereqInstanceIds]);

	/** Eligible completed instances per required blueprint, filtered by selected office */
	const eligibleByBlueprintId = useMemo(() => {
		const map: Record<number, OperationInstance[]> = {};
		for (const prereq of prerequisites) {
			const bpId = Number(prereq.requiredBlueprintId);
			map[bpId] = instances.filter((inst: any) =>
				inst.blueprintId === bpId &&
				(!selectedOfficeId || inst.officeId === selectedOfficeId) &&
				inst.status === OperationInstanceStatus.COMPLETED_READY
			);
		}
		return map;
	}, [prerequisites, instances, selectedOfficeId]);

	/** Whether creation is allowed */
	const canCreate = !!selectedBlueprint && !!selectedOfficeId && allPrereqsMet;

	/** Manage to create a new instance */
	const handleCreate = async (): Promise<void> => {
		if (!canCreate) return;

		const response = await createInstance({
			input: {
				blueprintId: selectedBlueprint!.id,
				officeId: selectedOfficeId!,
				description: customDescription || selectedBlueprint!.description
			}
		});

		const createResult = (response as any)?.data?.data;
		if (!createResult?.success) return;

		// If GLOBAL blueprint with prerequisites, link the selected instances
		if (prerequisites.length > 0) {
			const freshResponse = await retrieveInstances();
			const allInstances: any[] = (freshResponse as any)?.data?.data ?? [];
			const newInstance = allInstances
				.filter((i: any) =>
					String(i.blueprintId) === String(selectedBlueprint!.id) &&
					String(i.officeId) === String(selectedOfficeId)
				)
				.sort((a: any, b: any) => Number(b.id) - Number(a.id))[0];

			if (newInstance?.id) {
				const selectedIds = Object.values(prereqInstanceIds).filter(Boolean) as number[];
				if (selectedIds.length > 0) {
					await linkInstances({
						input: {
							sourceInstanceId: String(newInstance.id),
							targetInstanceIds: selectedIds.map(String),
							linkType: 'GLOBAL_OTHER'
						}
					});
				}
			}
		}

		navigate("/workspace");
	};

	return (
		<div className="h-full flex flex-col md:flex-row">
			{/* Left Panel */}
			<div className="px-6 py-3 lg:px-12 overflow-y-auto w-full md:w-62.5 lg:w-87.5 shrink-0 flex flex-col justify-between text-white relative animate-in rounded-md slide-in-from-left duration-500 bg-[#FFBF00]">
				<div>
					<Button variant="ghost" onClick={() => navigate('/workspace')}>
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
						{[
							'Select an operation blueprint to base your instance on',
							'Choose the office this instance belongs to',
							'Work through each step, uploading documents and filling templates',
							'Request global operations when prerequisites are met'
						].map((feature, i) => (
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

			{/* Right Panel */}
			<div className="flex-1 p-6 lg:p-12 overflow-y-auto">
				<div className="w-full">
					<div className="space-y-10 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
						<div>
							<h2 className="text-3xl font-[Lato-Bold] text-foreground mb-3"> Select Blueprint </h2>
							<p className="text-lg text-muted-foreground font-[Lato-Light]"> Choose an operation blueprint and office to start working. </p>
						</div>

						{/* Blueprint selection */}
						<div className="space-y-3">
							<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Operation Blueprint </label>

							{/* Type tabs */}
							<div className="flex gap-2 p-1 bg-black/4 rounded-xl w-fit">
								{ ([OperationType.OTHER, OperationType.GLOBAL] as OperationType[]).map((type) => (
									<button key={type} onClick={() => { setActiveType(type); setSelectedBlueprint(null); }}
										className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-[Lato-Bold] transition-all duration-200 cursor-pointer ${
											activeType === type ? 'bg-white shadow-sm text-black/80' : 'text-black/40 hover:text-black/60'
										}`}
									>
										{ type === OperationType.GLOBAL ?
											<Globe className="w-3.5 h-3.5 text-violet-500" />
										:
											<FolderCog className="w-3.5 h-3.5 text-amber-500" />
										}
										{ type === OperationType.GLOBAL ? 'Global' : 'Other' }
									</button>
								))}
							</div>

							{ filteredBlueprints.length === 0 ?
								<div className="p-8 border border-dashed border-black/10 rounded-xl text-center">
									<FolderCog className="w-8 h-8 text-black/20 mx-auto mb-2" />
									<p className="text-sm text-black/40 font-[Lato-Regular]"> No published blueprints available. </p>
									<p className="text-xs text-black/30 font-[Lato-Regular] mt-1"> Create and publish operation blueprints first. </p>
								</div>
							:
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{ filteredBlueprints.map((bp) => (
										<button key={bp.id} onClick={() => setSelectedBlueprint(bp)}
											className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
												selectedBlueprint?.id === bp.id ? 'border-[#FFBF00] bg-amber-50/50 ring-2 ring-[#FFBF00]/20 shadow-sm' : 'border-black/6 bg-white hover:border-black/12 hover:shadow-sm'
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														{ bp.type === OperationType.GLOBAL ?
															<Globe className="w-3.5 h-3.5 text-violet-500 shrink-0" />
														:
															<FolderCog className="w-3.5 h-3.5 text-amber-500 shrink-0" />
														}
														<span className="text-sm font-[Lato-Bold] text-black/80 truncate"> { bp.title } </span>
													</div>
													<p className="text-xs text-black/40 font-[Lato-Regular] line-clamp-2"> { bp.description || 'No description' } </p>
													<div className="flex items-center gap-2 mt-2">
														<span className="text-[10px] font-[Lato-Bold] px-2 py-0.5 rounded-full bg-black/4 text-black/50"> { bp.subType } </span>
														<span className="text-[10px] text-black/30 font-[Lato-Regular]"> { bp.steps.length } steps </span>
													</div>
												</div>
												{ selectedBlueprint?.id === bp.id &&
													<div className="w-5 h-5 rounded-full bg-[#FFBF00] flex items-center justify-center shrink-0">
														<Check className="w-3 h-3 text-neutral-800" />
													</div>
												}
											</div>
										</button>
									))}
								</div>
							}
						</div>

						{/* Description */}
						{ selectedBlueprint &&
							<div className="space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
								<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Description </label>
								<textarea
									value={customDescription}
									onChange={e => setCustomDescription(e.target.value)}
									placeholder="Describe this operation instance..."
									rows={3}
									className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm font-[Lato-Regular] text-black/70 focus:outline-none focus:border-[#FFBF00]/50 transition-all shadow-sm resize-none"
								/>
							</div>
						}

						{/* Prerequisites — only for GLOBAL blueprints that have requirements */}
						{ selectedBlueprint && prerequisites.length > 0 &&
							<div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
								<div>
									<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Prerequisites </label>
									<p className="text-xs font-[Lato-Regular] text-black/40 mt-1">
										This global operation requires completed instances of the following types. Select one per requirement.
									</p>
								</div>

								{ prerequisites.map((prereq: any) => {
									const bpId = Number(prereq.requiredBlueprintId);
									const eligible = eligibleByBlueprintId[bpId] ?? [];
									const selectedId = prereqInstanceIds[bpId] ?? null;

									return (
										<div key={prereq.id} className="p-4 rounded-xl border border-black/8 bg-[#F8F9FA] space-y-3">
											<div className="flex items-center gap-2">
												<Link2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
												<span className="text-sm font-[Lato-Bold] text-black/70">
													{ prereq.requiredBlueprint?.title ?? `Blueprint #${bpId}` }
												</span>
												<span className="text-[10px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-black/5 text-black/40">
													{ prereq.requiredBlueprint?.subType }
												</span>
												{ selectedId
													? <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
													: <AlertTriangle className="w-4 h-4 text-amber-400 ml-auto shrink-0" />
												}
											</div>

											{ eligible.length === 0 ? (
												<div className="flex items-center justify-between py-1">
													<p className="text-xs text-black/40 font-[Lato-Regular]">
														No completed instances available{ selectedOfficeId ? ' for this office' : '' }.
													</p>
													<button
														onClick={() => navigate('/workspace/new', { state: { preselectedBlueprintId: bpId } })}
														className="text-xs font-[Lato-Bold] text-violet-600 hover:underline cursor-pointer shrink-0 ml-3 transition-colors"
													>
														Create it first →
													</button>
												</div>
											) : (
												<div className="space-y-1.5">
													{ eligible.map((inst: any) => (
														<button
															key={inst.id}
															onClick={() => setPrereqInstanceIds(prev => ({ ...prev, [bpId]: prev[bpId] === inst.id ? null : inst.id }))}
															className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
																selectedId === inst.id
																	? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/20'
																	: 'border-black/6 bg-white hover:border-black/12'
															}`}
														>
															<div className="flex items-center justify-between">
																<div>
																	<p className="text-xs font-[Lato-Bold] text-black/70"> { inst.title } </p>
																	<p className="text-[10px] font-[Lato-Regular] text-black/35"> { inst.code } </p>
																</div>
																{ selectedId === inst.id &&
																	<div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
																		<Check className="w-2.5 h-2.5 text-white" />
																	</div>
																}
															</div>
														</button>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						}

						{/* Office selection */}
						{ selectedBlueprint &&
							<div className="space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
								<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Office </label>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									{ officesUser.map((office) => (
										<button key={office.id} onClick={() => setSelectedOfficeId(office.id)}
											className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
												selectedOfficeId === office.id ? 'border-[#FFBF00] bg-amber-50/50 ring-2 ring-[#FFBF00]/20 shadow-sm' : 'border-black/6 bg-white hover:border-black/12 hover:shadow-sm'
											}`}
										>
											<span className="text-sm font-[Lato-Bold] text-black/80"> { office.name } </span>
										</button>
									))}
								</div>
							</div>
						}

						{/* Actions */}
						<div className="pt-10 border-t border-border flex items-center justify-end gap-6">
							<Button variant="secondary" size="lg" onClick={() => navigate('/workspace')} className="rounded-xl">
								{ t('buttons.cancel') }
							</Button>
							<Button variant="primary" size="lg" onClick={handleCreate} className="rounded-xl" disabled={!canCreate}>
								Start Instance
								<ChevronRight className="w-5 h-5" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WorkspaceNew;
