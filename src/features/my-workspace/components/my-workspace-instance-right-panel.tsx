import {
	type ReactElement,
	useMemo,
	useState
} from "react";
import {
	Building2,
	User,
	Calendar,
	Link2,
	ExternalLink,
	Globe,
	FolderCog,
	FileText,
	MapPin
} from "lucide-react";
import {
	LinkType,
	OperationType
} from "@l-ark/types";
import {
	format
} from "date-fns";
import {
	useWorkspaceInstanceContext
} from "../context/workspace-instance.context";
import RightPanelSharedTab from "./right-panel-shared-tab";
import LinkedOperationRow from "./linked-operation-row";
import UserChip from "./user-chip";

const MyWorkspaceInstanceRightPanel = (): ReactElement => {
	/** My workspace utilities */
	const { instance, linkedGlobalInstances, linkedOtherInstances, launchedFromInstance } = useWorkspaceInstanceContext();
	/** To whom is assigned the current operation instance */
	const assignee = instance?.assignedTo;
	/** Who created this operation instance */
	const creator = instance?.createdBy;
	/** Has any links */
	const hasLinks = linkedGlobalInstances.length > 0 || linkedOtherInstances.length > 0 || launchedFromInstance || (instance?.sourceLinks?.length ?? 0) > 0 || (instance?.targetLinks?.length ?? 0) > 0;
	/** Active tab in the right context panel */
	const [activeTab, setActiveTab] = useState<'info' | 'shared'>('info');
	/** Total number of shared rows visible in the Shared tab (incoming + outgoing). */
	const sharedCount = useMemo(() => {
		if (!instance) return 0;
		let n = 0;
		for (const l of (instance.sourceLinks ?? []) as any[]) n += (l.sharedDocuments ?? []).length;
		for (const l of (instance.targetLinks ?? []) as any[]) n += (l.sharedDocuments ?? []).length;
		return n;
	}, [instance]);

	if( !instance ) {
		return <></>;
	}

	const hasAnyDetails = !!instance.description || !!instance.division || !!instance.office || !!assignee || !!creator || !!instance.createdAt;

	return (
		<aside aria-label="Operation context" className="w-64 xl:w-72 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
			<div className="flex border-b border-black/6">
				<button onClick={() => setActiveTab('info')}
					className={`relative flex-1 px-3 py-2.5 text-[11px] font-[Lato-Bold] uppercase tracking-widest transition-colors cursor-pointer ${ activeTab === 'info' ? 'text-black/70' : 'text-black/35 hover:text-black/55' }`}
				>
					Info
					{ activeTab === 'info' && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-amber-400" /> }
				</button>
				<button onClick={() => setActiveTab('shared')}
					className={`relative flex-1 px-3 py-2.5 text-[11px] font-[Lato-Bold] uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${ activeTab === 'shared' ? 'text-black/70' : 'text-black/35 hover:text-black/55' }`}
				>
					Shared
					{ sharedCount > 0 &&
						<span className={`text-[9px] rounded-full px-1.5 py-px ${ activeTab === 'shared' ? 'bg-amber-100 text-amber-700' : 'bg-black/5 text-black/45' }`}>
							{ sharedCount }
						</span>
					}
					{ activeTab === 'shared' && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-amber-400" /> }
				</button>
			</div>

			<div className="flex-1 overflow-y-auto">
				{ activeTab === 'shared' ?
					<RightPanelSharedTab />
				:
				<>
				<div className="px-4 py-3 border-b border-black/6">
					<p className="text-[10px] font-[Lato-Bold] text-black/30 uppercase tracking-widest mb-2">Blueprint</p>
					<div className="flex items-start gap-2">
						<div className="w-7 h-7 rounded-lg bg-black/3 flex items-center justify-center shrink-0 mt-0.5">
							{ instance?.blueprint?.type === OperationType.GLOBAL ? <Globe className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.5} /> : <FolderCog className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} /> }
						</div>
						<div className="min-w-0">
							<p className="text-sm font-[Lato-Bold] text-black/70 truncate">
								{ instance?.blueprint?.title ?? "—" }
							</p>
							<p className="text-[10px] font-[Lato-Regular] text-black/35">
								{ instance?.blueprint?.subType ?? ""} · {instance?.blueprint?.type }
							</p>
						</div>
					</div>
				</div>

				<div className="px-4 py-3 border-b border-black/6 space-y-2.5">
					<p className="text-[10px] font-[Lato-Bold] text-black/30 uppercase tracking-widest mb-1"> Details </p>

					{ !hasAnyDetails &&
						<p className="text-xs font-[Lato-Regular] text-black/30 italic"> No additional details </p>
					}

					{/* Description */}
					{ instance?.description &&
						<div className="flex items-start gap-2">
							<FileText className="w-3.5 h-3.5 text-black/25 shrink-0 mt-0.5" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Description </p>
								<p className="text-xs font-[Lato-Regular] text-black/60 whitespace-pre-wrap wrap-break-word"> { instance.description } </p>
							</div>
						</div>
					}
					
					{/* Division */}
					{ instance?.division &&
						<div className="flex items-center gap-2">
							<Building2 className="w-3.5 h-3.5 text-black/25 shrink-0" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Division </p>
								<p className="text-xs font-[Lato-Regular] text-black/60 truncate"> { instance.division.name } </p>
							</div>
						</div>
					}

					{/* Office */}
					{ instance?.office &&
						<div className="flex items-center gap-2">
							<MapPin className="w-3.5 h-3.5 text-black/25 shrink-0" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Office </p>
								<p className="text-xs font-[Lato-Regular] text-black/60 truncate"> { instance.office.name } </p>
							</div>
						</div>
					}

					{/* Assigned to */}
					<div className="flex items-center gap-2">
						<User className="w-3.5 h-3.5 text-black/25 shrink-0" />
						<div className="min-w-0">
							<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Assigned To </p>
							<UserChip firstName={assignee?.firstName} lastName={assignee?.lastName} emptyText="Unassigned" />
						</div>
					</div>

					{/* Created by */}
					{ creator &&
						<div className="flex items-center gap-2">
							<User className="w-3.5 h-3.5 text-black/25 shrink-0" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Created By </p>
								<UserChip firstName={creator.firstName} lastName={creator.lastName} />
							</div>
						</div>
					}

					{/* Created at */}
					{ instance?.createdAt &&
						<div className="flex items-center gap-2">
							<Calendar className="w-3.5 h-3.5 text-black/25 shrink-0" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Created </p>
								<p className="text-xs font-[Lato-Regular] text-black/60">
									{ format(new Date(instance.createdAt), "dd MMM yyyy") }
								</p>
							</div>
						</div>
					}	
				</div>

				{/* Linked operations */}
				{ hasLinks &&
					<div className="px-4 py-3 border-b border-black/6">
						<p className="text-[10px] font-[Lato-Bold] text-black/30 uppercase tracking-widest mb-2"> Linked Operations </p>
						<div className="space-y-1">
							{ launchedFromInstance &&
								<LinkedOperationRow
									tone="blue"
									icon={<ExternalLink className="w-3 h-3 text-blue-400" />}
									title={launchedFromInstance.title}
								/>
							}

							{ linkedGlobalInstances.map(gi => (
								<LinkedOperationRow key={gi.id}
									tone="violet"
									icon={<Link2 className="w-3 h-3 text-violet-400" />}
									title={gi.title}
									status={gi.status}
								/>
							))}

							{ linkedOtherInstances.map((oi: any) => (
								<LinkedOperationRow key={oi.id}
									tone="amber"
									icon={<Link2 className="w-3 h-3 text-amber-400" />}
									title={oi.title}
									code={oi.code}
									status={oi.status}
								/>
							))}

							{ instance.sourceLinks.filter(l => l.linkType === LinkType.OTHER_OTHER).map(l => (
								<LinkedOperationRow key={`s-${l.id}`}
									tone="blue"
									icon={<Link2 className="w-3 h-3 text-blue-400" />}
									title={l.targetInstance.title}
									code={l.targetInstance.code}
									status={l.targetInstance.status}
								/>
							))}

							{ instance.targetLinks.filter(l => l.linkType === LinkType.OTHER_OTHER).map(l => (
								<LinkedOperationRow key={`t-${l.id}`}
									tone="blue"
									icon={<Link2 className="w-3 h-3 text-blue-400" />}
									title={l.sourceInstance.title}
									code={l.sourceInstance.code}
									status={l.sourceInstance.status}
								/>
							))}
						</div>
					</div>
				}
				</>
				}
			</div>
		</aside>
	);
};

export default MyWorkspaceInstanceRightPanel;
