import {
	type ReactElement
} from "react";
import {
	Building2,
	User,
	Calendar,
	Link2,
	ExternalLink,
	ArrowRight,
	Globe,
	FolderCog
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
import {
	useNavigate
} from "react-router-dom";
import Button from "../../../shared/components/button";
import { INSTANCE_STATUS_COLORS } from "../utils/my-workspace.utils";

const MyWorkspaceInstanceRightPanel = (): ReactElement => {
	/** My workspace utilities */
	const { instance, linkedGlobalInstances, linkedOtherInstances, launchedFromInstance } = useWorkspaceInstanceContext();
	/** Navigation utilities */
	const navigate = useNavigate();
	/** To whom is assigned the current operation instance */
	const assignee = instance?.assignedTo;
	/** Who created this operation instance */
	const creator = instance?.createdBy;
	/** Has any links */
	const hasLinks = linkedGlobalInstances.length > 0 || linkedOtherInstances.length > 0 || launchedFromInstance || (instance?.sourceLinks?.length ?? 0) > 0 || (instance?.targetLinks?.length ?? 0) > 0;

	if( !instance ) {
		return <></>;
	}

	return (
		<div className="w-72 shrink-0 bg-white rounded-xl border border-black/6 shadow-sm overflow-hidden flex flex-col">
			<div className="px-4 py-3 border-b border-black/6">
				<h3 className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> Operation Information </h3>
			</div>

			<div className="flex-1 overflow-y-auto">
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

					{/* Description */}
					{ instance?.description &&
						<div className="flex items-center gap-2">
							<Building2 className="w-3.5 h-3.5 text-black/25 shrink-0" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Description </p>
								<p className="text-xs font-[Lato-Regular] text-black/60 truncate"> { instance.description } </p>
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
							<Building2 className="w-3.5 h-3.5 text-black/25 shrink-0" />
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
							{ assignee ?
								<div className="flex items-center gap-1.5 mt-0.5">
									<div className="w-4 h-4 rounded-full bg-black/6 flex items-center justify-center shrink-0">
										<span className="text-[8px] font-[Lato-Bold] text-black/50 uppercase">
											{ assignee.firstName?.charAt(0)}{assignee.lastName?.charAt(0) }
										</span>
									</div>
									<p className="text-xs font-[Lato-Regular] text-black/60 truncate">
										{ assignee.firstName } { assignee.lastName }
									</p>
								</div>
							:
								<p className="text-xs font-[Lato-Regular] text-black/30"> Unassigned </p>
							}
						</div>
					</div>

					{/* Created by */}
					{ creator &&
						<div className="flex items-center gap-2">
							<User className="w-3.5 h-3.5 text-black/25 shrink-0" />
							<div className="min-w-0">
								<p className="text-[10px] font-[Lato-Bold] text-black/35 uppercase tracking-wider"> Created By </p>
								<p className="text-xs font-[Lato-Regular] text-black/60 truncate">
									{ creator.firstName } { creator.lastName }
								</p>
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
								<Button variant="link" onClick={() => navigate(`/workspace/detail/${launchedFromInstance.id}`)}>
									<ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
									<span className="text-xs font-[Lato-Regular] text-blue-600 flex-1 truncate">
										{ launchedFromInstance.title }
									</span>
									<ArrowRight className="w-3 h-3 text-blue-300 group-hover:text-blue-500 transition-colors shrink-0" />
								</Button>
							}

							{ linkedGlobalInstances.map(gi => {
								const colors = INSTANCE_STATUS_COLORS[gi.status as keyof typeof INSTANCE_STATUS_COLORS];
								return (
									<button key={gi.id} onClick={() => navigate(`/workspace/detail/${gi.id}`)}
										className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-violet-50/60 transition-colors cursor-pointer group"
									>
										<Link2 className="w-3 h-3 text-violet-400 shrink-0" />
										<span className="text-xs font-[Lato-Regular] text-violet-600 flex-1 truncate"> { gi.title } </span>
										{ colors &&
											<span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
												{gi.status.replace(/_/g, " ")}
											</span>
										}
										<ArrowRight className="w-3 h-3 text-violet-300 group-hover:text-violet-500 transition-colors shrink-0" />
									</button>
								);
							})}

							{ linkedOtherInstances.map((oi: any) => {
								const colors = INSTANCE_STATUS_COLORS[oi.status as keyof typeof INSTANCE_STATUS_COLORS];

								return (
									<button key={oi.id} onClick={() => navigate(`/workspace/detail/${oi.id}`)}
										className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50/60 transition-colors cursor-pointer group"
									>
										<Link2 className="w-3 h-3 text-amber-400 shrink-0" />
										<div className="flex-1 min-w-0">
											<span className="text-xs font-[Lato-Regular] text-amber-700 truncate block"> { oi.title } </span>
											<span className="text-[9px] font-[Lato-Regular] text-amber-400/80"> { oi.code } </span>
										</div>
										{ colors &&
											<span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
												{ oi.status.replace(/_/g, " ") }
											</span>
										}
										<ArrowRight className="w-3 h-3 text-amber-300 group-hover:text-amber-500 transition-colors shrink-0" />
									</button>
								);
							})}

							{ instance.sourceLinks.filter(l => l.linkType === LinkType.OTHER_OTHER).length > 0 &&
								<div className="space-y-1 mb-3">
									{ instance.sourceLinks.filter(l => l.linkType === LinkType.OTHER_OTHER).map(l => (
										<div key={l.id} onClick={() => navigate(`/workspace/detail/${l.targetInstanceId}`)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-50/60 transition-colors cursor-pointer group">
											<Link2 className="w-3 h-3 text-blue-400 shrink-0" />
											<div className="flex-1 min-w-0">
												<span className="text-xs font-[Lato-Regular] text-blue-700 truncate block"> { l.targetInstance.title } </span>
												<span className="text-[9px] font-[Lato-Regular] text-blue-400/80"> { l.targetInstance.code } </span>
											</div>
											<span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full shrink-0`}>
												{ l.targetInstance.status.replace(/_/g, " ") }
											</span>
											<ArrowRight className="w-3 h-3 text-blue-300 group-hover:text-blue-500 transition-colors shrink-0" />
										</div>
									))}
								</div>
							}
							{ instance.targetLinks.filter(l => l.linkType === LinkType.OTHER_OTHER).length > 0 &&
								<div className="space-y-1 mb-3">
									{ instance.targetLinks.filter(l => l.linkType === LinkType.OTHER_OTHER).map(l => (
										<div key={l.id} onClick={() => navigate(`/workspace/detail/${l.sourceInstanceId}`)} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-50/60 transition-colors cursor-pointer group">
											<Link2 className="w-3 h-3 text-blue-400 shrink-0" />
											<div className="flex-1 min-w-0">
												<span className="text-xs font-[Lato-Regular] text-blue-700 truncate block"> { l.sourceInstance.title } </span>
												<span className="text-[9px] font-[Lato-Regular] text-blue-400/80"> { l.sourceInstance.code } </span>
											</div>
											<span className={`text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full shrink-0`}>
												{ l.sourceInstance.status.replace(/_/g, " ") }
											</span>
											<ArrowRight className="w-3 h-3 text-blue-300 group-hover:text-blue-500 transition-colors shrink-0" />
										</div>
									))}
								</div>
							}
						</div>
					</div>
				}
			</div>
		</div>
	);
};

export default MyWorkspaceInstanceRightPanel;
