import {
    useEffect,
    useMemo,
    useState,
    type ReactElement
} from 'react';
import {
    AlertTriangle,
    Check,
    ChevronRight,
    FolderCog,
    Globe,
    Link2
} from 'lucide-react';
import {
    useNavigate
} from 'react-router-dom';
import {
    OperationBlueprintStatus,
    OperationInstanceStatus,
    OperationType,
    UserRole,
    type ApiResponse,
    type OperationBlueprint,
    type OperationInstance,
    type OperationInstanceInput
} from '@l-ark/types';
import {
    filterEligibleInstances,
} from './utils/eligible-instances';
import {
    useOperationBlueprint
} from '../../server/hooks/useOperationBlueprint';
import {
    useOffice
} from '../../server/hooks/useOffice';
import {
    useForm
} from 'react-hook-form';
import {
    useOperationInstance
} from '../../server/hooks/useOperationInstance';
import {
    useTranslation
} from 'react-i18next';
import {
    useToast
} from '../../shared/hooks/useToast';
import type {
    FetchResult
} from '@apollo/client';
import MyWorkspaceInstanceLeftPanel from './components/my-workspace-instance-left-panel';
import Button from '../../shared/components/button';
import usePermissions from '../../shared/hooks/usePermissions';
import Field from '../../shared/components/field';

const MyWorkspaceNewInstance = (): ReactElement => {
    /** Translation utilities */
    const { t } = useTranslation();
    /** Navigation utilities */
    const navigate = useNavigate();
    /** toast utilities */
    const { onToast } = useToast();
    /** User information */
    const { user } = usePermissions();
    /** Operation blueprint api utilities */
    const { blueprints, retrieveBlueprints } = useOperationBlueprint();
    /** Operation instances api utilities */
    const { instances, retrieveInstances, createInstance, linkInstances } = useOperationInstance();
    /** Office api utilities */
    const { officesUser, retrieveOfficeByUser } = useOffice();
    /** Role-aware blueprint type tabs:
     *  - Commercials cannot start GLOBAL operations directly (backend forbids).
     *  - Directors and Director General can pick either type.
     */
    const roleCode = user?.role?.code;
    const types: OperationType[] = roleCode === UserRole.C
        ? [OperationType.OTHER]
        : [OperationType.OTHER, OperationType.GLOBAL];
    /** Set of division ids the current DIR manages — used to restrict the
     *  list of GLOBAL blueprints he is allowed to launch. */
    const managedDivisionIds = useMemo<Set<string>>(() => {
        const list = (user as any)?.managedDivisions ?? [];
        return new Set(list.map((d: any) => String(d.division?.id)));
    }, [user]);
    /** Formulary definition */
    const methods = useForm<{ type: OperationType, officeId: number | null, blueprintId: number | null, title: string, description: string }>({
        mode: 'onChange',
        defaultValues: {
            type: OperationType.OTHER,
            officeId: null,
            blueprintId: null,
            title: '',
            description: ''
        }
    });
    const activeType = methods.watch('type');
    const officeId = methods.watch('officeId');
    const blueprintId = methods.watch('blueprintId');
    /** List of blueprints filtered by active type and the current user's
     *  permission to instantiate them. Mirrors backend
     *  `assertCanCreateBlueprintInstance`. */
    const filteredBlueprints = blueprints.filter(op => {
        if ( op.type !== activeType ) return false;
        if ( op.status === OperationBlueprintStatus.DRAFT ) return false;
        if ( op.status === OperationBlueprintStatus.ARCHIVED ) return false;

        if ( roleCode === UserRole.C && op.type === OperationType.GLOBAL ) return false;

        if ( roleCode === UserRole.DIR && op.type === OperationType.GLOBAL ) {
            return managedDivisionIds.has(String((op as any).divisionId));
        }
        return true;
    });
    /** State to manage the selected prerequisite instance IDs */
	const [prereqInstanceIds, setPrereqInstanceIds] = useState<Record<number, number | null>>({});
    /** Prerequisites for the selected GLOBAL blueprint */
    const prerequisites = useMemo(() => {
        if ( !blueprintId || activeType !== OperationType.GLOBAL ) return [];

        const blueprint = blueprints.find((blueprint: OperationBlueprint) => blueprint.id === blueprintId);
        return blueprint?.prerequisites ?? [];
    }, [blueprintId]);
    /** Eligible completed instances per required blueprint, filtered by selected office */
    const eligibleByBlueprintId = useMemo(() => {
        const map: Record<number, OperationInstance[]> = {};
        // Wide whitelist (preserves the behaviour of the original buggy expression
        // `ACTIVE || ... || COMPLETED_READY || LINKED` which always evaluated truthy).
        // The new-instance flow accepts any non-DRAFT instance as a prerequisite.
        const wideStatuses = new Set([
            OperationInstanceStatus.ACTIVE,
            OperationInstanceStatus.COMPLETED_READY,
            OperationInstanceStatus.LINKED,
            OperationInstanceStatus.CLOSED,
            OperationInstanceStatus.PARTIALLY_CLOSED,
            OperationInstanceStatus.PENDING_PAYMENT,
        ]);
        for (const prereq of prerequisites) {
            const bpId = prereq.requiredBlueprintId;
            map[bpId] = filterEligibleInstances({
                instances,
                blueprintId: bpId,
                officeId: blueprintId ? officeId : null,
                allowedStatuses: wideStatuses,
            });
        }
        return map;
	}, [prerequisites, instances, officeId, blueprintId]);
    /** Whether all prerequisites have a selected instance */
	const allPrereqsMet = useMemo(() => {
		if (prerequisites.length === 0) return true;
		return prerequisites.every((p: any) => !!prereqInstanceIds[Number(p.requiredBlueprintId)]);
	}, [prerequisites, prereqInstanceIds]);

    useEffect(() => {
        retrieveBlueprints();
        retrieveOfficeByUser({ idUser: user?.id as number });
        retrieveInstances();
    }, []);

    useEffect(() => {
        const bp = blueprints.find((b: OperationBlueprint) => b.id === blueprintId);
        if (bp) methods.setValue('title', bp.title);
    }, [blueprintId]);

    /** Manage to navigate to the list of operation instances page */
    const goBack = (): void => {
        navigate('/workspace')
    }

    /** Manage to update the information when the type of operation blueprint is changed */
    const onChangeType = (type: OperationType): void => {
        methods.setValue('type', type);
        methods.setValue('blueprintId', null);
    }

    /** Whether creation is allowed */
	const canCreate = !!blueprintId && !!officeId && allPrereqsMet;

	/** Manage to create a new instance */
	const handleCreate = async (): Promise<void> => {    
        if ( !canCreate ) {
            onToast({ message: t('workspace.missing-values-error'), type: 'error' });
        };

        const { type, ...values } = methods.getValues();
		const response: FetchResult<{ data: ApiResponse }> = await createInstance({ input: values as unknown as OperationInstanceInput });

		const createResult = response.data?.data;
		if ( !createResult?.success ) {
            onToast({ message: createResult?.message ?? '', type: 'error' });
        };

		if ( prerequisites.length > 0 ) {
			const newInstance = instances
				.filter((i: OperationInstance) => i.blueprintId === blueprintId && i.officeId === officeId)
				.sort((a: any, b: any) => b.id - a.id)[0];

			if ( newInstance?.id ) {
				const selectedIds = Object.values(prereqInstanceIds).filter(Boolean) as number[];
				if ( selectedIds.length > 0 ) {
					await linkInstances({ input: { sourceInstanceId: newInstance.id, targetInstanceIds: selectedIds, linkType: LinkType.GLOBAL_OTHER } });
				}
			}
		}

		navigate("/workspace");
	};

    /** Manage to re-initialize the form with a pre-selected blueprint */
    const onCreatePreRequisite = (blueprintId: number): void => {
        const blueprint = blueprints.find(b => Number(b.id) === Number(blueprintId));

        if ( !blueprint ) return;

        methods.reset({ type: blueprint.type, officeId: null, blueprintId: blueprint.id, title: blueprint.title, description: '' });

        setPrereqInstanceIds({});
    }

    /** Manage to render the blueprint selection field */
    const renderBlueprintSelections = (): ReactElement => (
        <div className="space-y-3">
            <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('workspace.blueprint-label') } </label>

            {/* Type tabs */}
            <div className="flex gap-2 p-1 bg-black/4 rounded-xl w-fit">
                { types.map((type: OperationType) => (
                    <button key={type} onClick={() => onChangeType(type)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-[Lato-Bold] transition-all duration-200 cursor-pointer ${
                            activeType === type ? 'bg-white shadow-sm text-black/80' : 'text-black/40 hover:text-black/60'
                        }`}
                    >
                        { type === OperationType.GLOBAL ? <Globe className="w-3.5 h-3.5 text-violet-500" /> : <FolderCog className="w-3.5 h-3.5 text-amber-500" /> }
                        { type === OperationType.GLOBAL ? t('workspace.type-global') : t('workspace.type-other') }
                    </button>
                ))}
            </div>

            { filteredBlueprints.length === 0 ?
                <div className="p-8 border border-dashed border-black/10 rounded-xl text-center">
                    <FolderCog className="w-8 h-8 text-black/20 mx-auto mb-2" />
                    <p className="text-sm text-black/40 font-[Lato-Regular]"> { t('workspace.no-blueprints') } </p>
                    <p className="text-xs text-black/30 font-[Lato-Regular] mt-1"> { t('workspace.no-blueprints-hint') } </p>
                </div>
            :
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    { filteredBlueprints.map((bp: OperationBlueprint) => (
                        <button key={bp.id} onClick={() => methods.setValue('blueprintId', bp.id)}
                            className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                blueprintId === bp.id ? 'border-[#FFBF00] bg-amber-50/50 ring-2 ring-[#FFBF00]/20 shadow-sm' : 'border-black/6 bg-white hover:border-black/12 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        { bp.type === OperationType.GLOBAL ? <Globe className="w-3.5 h-3.5 text-violet-500 shrink-0" /> : <FolderCog className="w-3.5 h-3.5 text-amber-500 shrink-0" /> }
                                        <span className="text-sm font-[Lato-Bold] text-black/80 truncate"> { bp.title } </span>
                                    </div>
                                    <p className="text-xs text-black/40 font-[Lato-Regular] line-clamp-2"> { bp.description || t('workspace.no-description') } </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-[Lato-Bold] px-2 py-0.5 rounded-full bg-black/4 text-black/50"> { bp.subType } </span>
                                        <span className="text-[10px] text-black/30 font-[Lato-Regular]"> { t('workspace.steps-count', { count: bp.steps.length }) } </span>
                                    </div>
                                </div>
                                { blueprintId === bp.id &&
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
    );

    /** Manage to render the pre-requisite selection */
    const renderPrerequisits = (): ReactElement => (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div>
                <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('workspace.prerequisites-label') } </label>
                <p className="text-xs font-[Lato-Regular] text-black/40 mt-1">
                    { t('workspace.prerequisites-description') }
                </p>
            </div>

            { prerequisites.map((prereq: any) => {
                const bpId = prereq.requiredBlueprintId;
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
                                    { t('workspace.no-eligible-instances') }{ officeId ? ` ${t('workspace.for-this-office')}` : '' }.
                                </p>
                                <button
                                    onClick={() => onCreatePreRequisite(bpId)}
                                    className="text-xs font-[Lato-Bold] text-violet-600 hover:underline cursor-pointer shrink-0 ml-3 transition-colors"
                                >
                                    { t('workspace.create-prerequisite') }
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
    );

    return (
        <div className="h-full flex flex-col md:flex-row">
			{/* Left Panel */}
            <MyWorkspaceInstanceLeftPanel goBack={goBack} />

			{/* Right Panel */}
			<div className="flex-1 p-6 lg:p-12 overflow-y-auto">
				<div className="w-full">
					<div className="space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
						<div>
							<h2 className="text-3xl font-[Lato-Bold] text-foreground mb-3"> { t('workspace.select-blueprint-title') } </h2>
							<p className="text-lg text-muted-foreground font-[Lato-Light]"> { t('workspace.select-blueprint-subtitle') } </p>
						</div>

                        {/* Blueprint selection */}
                        { renderBlueprintSelections() }

						{/* Title */}
						{ blueprintId &&
                            <Field control={methods.control} name='title' label={ t('workspace.instance-title-label') } placeholder={ t('workspace.instance-title-placeholder') } type='text' className='bg-white' />
						}

						{/* Description */}
						{ blueprintId &&
                            <Field control={methods.control} name='description' label={ t('labels.description') } placeholder={ t('workspace.instance-description-placeholder') } type='textarea' className='bg-white' />
						}

						{/* Office selection */}
						{ blueprintId &&
							<div className="space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
								<label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { t('workspace.office-label') } </label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{ officesUser.map(office => (
										<button key={office.id} onClick={() => methods.setValue('officeId', office.id)}
											className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
												officeId === office.id ? 'border-[#FFBF00] bg-amber-50/50 ring-2 ring-[#FFBF00]/20 shadow-sm' : 'border-black/6 bg-white hover:border-black/12 hover:shadow-sm'
											}`}
										>
											<span className="text-sm font-[Lato-Bold] text-black/80"> { office.name } </span>
										</button>
									))}
								</div>
							</div>
						}

						{/* Prerequisites — only for GLOBAL blueprints that have requirements */}
						{ blueprintId && prerequisites.length > 0 && renderPrerequisits() }

						{/* Actions */}
						<div className="pt-10 border-t border-border flex items-center justify-end gap-6">
							<Button variant="secondary" size="lg" onClick={goBack} className="rounded-xl">
								{ t('buttons.cancel') }
							</Button>
							<Button variant="primary" size="lg" onClick={handleCreate} className="rounded-xl" disabled={!canCreate}>
								{ t('workspace.start-instance') }
								<ChevronRight className="w-5 h-5" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
    );
}

export default MyWorkspaceNewInstance;