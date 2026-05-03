import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactElement
} from 'react';
import {
    FileEdit,
    FolderCog,
    Globe,
    Inbox,
    MoreVertical,
    Plus,
    Trash2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../../shared/components/dropdown-button';
import {
    format
} from 'date-fns';
import {
    Pagination
} from 'antd';
import {
    useNavigate
} from 'react-router-dom';
import {
    useToast
} from '../../shared/hooks/useToast';
import {
    LinkType,
    OperationType,
    StepInstanceStatus,
    UserRole,
    type ApiResponse,
    type OperationInstance
} from '@l-ark/types';
import { computeVisibleSteps } from './utils/step-visibility';
import type {
    FetchResult
} from '@apollo/client';
import {
    getResponseMessage
} from '../../server/hooks/useApolloWithToast';
import {
    useOperationInstance
} from '../../server/hooks/useOperationInstance';
import {
    getStatusInstanceBg,
    getStatusInstanceLabel,
    type FilterStatus
} from './utils/my-workspace.utils';
import {
    Badge
} from '../../shared/components/badge';
import MyWorkspaceHeader from './components/my-workspace-header';
import Button from '../../shared/components/button';
import PermissionGate from '../../shared/components/permission-gate';
import usePermissions from '../../shared/hooks/usePermissions';

const MyWorkspaceManagement = (): ReactElement => {
    /** Navigation utilities */
	const navigate = useNavigate();
	/** Operation api utilities */
	const { instances, retrieveInstances, deleteInstance } = useOperationInstance();
	/** Toast utilities */
	const { onConfirmationToast, onToast } = useToast();
	/** State to manage the filter */
	const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
	/** State to manage the pagination */
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(10);
	/** Ref to the scrollable container */
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	/** Permissions utilities */
	const { user } = usePermissions();
	
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
	const goToDetail = (id: number, typeOp: OperationType): void => {
		console.log(user);
		if( user?.role.code === UserRole.C && typeOp === OperationType.GLOBAL ) {
			onToast({ message: 'You don\'t have permissions to access global operations.', type: 'warning' });
			return;
		}
		navigate(`/workspace/detail/${id}`);
	};

	/** Redirect the user to the new instance page */
	const goToNewInstance = (): void => {
		navigate("/workspace/new");
	};

	/** Manage to delete an instance */
	const handleDelete = async (e: React.MouseEvent, inst: OperationInstance): Promise<void> => {
		e.stopPropagation();

		const { pct } = getStepProgress(inst);
		const allCompleted = pct === 100;
		const hasLinks = (inst.sourceLinks?.length ?? 0) > 0 || (inst.targetLinks?.length ?? 0) > 0;

		if ( hasLinks && allCompleted ) {
			onToast({ message: 'This operation cannot be deleted because it is linked to other operations. Unlink it first before deleting.', type: 'error' });
			return;
		}

		const linkedWarning = hasLinks
			? ' It is currently linked to other operations — those links will also be removed.'
			: '';

		const { confirmed } = await onConfirmationToast({
			title: 'Permanently delete this operation?',
			description: `"${inst.title}" and all its data — including uploaded documents and filled forms — will be permanently deleted.${linkedWarning} This action cannot be undone.`,
			actionText: 'Delete',
			cancelText: 'Cancel',
			actionColor: 'error',
		});

		if ( confirmed ) {
            try {
			    const response: FetchResult<{ data: ApiResponse }> = await deleteInstance({ id: inst.id });
			    onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            } catch (e: any) {
                console.error(e);
            }
		}
	};

	/**
	 * Manage to get the progress percentage.
	 * Counts only steps the user can actually see (visibility-aware via computeVisibleSteps),
	 * minus any SKIPPED branches. Falls back to all-steps if blueprint metadata isn't available.
	 */
	const getStepProgress = (inst: OperationInstance): { total: number; completed: number; pct: number } => {
		const blueprintSteps = (inst.blueprint as any)?.steps ?? [];
		const blueprintEdges = (inst.blueprint as any)?.edges ?? [];
		const isLaunched = !!(inst as any).launchedFromInstanceId
			|| (inst.sourceLinks ?? []).some((l: any) => l.linkType === LinkType.GLOBAL_OTHER);

		const visible = blueprintSteps.length > 0
			? computeVisibleSteps({
				stepInstances: inst.stepInstances as any,
				blueprintSteps,
				edges: blueprintEdges,
				isLaunched,
			})
			: inst.stepInstances;

		const relevant = visible.filter((si) => si.status !== StepInstanceStatus.SKIPPED);
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
       <div className="h-full">
			<MyWorkspaceHeader filterStatus={filterStatus} setFilterStatus={setFilterStatus} goToNewInstance={goToNewInstance} />

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
									<div key={instance.id} onClick={() => goToDetail(instance.id, instance.blueprint.type)}
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
											<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-[Lato-Bold] ring-1 ${ getStatusInstanceBg(instance.status) }`}>
												{ getStatusInstanceLabel(instance.status) }
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
													<DropdownMenuItem className="rounded-xl cursor-pointer p-3 transition-colors hover:bg-black/2" onClick={(e) => { e.stopPropagation(); goToDetail(instance.id, instance.blueprint.type); }}>
														<FileEdit className="mr-3 h-4 w-4 text-black/40" />
														<span className="font-[Lato-Regular] text-black/80"> Open Instance </span>
													</DropdownMenuItem>
													<PermissionGate permissions="operations.soft_delete">
														<DropdownMenuSeparator className="bg-black/2 my-2" />
														<DropdownMenuItem className="rounded-xl cursor-pointer p-3 text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors" onClick={(e) => handleDelete(e, instance)}>
															<Trash2 className="mr-3 h-4 w-4" />
															<span className="font-[Lato-Regular]"> Delete </span>
														</DropdownMenuItem>
													</PermissionGate>
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
}

export default MyWorkspaceManagement;