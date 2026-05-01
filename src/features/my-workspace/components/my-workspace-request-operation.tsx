import {
	useEffect,
	useMemo,
	useState,
	type ReactElement
} from "react";
import LaunchOperationDialog from "./launch-operation-dialog/launch-operation-dialog";
import {
	useNavigate
} from "react-router-dom";
import {
	X,
	Globe,
	Check,
	Link2,
	AlertCircle,
	Plus
} from "lucide-react";
import {
	Badge
} from "../../../shared/components/badge";
import {
	useToast
} from "../../../shared/hooks/useToast";
import {
	LinkType,
	OperationBlueprintStatus,
	OperationInstanceStatus,
	OperationType,
	type ApiResponse,
	type OperationInstance
} from "@l-ark/types";
import {
	filterEligibleInstances,
	PREREQUISITE_ELIGIBLE_STATUSES,
} from "../utils/eligible-instances";
import {
	useOperationInstance
} from "../../../server/hooks/useOperationInstance";
import {
	useOperationBlueprint
} from "../../../server/hooks/useOperationBlueprint";
import {
	useWorkspaceInstanceContext
} from "../context/workspace-instance.context";
import type {
	FetchResult
} from "@apollo/client";
import Button from "../../../shared/components/button";

interface PropTypes {
	onClose: () => void;
	onSuccess?: () => void;
}

const MyWorkspaceRequestOperation = (props: PropTypes): ReactElement => {
	/** Retrieve component properties */
	const { onClose, onSuccess } = props;
	/** My workspace utilities */
	const { instance } = useWorkspaceInstanceContext();
	/** Navigation utilities */
	const navigate = useNavigate();
	/** Operation instances api utilities */
	const { instances, retrieveInstances, createInstance, linkInstances, updateInstanceStatus } = useOperationInstance();
	/** Operation blueprint api utilities */
	const { blueprints, retrieveBlueprints } = useOperationBlueprint();
	/** Toast utilities */
	const { onToast } = useToast();
	/** Selected global and other instance IDs */
	const [selectedGlobalBlueprintId, setSelectedGlobalBlueprintId] = useState<number | null>(null);
	/** When the user has finished picking instances, the launch dialog opens to set title/description + shared docs */
	const [showLaunchDialog, setShowLaunchDialog] = useState<boolean>(false);
	
	if( !instance ) {
		return <></>;
	}

	/** Manage the selected other instance id */
	const [selectedOtherInstanceIds, setSelectedOtherInstanceIds] = useState<number[]>([instance.id]);

	useEffect(() => {
		retrieveBlueprints();
		retrieveInstances();
	}, []);

	/** Manage to memorize the available global blueprints */
	const availableGlobalBlueprints = useMemo(() => {
		return blueprints.filter((op) =>
			op.type === OperationType.GLOBAL
			&& op.status !== OperationBlueprintStatus.DRAFT
			&& op.status !== OperationBlueprintStatus.ARCHIVED
		);
	}, [blueprints]);
	/** Retrieve the information of the selected global blueprint */
	const selectedGlobalBlueprint = availableGlobalBlueprints.find((bp) => bp.id === selectedGlobalBlueprintId);
	
	/** Manage to memorize the prerequisites need it for the current operation */
	const requiredOtherBlueprints = useMemo(() => {
		if ( !selectedGlobalBlueprint ) return [];
		return (selectedGlobalBlueprint.prerequisites ?? []).map(p => p.requiredBlueprint).filter(Boolean);
	}, [selectedGlobalBlueprint]);
	/** Manage to memorize the required blueprints ids */
	const requiredBlueprintIds = useMemo(() => new Set((requiredOtherBlueprints ?? []).map((bp) => bp.id)), [requiredOtherBlueprints]);
	/** Get eligible completed other instances for each required blueprint  */
	const eligibleInstances = useMemo(() => {
		const map: Record<number, OperationInstance[]> = {};

		for (const reqBp of requiredOtherBlueprints) {
			const bpId = parseInt(reqBp.id);
			map[bpId] = filterEligibleInstances({
				instances,
				blueprintId: bpId,
				officeId: instance.officeId,
				allowedStatuses: PREREQUISITE_ELIGIBLE_STATUSES,
				alwaysIncludeId: instance.id,
			});
		}
		return map;
	}, [requiredOtherBlueprints, instances, instance.officeId, instance.id]);
	/** Additional non-required OTHER instances from the same office that are completed */
	const additionalEligibleInstances = useMemo(() => {
		if ( !selectedGlobalBlueprint ) return [];
		// Same eligibility rules as required prerequisites, except: must NOT be the
		// current instance, must NOT match a required blueprint id, must be OTHER type.
		return instances.filter(inst => {
			if ( inst.id === instance.id || inst.officeId !== instance.officeId ) return false;
			if ( inst.blueprint?.type !== OperationType.OTHER ) return false;
			if ( requiredBlueprintIds.has(inst.blueprintId) ) return false;
			if ( !PREREQUISITE_ELIGIBLE_STATUSES.has(inst.status as OperationInstanceStatus) ) return false;
			const maxGlobal = inst.blueprint?.maxGlobalOperations ?? null;
			const currentGlobalCount = (inst.targetLinks ?? []).filter(l => l.linkType === LinkType.GLOBAL_OTHER).length;
			return maxGlobal === null || currentGlobalCount < maxGlobal;
		});
	}, [selectedGlobalBlueprint, instances, instance.id, instance.officeId, requiredBlueprintIds]);

	/** Manage to select the other operatio instance selected by the user */
	const toggleOtherInstance = (instanceId: number): void => {
		setSelectedOtherInstanceIds((prev) => prev.includes(instanceId) ? prev.filter((id) => id !== instanceId) : [...prev, instanceId]);
	};

	/** Manage to memorize if all the requirements are met */
	const allRequirementsMet = useMemo(() => {
		if ( !selectedGlobalBlueprint ) return false;
		if ( requiredOtherBlueprints.length === 0 ) return true;
		
		return requiredOtherBlueprints.every(bp => {
			return selectedOtherInstanceIds.some(instId => {
				const inst = instances.find((i) => i.id === instId) ?? (instId === instance.id ? instance : undefined);

				return inst?.blueprintId === parseInt(bp.id.toString());
			});
		});
	}, [selectedGlobalBlueprint, requiredOtherBlueprints, selectedOtherInstanceIds, instances, instance]);

	/** Manage to link the operation (and create if needed). Now accepts custom title/description and shared docs. */
	const performRequest = async (payload: { title: string; description: string; sharedFormInstanceIds: number[]; sharedDocumentIds: number[] }): Promise<void> => {
		if ( !selectedGlobalBlueprint || !allRequirementsMet ) return;

		const response: FetchResult<{ data: ApiResponse }> = await createInstance({ input: {
			blueprintId: selectedGlobalBlueprint.id,
			officeId: instance.officeId,
			title: payload.title,
			description: payload.description || (selectedGlobalBlueprint.description ?? ''),
		} });

		if ( !response.data?.data?.success ) return;

		onToast({ message: response.data.data.message, type: "success" });
		setShowLaunchDialog(false);
		onSuccess?.();
		onClose();

		const freshResponse = await retrieveInstances();
		const allInstances: any[] = freshResponse?.data?.data ?? [];

		const newGlobalInstance = allInstances
			.filter(i => i.blueprintId === parseInt(selectedGlobalBlueprint.id.toString()) && i.officeId === instance.officeId)
			.sort((a, b) => b.id - a.id)[0];

		if ( newGlobalInstance?.id ) {
			await linkInstances({ input: {
				sourceInstanceId: newGlobalInstance.id,
				targetInstanceIds: selectedOtherInstanceIds,
				linkType: LinkType.GLOBAL_OTHER,
				sharedFormInstanceIds: payload.sharedFormInstanceIds,
				sharedDocumentIds: payload.sharedDocumentIds,
			} });

			await Promise.all( selectedOtherInstanceIds.map((instId) => updateInstanceStatus({ id: instId, status: OperationInstanceStatus.CLOSED }) ));

			navigate(`/workspace/detail/${newGlobalInstance.id}`);
		} else {
			navigate("/workspace");
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
							<Globe className="w-4 h-4 text-violet-600" />
						</div>
						<div>
							<h2 className="text-lg font-[Lato-Bold] text-black/80"> Request Global Operation </h2>
							<p className="text-xs font-[Lato-Regular] text-black/40"> Link completed instances and request a global operation </p>
						</div>
					</div>
					<button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:bg-black/4 hover:text-black/60 transition-all cursor-pointer">
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					<div>
						<h3 className="text-sm font-[Lato-Bold] text-black/70 mb-3">  1. Select Global Operation  </h3>
						{ availableGlobalBlueprints.length === 0 ?
							<div className="p-6 border border-dashed border-black/10 rounded-xl text-center">
								<AlertCircle className="w-6 h-6 text-black/20 mx-auto mb-2" />
								<p className="text-sm text-black/40 font-[Lato-Regular]"> No global operations available. </p>
							</div>
						:
							<div className="space-y-2">
								{ availableGlobalBlueprints.map((bp) => (
									<button key={bp.id} onClick={() => setSelectedGlobalBlueprintId(bp.id)}
										className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
											selectedGlobalBlueprintId === bp.id
												? "border-violet-400 bg-violet-50/50 ring-2 ring-violet-400/20 shadow-sm"
												: "border-black/6 bg-white hover:border-black/12"
										}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<Globe className="w-4 h-4 text-violet-500 shrink-0" />
												<div>
													<span className="text-sm font-[Lato-Bold] text-black/80"> { bp.title } </span>
													<span className="text-xs text-black/40 font-[Lato-Regular] ml-2"> { bp.subType } </span>
												</div>
											</div>
											{ selectedGlobalBlueprintId === bp.id &&
												<div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
													<Check className="w-3 h-3 text-white" />
												</div>
											}
										</div>
										{ (bp.prerequisites?.length ?? 0) > 0 &&
											<div className="mt-2 ml-7 flex items-center gap-1">
												<span className="text-[10px] text-black/30 font-[Lato-Regular]"> Requires: </span>
												{ bp.prerequisites.map(p => (
													<Badge key={p.id} variant="secondary" className="text-[9px]">
														{ p.requiredBlueprint?.subType ?? p.requiredBlueprintId }
													</Badge>
												))}
											</div>
										}
									</button>
								))}
							</div>
						}
					</div>

					{ selectedGlobalBlueprint && requiredOtherBlueprints.length > 0 &&
						<div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
							<h3 className="text-sm font-[Lato-Bold] text-black/70 mb-3"> 2. Link Required Instances </h3>
							<div className="space-y-4">
								{ requiredOtherBlueprints.map(reqBp => {
									const eligible = eligibleInstances[reqBp.id] ?? [];
									const hasSelected = selectedOtherInstanceIds.some((instId) => {
										const inst = instances.find((i) => i.id === instId) ?? (instId === instance.id ? instance : undefined);
										return inst?.blueprintId === reqBp.id;
									});

									return (
										<div key={reqBp.id} className="p-4 rounded-xl border border-black/6 bg-[#F8F9FA]">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<Link2 className="w-3.5 h-3.5 text-amber-500" />
													<span className="text-sm font-[Lato-Bold] text-black/70"> { reqBp.title } </span>
													<Badge variant="secondary" className="text-[9px]"> { reqBp.subType } </Badge>
												</div>
												{ hasSelected ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-400" /> }
											</div>

											{ eligible.length === 0 ?
												<div className="flex items-center justify-between py-2">
													<p className="text-xs text-black/40 font-[Lato-Regular]">
														No completed instances of this type available in your office.
													</p>
													<button onClick={() => {
															onClose();
															navigate("/workspace/new", { state: { preselectedBlueprintId: reqBp.id } });
														}}
														className="text-xs font-[Lato-Bold] text-violet-600 hover:text-violet-800 hover:underline cursor-pointer shrink-0 ml-3 transition-colors"
													>
														Create it now →
													</button>
												</div>
											:
												<div className="space-y-1.5">
													{ eligible.map(inst => {
														const isSelected = selectedOtherInstanceIds.includes(inst.id);
														const isCurrent = inst.id === instance.id;

														return (
															<button key={inst.id} onClick={() => !isCurrent && toggleOtherInstance(inst.id)} disabled={isCurrent}
																className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
																	isCurrent ? "border-[#FFBF00]/40 bg-amber-50/40 cursor-default" : isSelected
																	? "border-emerald-400 bg-emerald-50/40 cursor-pointer"
																	: "border-black/4 bg-white hover:border-black/8 cursor-pointer"
																}`}
															>
																<div className="flex items-center justify-between">
																	<div>
																		<span className="text-xs font-[Lato-Bold] text-black/70"> { inst.title } </span>
																		{ isCurrent &&
																			<span className="text-[10px] text-amber-500 font-[Lato-Bold] ml-2"> (current) </span>
																		}
																	</div>
																	{ (isSelected || isCurrent) &&
																		<div className={`w-4 h-4 rounded-full flex items-center justify-center ${ isCurrent ? "bg-[#FFBF00]" : "bg-emerald-500" }`}>
																			<Check className="w-2.5 h-2.5 text-white" />
																		</div>
																	}
																</div>
																<span className="text-[10px] text-black/30 font-[Lato-Regular]"> { inst.code } </span>
															</button>
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

					{ selectedGlobalBlueprint && additionalEligibleInstances.length > 0 &&
						<div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
							<h3 className="text-sm font-[Lato-Bold] text-black/70 mb-1">
								{ requiredOtherBlueprints.length > 0 ? "3." : "2." } Additional Links{ " " }
								<span className="font-[Lato-Regular] text-black/40"> (optional) </span>
							</h3>
							<p className="text-xs text-black/40 font-[Lato-Regular] mb-3">
								Optionally link other completed operations to this global request.
							</p>
							<div className="space-y-1.5">
								{ additionalEligibleInstances.map(inst => {
									const isSelected = selectedOtherInstanceIds.includes(inst.id);

									return (
										<button key={inst.id} onClick={() => toggleOtherInstance(inst.id)}
											className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
												isSelected ? "border-emerald-400 bg-emerald-50/40" : "border-black/4 bg-white hover:border-black/8"
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Plus className="w-3.5 h-3.5 text-black/30 shrink-0" />
													<div>
														<span className="text-xs font-[Lato-Bold] text-black/70"> { inst.title } </span>
														<Badge variant="secondary" className="text-[9px] ml-2">
															{ inst.blueprint?.subType }
														</Badge>
													</div>
												</div>
												{ isSelected &&
													<div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
														<Check className="w-2.5 h-2.5 text-white" />
													</div>
												}
											</div>
											<span className="text-[10px] text-black/30 font-[Lato-Regular] ml-6"> { inst.code } </span>
										</button>
									);
								})}
							</div>
						</div>
					}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-black/6 flex items-center justify-end gap-3">
					<Button variant="secondary" onClick={onClose}> Cancel </Button>
					<Button variant="primary" onClick={() => setShowLaunchDialog(true)} disabled={!allRequirementsMet}>
						<Globe className="w-4 h-4" />
						Request Global Operation
					</Button>
				</div>
			</div>

			{ showLaunchDialog && selectedGlobalBlueprint &&
				<LaunchOperationDialog
					isOpen={showLaunchDialog}
					onClose={() => setShowLaunchDialog(false)}
					fixedBlueprint={{ id: selectedGlobalBlueprint.id, title: selectedGlobalBlueprint.title, description: selectedGlobalBlueprint.description ?? undefined, subType: selectedGlobalBlueprint.subType }}
					headerTitle="Request Global Operation"
					headerSubtitle="Set the title, description, and pick documents to share."
					submitLabel="Request"
					onSubmit={performRequest}
				/>
			}
		</div>
	);
};

export default MyWorkspaceRequestOperation;
