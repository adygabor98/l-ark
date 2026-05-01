import {
	useEffect,
	type ReactElement
} from 'react';
import {
	Archive,
	ArchiveRestore,
	Clock,
	MoreHorizontal,
	Plus,
	Trash2,
	Workflow
} from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../../shared/components/dropdown-button';
import {
	format
} from 'date-fns';
import {
	getStatusBg,
	getStatusColor,
	getTypeLabel
} from './utils/blueprint.utils';
import {
	OperationBlueprintStatus,
	type ApiResponse,
	type OperationBlueprint
} from '@l-ark/types';
import {
	useToast
} from '../../shared/hooks/useToast';
import type {
	FetchResult
} from '@apollo/client';
import {
	getResponseMessage
} from '../../server/hooks/useApolloWithToast';
import {
	useOperationBlueprint
} from '../../server/hooks/useOperationBlueprint';
import Button from '../../shared/components/button';
import { useNavigate } from 'react-router-dom';

const OperationBlueprintsManagement = (): ReactElement => {
    /** Toast utilities */
    const { onConfirmationToast, onToast } = useToast();
	/** Operation blueprint utilities */
	const { blueprints, retrieveBlueprints, archiveBlueprintOperation, restoreBlueprintOperation, deleteBlueprintOperation } = useOperationBlueprint();
	/** Navigation utilities */
	const navigate = useNavigate();

	useEffect(() => {
	  	retrieveBlueprints();
	}, []);
	
    /** Manage to redirect the user to the blueprint detail */
    const goToDetail = (blueprintId: number | null = null) => {
        navigate('/operations/detail', { state: { id: blueprintId } });
    }

    /** Manage to analyze if a blueprint can be archieved */
    const canArchive = (blueprint: OperationBlueprint) => blueprint.status !== OperationBlueprintStatus.ARCHIVED;

    /** Manage to analyze if a blueprint can be restored */
    const canRestore = (blueprint: OperationBlueprint) => blueprint.status === OperationBlueprintStatus.ARCHIVED;

    /** Manage to analyze if a blueprint can be delete */
    const canDelete  = (blueprint: OperationBlueprint) => blueprint.status === OperationBlueprintStatus.ARCHIVED;

    /** Manage to archieve a blueprint */
    const handleArchive = async (e: React.MouseEvent, blueprint: OperationBlueprint) => {
        e.stopPropagation();

        const { confirmed } = await onConfirmationToast({
            title: 'Archive this operation?',
            description: `"${ blueprint.title }" will be archived and can be restored later.`,
            actionText: 'Archfrive',
            cancelText: 'Cancel'
        });
        if ( confirmed ) {
            const response: FetchResult<{ data: ApiResponse }> = await archiveBlueprintOperation({ id: blueprint.id });
            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data?.success ? 'success' : 'error' });
        }
    };

    /** Restore an archived blueprint */
    const handleRestore = async (e: React.MouseEvent, blueprint: OperationBlueprint) => {
        e.stopPropagation();

        const response: FetchResult<{ data: ApiResponse }> = await restoreBlueprintOperation({ id: blueprint.id });
        onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data?.success ? 'success' : 'error' });
    };

    /** Permanently delete an archived operation blueprint */
    const handleDelete = async (e: React.MouseEvent, blueprint: OperationBlueprint) => {
        e.stopPropagation();

        const { confirmed } = await onConfirmationToast({
            title: 'Permanently delete this operation?',
            description: `"${blueprint.title}" will be permanently deleted. This action cannot be undone.`,
            actionText: 'Delete',
            cancelText: 'Cancel',
            actionColor: 'error',
        });
        if ( confirmed ) {
            const response: FetchResult<{ data: ApiResponse }> = await deleteBlueprintOperation({ id: blueprint.id });
            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data?.success ? 'success' : 'error' });
        }
    };

	const getBlueprintSorted = () => [...(blueprints ?? [])].sort((a,b) => a.id - b.id)

    return (
        <div className="h-[calc(100%-140px)]">
			<div className="mt-5 sticky top-0 z-10 pb-2">
				<div className="flex justify-between items-end">
					<div className="max-w-xl">
						<h1 className="text-4xl font-[Lato-Black] tracking-tight text-black mb-3"> Operation Blueprints </h1>
						<p className="text-md text-black/50 font-[Lato-Regular] leading-relaxed">
							Create and manage operational blueprints of your workflows with customizable steps.
						</p>
					</div>
					<Button variant="primary" onClick={() => goToDetail()}>
						<Plus className="w-5 h-5" />
						New Operation Blueprint
					</Button>
				</div>
			</div>

            <div className="h-full flex-1 overflow-y-auto relative mt-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pr-2">
					{ getBlueprintSorted().map((blueprint: OperationBlueprint) => (
						<div key={blueprint.id} onClick={() => goToDetail(blueprint.id)}
							className="group relative rounded-4xl transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 flex flex-col cursor-pointer"
						>
							<div className="bg-white rounded-[1.75rem] p-7 flex-1 flex flex-col relative z-10 border border-black/2 overflow-hidden">
								{/* Decorative background icon */}
								<div className="absolute -right-6 -top-6 opacity-60 pointer-events-none group-hover:opacity-100 transition-all duration-500 z-0">
									<Workflow className="w-48 h-48 text-black/3 -rotate-12 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500" strokeWidth={1} />
								</div>

								{/* Top row: category + dropdown */}
								<div className="flex justify-between items-start mb-2 relative z-10">
									<div className="px-3 py-1.5 rounded-xl text-xs font-[Lato-Bold] tracking-wide flex items-center gap-2 bg-amber-50 text-amber-700 ring-1 ring-amber-700/20">
										<div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
										{ getTypeLabel(blueprint.type) } &middot; { blueprint.subType }
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button onClick={(e) => e.stopPropagation()}
												className="flex items-center justify-center h-8 w-8 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-300 rounded-full bg-white shadow-sm border border-black/4"
											>
												<MoreHorizontal className="h-4 w-4" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-56 rounded-2xl border-black/5 shadow-xl p-2 bg-white/95 backdrop-blur-xl">
											{ canRestore(blueprint) &&
												<DropdownMenuItem className="rounded-xl cursor-pointer p-3 transition-colors hover:bg-black/2" onClick={(e) => handleRestore(e, blueprint)}>
													<ArchiveRestore className="mr-3 h-4 w-4 text-black/40" />
													<span className="font-[Lato-Regular] text-black/80"> Restore </span>
												</DropdownMenuItem>
                                            }

											{ canArchive(blueprint) &&
												<DropdownMenuItem className="rounded-xl cursor-pointer p-3 text-amber-600 focus:text-amber-600 focus:bg-amber-50 transition-colors" onClick={(e) => handleArchive(e, blueprint)}>
													<Archive className="mr-3 h-4 w-4" />
													<span className="font-[Lato-Regular]"> Archive </span>
												</DropdownMenuItem>
											}
											{ canDelete(blueprint) &&
												<DropdownMenuItem className="rounded-xl cursor-pointer p-3 text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors" onClick={(e) => handleDelete(e, blueprint)}>
													<Trash2 className="mr-3 h-4 w-4" />
													<span className="font-[Lato-Regular]"> Delete </span>
												</DropdownMenuItem>
											}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Title */}
								<h3 className="text-2xl font-[Lato-Bold] tracking-tight text-black mb-3 line-clamp-2 leading-snug group-hover:text-black/80 transition-colors">
									{ blueprint.title || "Untitled Operation" }
								</h3>

								{/* Description */}
								<p className="text-sm text-black/40 font-[Lato-Regular] mb-2 line-clamp-2 leading-relaxed">
									{ blueprint.description || "No description" }
								</p>

								{/* Step count + version badge */}
								<div className="flex items-center gap-2 mb-2">
									<p className="text-xs text-black/30 font-[Lato-Regular]">
										{ blueprint.steps.length } step{ blueprint.steps.length !== 1 ? "s" : "" }
									</p>
									{ (blueprint as any).latestVersion &&
										<span className={`text-[10px] font-[Lato-Bold] uppercase tracking-wide px-2 py-0.5 rounded-full ${ (blueprint as any).latestVersion.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : (blueprint as any).latestVersion.status === 'DEPRECATED' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700' }`}>
											v{ (blueprint as any).latestVersion.versionNumber } &middot; { (blueprint as any).latestVersion.status }
										</span>
									}
								</div>

								{/* Footer: status + date */}
								<div className="mt-auto flex items-center justify-between pt-6 border-t border-black/4">
									<div className="flex items-center gap-2">
										<div className={`flex items-center justify-center w-4 h-4 rounded-full ${ getStatusBg(blueprint.status) }`}>
											<div className="w-2 h-2 rounded-full bg-current" />
										</div>
										<span className={`text-[11px] font-[Lato-Bold] uppercase ${ getStatusColor(blueprint.status) }`}>
											{ blueprint.status.replace('_', ' ') }
										</span>
									</div>

									<div className="flex items-center text-xs font-[Lato-Regular] text-black/30 gap-1.5">
										<Clock className="w-3.5 h-3.5 opacity-60" />
										{ format(new Date(blueprint.updatedAt), 'dd-MM-yyyy') }
									</div>
								</div>
							</div>
						</div>
					))}

					{/* Empty State */}
					{ blueprints.length === 0 &&
						<div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-black/6 border-dashed">
							<div className="w-20 h-20 bg-black/3 rounded-2xl flex items-center justify-center mb-6">
								<Workflow className="w-10 h-10 text-black/30" />
							</div>
							<h3 className="text-2xl font-[Lato-Black] text-black mb-2"> No operation blueprints yet </h3>
							<p className="text-md text-black/50 mb-8 max-w-md font-[Lato-Regular]">
								Get started by creating your first operational blueprint for your workflow with customizable steps.
							</p>
							<Button variant="primary" onClick={() => goToDetail()}>
								<Plus className="w-5 h-5" />
								Create your first operation blueprint
							</Button>
						</div>
					}
				</div>
			</div>
        </div>
    )
}

export default OperationBlueprintsManagement;