import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactElement
} from "react";
import {
	useNavigate
} from "react-router-dom";
import {
	Plus,
	MoreVertical,
	FileEdit,
	FolderCog,
	Trash2,
	Inbox,
	Filter,
	Globe
} from "lucide-react";
import {
	format
} from "date-fns";
import {
	Pagination
} from "antd";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "../../shared/components/dropdown-button";
import {
	Badge
} from "../../shared/components/badge";
import {
	useToast
} from "../../shared/hooks/useToast";
import {
	getResponseMessage
} from "../../server/hooks/useApolloWithToast";
import {
	OperationInstanceStatus,
	OperationType,
	StepInstanceStatus,
	type ApiResponse,
	type OperationInstance
} from '@l-ark/types';
import {
	useOperation
} from "../../server/hooks/useOperation";
import {
	INSTANCE_STATUS_COLORS
} from "./workspace.constants";
import type {
	FetchResult
} from "@apollo/client";
import Button from "../../shared/components/button";

type FilterStatus = 'ALL' | OperationInstanceStatus;

const WorkspaceManagement = (): ReactElement => {
	/** Navigation utilities */
	const navigate = useNavigate();
	/** Operation api utilities */
	const { instances, retrieveInstances, deleteInstance } = useOperation();
	/** Toast utilities */
	const { onConfirmationToast, onToast } = useToast();
	/** State to manage the filter */
	const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
	/** State to manage the pagination */
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(10);
	/** Ref to the scrollable container */
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	/** Filter definitions */
	const filterOptions: { label: string; value: FilterStatus }[] = [
		{ label: 'All', value: 'ALL' },
		{ label: 'Draft', value: OperationInstanceStatus.DRAFT },
		{ label: 'Active', value: OperationInstanceStatus.ACTIVE },
		{ label: 'Completed', value: OperationInstanceStatus.COMPLETED_READY },
		{ label: 'Linked', value: OperationInstanceStatus.LINKED },
		{ label: 'Closed', value: OperationInstanceStatus.CLOSED },
		{ label: 'Pending Payment', value: OperationInstanceStatus.PENDING_PAYMENT },
		{ label: 'Partially Closed', value: OperationInstanceStatus.PARTIALLY_CLOSED },
	];

	useEffect(() => {
		retrieveInstances();
	}, []);

	/** Reset page to 1 when filter changes */
	useEffect(() => {
		setCurrentPage(1);
	}, [filterStatus]);

	/** Manage to sort the instances of the operation */
	const sortedInstances = useMemo((): OperationInstance[] => {
		const filtered = filterStatus === 'ALL' ? instances : instances.filter((inst) => inst.status === filterStatus);

		return [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [instances, filterStatus]);

	/** Paginated instances */
	const paginatedInstances = useMemo((): OperationInstance[] => {
		const start = (currentPage - 1) * pageSize;

		return sortedInstances.slice(start, start + pageSize);
	}, [sortedInstances, currentPage, pageSize]);

	/** Redirect the user to the detail page */
	const goToDetail = (id: number): void => {
		navigate(`/workspace/detail/${id}`);
	};

	/** Redirect the user to the new instance page */
	const goToNewInstance = (): void => {
		navigate("/workspace/new");
	};

	/** Manage to delete an instance */
	const handleDelete = async (e: React.MouseEvent, inst: OperationInstance): Promise<void> => {
		e.stopPropagation();

		const { confirmed } = await onConfirmationToast({
			title: 'Delete this instance?',
			description: `"${inst.title}" will be permanently deleted. This action cannot be undone.`,
			actionText: 'Delete',
			cancelText: 'Cancel',
			actionColor: 'error',
		});

		if ( confirmed ) {
			const response: FetchResult<{ data: ApiResponse }> = await deleteInstance({ id: inst.id });

			onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
		}
	};

	/** Retrieve the status color classes derived from shared constants */
	const getStatusBg = (status: OperationInstanceStatus): string => {
		const colors = INSTANCE_STATUS_COLORS[status as keyof typeof INSTANCE_STATUS_COLORS];
		return colors ? `${colors.bg} ${colors.text} ${colors.ring}` : 'bg-slate-50 text-slate-500 ring-slate-500/20';
	};

	/** Retrieve the label depending on the status of the operation instance */
	const getStatusLabel = (status: OperationInstanceStatus): string => {
		switch (status) {
			case OperationInstanceStatus.DRAFT: return 'Draft';
			case OperationInstanceStatus.ACTIVE: return 'Active';
			case OperationInstanceStatus.COMPLETED_READY: return 'Completed';
			case OperationInstanceStatus.LINKED: return 'Linked';
			case OperationInstanceStatus.CLOSED: return 'Closed';
			case OperationInstanceStatus.PENDING_PAYMENT: return 'Pending Payment';
			case OperationInstanceStatus.PARTIALLY_CLOSED: return 'Partially Closed';
			default: return status;
		}
	};

	/** Manage to get the progress percentage (excludes SKIPPED steps) */
	const getStepProgress = (inst: OperationInstance): { total: number; completed: number; pct: number } => {
		const relevant = inst.stepInstances.filter((si) => si.status !== StepInstanceStatus.SKIPPED);
		const total = relevant.length;
		const completed = relevant.filter((si) => si.status === StepInstanceStatus.COMPLETED).length;
		const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

		return { total, completed, pct };
	};

	/** Handle pagination change */
	const onChangePage = (page: number): void => {
		setCurrentPage(page);
		scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	};

	/** Handle page size change */
	const onChangePageSize = (_: number, size: number): void => {
		setPageSize(size);
		setCurrentPage(1);
	};

	return (
		<div className="h-[calc(100%-140px)]">
			<div className="sticky top-0 z-10">
				<div className="flex justify-between items-end">
					<div className="max-w-xl">
						<h1 className="text-4xl font-[Lato-Black] tracking-tight text-black mb-3"> My Workspace </h1>
						<p className="text-md text-black/50 font-[Lato-Regular] leading-relaxed">
							Track and manage your operation instances across all workflows.
						</p>
					</div>
					<Button variant="primary" onClick={goToNewInstance}>
						<Plus className="w-5 h-5" />
						New Instance
					</Button>
				</div>

				{/* Filter bar */}
				<div className="flex items-center gap-2 mt-3">
					<Filter className="w-4 h-4 text-black/30" />
					{ filterOptions.map((opt) =>
						<button key={opt.value} onClick={() => setFilterStatus(opt.value)}
							className={`px-3 py-1.5 rounded-lg text-xs font-[Lato-Bold] transition-all duration-200 cursor-pointer ${
								filterStatus === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-white text-black/50 hover:bg-black/4 border border-black/6'
							}`}
						>
							{ opt.label }
						</button>
					)}
				</div>
			</div>

			<div ref={scrollContainerRef} className="h-full flex-1 flex flex-col overflow-y-auto relative mt-5">
				{ sortedInstances.length > 0 ?
					<>
						{/* Table */}
						<div className="bg-white rounded-2xl border border-black/6 overflow-hidden flex-1">
							{/* Table header */}
							<div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_1.2fr_48px] gap-4 px-6 py-3.5 bg-black/2 border-b border-black/6">
								<span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Name </span>
								<span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Identifier </span>
								<span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Progress </span>
								<span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Responsible </span>
								<span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-wider"> Status </span>
								<span />
							</div>

							{/* Table rows */}
							{ paginatedInstances.map((instance) => {
								const progress = getStepProgress(instance);

								return (
									<div key={instance.id} onClick={() => goToDetail(instance.id)}
										className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_1.2fr_48px] gap-4 px-6 py-4 border-b border-black/4 last:border-b-0 hover:bg-black/1.5 cursor-pointer transition-colors duration-150 items-center"
									>
										<div className="flex items-center gap-3 min-w-0">
											<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/3 shrink-0">
												{ instance.blueprint.type === OperationType.GLOBAL
													? <Globe className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
													: <FolderCog className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
												}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-[Lato-Bold] text-black truncate leading-snug">
													{ instance.title || 'Untitled Instance' }
												</p>
												<p className="text-xs font-[Lato-Regular] text-black/40 truncate mt-0.5">
													{ instance.description || 'No description' }
												</p>
											</div>
										</div>

										<div className="min-w-0">
											{ instance.code ?
												<Badge variant="secondary" className="text-[10px] font-[Lato-Bold] truncate max-w-full"> { instance.code } </Badge>
											:
												<span className="text-xs text-black/30 font-[Lato-Regular]"> — </span>
											}
										</div>

										<div className="flex items-center gap-3">
											<div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden max-w-25">
												<div className="h-full bg-linear-to-r from-[#FFBF00] to-[#D4AF37] rounded-full transition-all duration-500" style={{ width: `${progress.pct}%` }} />
											</div>
											<span className="text-xs font-[Lato-Bold] text-black/40 whitespace-nowrap">
												{ progress.pct }%
											</span>
										</div>

										<div className="min-w-0">
											{ instance.assignedTo ?
												<div className="flex items-center gap-2">
													<div className="w-6 h-6 rounded-full bg-black/6 flex items-center justify-center shrink-0">
														<span className="text-[10px] font-[Lato-Bold] text-black/50 uppercase">
															{ instance.assignedTo.firstName?.charAt(0) }{ instance.assignedTo.lastName?.charAt(0) }
														</span>
													</div>
													<span className="text-sm font-[Lato-Regular] text-black/70 truncate">
														{ instance.assignedTo.firstName } { instance.assignedTo.lastName }
													</span>
												</div>
											:
												<span className="text-xs text-black/30 font-[Lato-Regular]"> Unassigned </span>
											}
										</div>

										<div>
											<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-[Lato-Bold] ring-1 ${getStatusBg(instance.status)}`}>
												{ getStatusLabel(instance.status) }
												<span className="opacity-50"> · </span>
												<span className="font-[Lato-Regular] opacity-75">
													{ format(new Date(instance.updatedAt), 'dd MMM yyyy') }
												</span>
											</span>
										</div>

										<div className="flex justify-center">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<button onClick={(e) => e.stopPropagation()}
														className="flex items-center justify-center h-8 w-8 p-0 rounded-full hover:bg-black/5 transition-colors duration-150 cursor-pointer"
													>
														<MoreVertical className="h-4 w-4 text-black/40" />
													</button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-56 rounded-2xl border-black/5 shadow-xl p-2 bg-white/95 backdrop-blur-xl">
													<DropdownMenuItem className="rounded-xl cursor-pointer p-3 transition-colors hover:bg-black/2" onClick={(e) => { e.stopPropagation(); goToDetail(instance.id); }}>
														<FileEdit className="mr-3 h-4 w-4 text-black/40" />
														<span className="font-[Lato-Regular] text-black/80"> Open Instance </span>
													</DropdownMenuItem>
													<DropdownMenuSeparator className="bg-black/2 my-2" />
													<DropdownMenuItem className="rounded-xl cursor-pointer p-3 text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors" onClick={(e) => handleDelete(e, instance)}>
														<Trash2 className="mr-3 h-4 w-4" />
														<span className="font-[Lato-Regular]"> Delete </span>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								);
							})}
						</div>

						{/* Pagination */}
						<div className="flex items-center justify-end py-4">
							<Pagination
								showSizeChanger
								showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
								current={currentPage}
								total={sortedInstances.length}
								pageSize={pageSize}
								onChange={onChangePage}
								onShowSizeChange={onChangePageSize}
							/>
						</div>
					</>
				:
					/* Empty State */
					<div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-black/6 border-dashed">
						<div className="w-20 h-20 bg-black/3 rounded-2xl flex items-center justify-center mb-6">
							<Inbox className="w-10 h-10 text-black/30" />
						</div>
						<h3 className="text-2xl font-[Lato-Black] text-black mb-2">
							{ filterStatus === 'ALL' ? 'No instances yet' : 'No matching instances' }
						</h3>
						<p className="text-md text-black/50 mb-8 max-w-md font-[Lato-Regular]">
							{ filterStatus === 'ALL' ? 'Start a new operation instance from an existing blueprint to begin tracking your work.' : 'No instances match the current filter. Try a different status filter.' }
						</p>
						{ filterStatus === 'ALL' &&
							<Button variant="primary" onClick={goToNewInstance}>
								<Plus className="w-5 h-5" />
								Start your first instance
							</Button>
						}
					</div>
				}
			</div>
		</div>
	);
};

export default WorkspaceManagement;
