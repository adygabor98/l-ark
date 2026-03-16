import {
	useEffect,
	useState,
	type ReactElement
} from "react";
import {
  Briefcase,
  Users,
  ArrowLeft,
  CheckCircle2,
  Target
} from "lucide-react";
import {
	useNavigate,
	useParams
} from "react-router-dom";
import {
	useToast
} from "../../shared/hooks/useToast";
import {
	Badge
} from "../../shared/components/badge";
import {
	Card
} from "../../shared/components/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "../../shared/components/tabs";
import {
	useForm
} from "react-hook-form";
import {
	useTranslation
} from "react-i18next";
import type {
	FetchResult
} from "@apollo/client";
import {
	Status,
	type ApiResponse,
	type DivisionDetail as DivisionDetailType,
	type DivisionRole
} from "@l-ark/types";
import {
	LoadingStates
} from "../../constants";
import {
	useDivision
} from "../../server/hooks/useDivision";
import Field from "../../shared/components/field";
import Button from "../../shared/components/button";
import OperatingLocations from "./components/operating-locations";

const DivisionDetail = (): ReactElement => {
	/** Navigation utilities */
	const navigate = useNavigate();
	/** ULR params utilities */
	const params = useParams();
	/** Toast utilities */
	const { onToast, onConfirmationToast } = useToast();
	/** Definition of the formulary */
    const { control, handleSubmit, reset } = useForm({
        mode: 'onChange',
        defaultValues: {
           name: '',
		   code: '',
		   roles: [] as Array<string>
        }
    });
	/** Translation utilities */
	const { t } = useTranslation();
	/** State to manage loading states */
	const [loading, setLoading] = useState<LoadingStates | false>(false);
	/** Division api utilities */
	const { division, retrieveDivisionById, updateDivisionById, createDivision, deactivateDivision, activateDivision } = useDivision();

	useEffect(() => {
		if( params.id ) {
			const initialize = async () => {
				const response: FetchResult<{ data: DivisionDetailType }> = await retrieveDivisionById({ id: params.id as string });
				if( response.data?.data ) {
					const { offices, roles, ...rest } = response.data.data;

					reset({ ...rest, roles: roles.map((roleDivision: DivisionRole) => roleDivision.roleId.toString()) });
				}
			}
			initialize();
		}
	}, [params.id]);
	
	/** Manage to go back to the division lists */
	const onBack = () => {
		navigate('/divisions');
	}
	
	/** MAnage to create/update the current division information */
	const onSubmit = async (data: any): Promise<void> => {
		setLoading(LoadingStates.SAVE);
		const { id, createdAt, status, updatedAt, deletedAt, __typename, ...form } = data;

		try {
			if( params?.id ) { // Update existing division
				const response: FetchResult<{ data: ApiResponse<DivisionDetailType> }> = await updateDivisionById({ id: params.id, input: {...form } });

				if( response?.data?.data?.success ) {
					const { offices, roles, ...division } = response.data.data.data as DivisionDetailType;
					reset({ ...division, roles: roles.map((roleDivision: DivisionRole) => roleDivision.roleId.toString()) });
				}
				onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
				setLoading(false);
			} else { // Add new division
				const response: FetchResult<{ data: ApiResponse }> = await createDivision({ input: {...form } });
				onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
				setLoading(false);
				if( response.data?.data.success ) {
                    onBack();
                }
			}
		} catch(e) {
			console.error(e);
			setLoading(false);
		}
	}

	/** Manage to deactivate the current division */
	const onDeactivate = async (): Promise<void> => {
		const { confirmed } = await onConfirmationToast({
			title: t('common.dangerous-action'),
			description: t('divisions.confirm-deactivate'),
			actionText: t('buttons.deactivate'),
			cancelText: t('buttons.cancel'),
			actionColor: 'error',
		});

		if (confirmed) {
			setLoading(LoadingStates.ACTIVATE_DEACTIVATE);
			try {
				const response: FetchResult<{ data: ApiResponse<DivisionDetailType> }> = await deactivateDivision({ id: params.id as string });

				if( response?.data?.data?.success ) {
					const { offices, roles, ...division } = response.data.data.data as DivisionDetailType;
					reset({ ...division, roles: roles.map((roleDivision: DivisionRole) => roleDivision.roleId.toString()) });
				}
				onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
				setLoading(false);
			} catch(e: any) {
				onToast({ message: e?.message ?? t('messages.error-occurred'), type: 'error' });
				setLoading(false);
			}
		}
	}

	/** Manage to activate a current division */
	const onActivate = async (): Promise<void> => {
		const { confirmed } = await onConfirmationToast({
			title: t('common.dangerous-action'),
			description: t('divisions.confirm-activate'),
			actionText: t('buttons.activate'),
			cancelText: t('buttons.cancel'),
		});

		if (confirmed) {
			setLoading(LoadingStates.ACTIVATE_DEACTIVATE);
			try {
				const response: FetchResult<{ data: ApiResponse<DivisionDetailType> }> = await activateDivision({ id: params.id as string });
				if( response?.data?.data?.success ) {
					const { offices, roles, ...division } = response.data.data.data as DivisionDetailType;
					reset({ ...division, roles: roles.map((roleDivision: DivisionRole) => roleDivision.roleId.toString()) });
				}
				onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
				setLoading(false);
			} catch(e: any) {
				onToast({ message: e?.message ?? t('messages.error-occurred'), type: 'error' });
				setLoading(false);
			}
		}
	}

	/** Manage to retrieve the tab label depeding on the type */
    const getTabByName = (tab: string): string => {
        switch(tab) {
            case 'general': return t('common.general');
            case 'offices': return t('common.offices');
            default: return '';
        }
    }

	return (
		<div className="h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Back Navigation & Header */}
			<div>
				<Button variant="ghost" onClick={() => navigate("/divisions")}>
					<ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> {t('common.back-to-divisions')}
				</Button>
				
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
					<div className="flex items-center gap-6">
						<div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-xl ring-1 ring-black/5 flex items-center justify-center">
							<Briefcase className="h-10 w-10 text-primary" />
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-3">
								<h1 className="text-3xl font-[Lato-Bold] text-foreground"> { division.name ?? t('common.new-division') } </h1>
								{ params.id &&
									<Badge variant="secondary" className={`${ division.status === Status.ACTIVE ? 'bg-emerald-50! text-emerald-600! border-emerald-100!' : 'bg-slate-100! text-slate-500! border-slate-200!'}`}>
										<CheckCircle2 className="mr-1 h-3 w-3" /> { division.status === Status.ACTIVE ? t('common.active') : t('common.inactive') }
									</Badge>
								}
							</div>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<span className="flex items-center gap-1.5 font-[Lato-Regular] text-xs bg-slate-100 px-2 py-0.5 rounded"> { division.code ?? '-' } </span>
								<span className="w-1 h-1 rounded-full bg-border" />
								<span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-[#FFBF00]" /> { division.offices?.length ?? 0 } {t('common.offices')} </span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
                        { params.id &&
							<Button variant={division.status === Status.ACTIVE ? "danger" : "secondary"} onClick={division.status === Status.ACTIVE ? onDeactivate : onActivate}>
                            	{ division.status === Status.ACTIVE ? t('buttons.deactivate') : t('buttons.activate') }
                        	</Button>
						}
                        <Button variant="primary" loading={loading === LoadingStates.SAVE} loadingText="Saving..." onClick={handleSubmit(onSubmit)}>
                            {t('common.save-changes')}
                        </Button>
                    </div>
				</div>
			</div>

			{/* Main Layout Grid */}
			<div className="grid grid-cols-12 gap-8 h-[calc(100%-170px)]">
				{/* Left Sidebar Info */}
				<div className="h-full col-span-12 lg:col-span-4 space-y-6">
                    <Card className="rounded-3xl border-border/60 shadow-sm bg-white overflow-hidden">
						<div className="p-6 space-y-6">
							<h3 className="font-[Lato-Bold] text-lg"> { t('divisions.info') } </h3>
							
							<div className="space-y-4">
								<div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
									<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
										<Target className="h-5 w-5" />
									</div>
									<div className="overflow-hidden">
										<p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase tracking-wider"> { t('divisions.code') } </p>
										<p className="text-sm font-[Lato-Bold] text-foreground truncate"> { division.code ?? '-' } </p>
									</div>
								</div>
							</div>
						</div>
					</Card>
				</div>

				{/* Right Main Content */}
				<div className="h-full col-span-12 lg:col-span-8 overflow-y-auto">
                    <Card className="rounded-3xl border-border/60 shadow-sm bg-white overflow-hidden min-h-full flex flex-col">
						<Tabs defaultValue="general" className="w-full">
							<div className="px-6 pt-4">
								<TabsList className="bg-transparent h-auto p-0 gap-8 justify-start w-full border-b border-transparent">
								{['general', params.id ? 'offices' : ''].map((tab) => (
									<TabsTrigger key={tab} value={tab.toLowerCase()} 
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFBF00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-muted-foreground data-[state=active]:text-foreground font-[Lato-Regular] cursor-pointer text-sm transition-all hover:text-foreground"
									>
										{ getTabByName(tab) }
									</TabsTrigger>
								))}
								</TabsList>
							</div>

							<div className="h-full p-2 px-8 overflow-y-auto">
								<TabsContent value="general" className="m-0 space-y-4 animate-in fade-in duration-300">
									<span className={`flex items-center gap-2 text-[14px] font-[Lato-Regular]`}> { t('common.general-information') } </span>
									<div className="grid grid-cols-2 gap-2">
										<Field control={control} name='code' label={t('labels.code')} type='text' placeholder={t(`placeholders.enter-field`)} required />
										<Field control={control} name='name' label={t('labels.name')} type='text' placeholder={t(`placeholders.enter-field`)} required />
										<Field control={control} className="col-span-2" name='description' label={t('labels.description')} type='textarea' placeholder={t(`placeholders.enter-field`)} />
									</div>
									<span className={`flex items-center gap-2 text-[14px] font-[Lato-Regular]`}> { t('common.roles-allowed') } </span>

									{/* Role rows */}
									<div className="space-y-2">
										<Field control={control} name='roles' label={ t('labels.roles') } type='select' dataType="roles" placeholder={t(`placeholders.enter-field`)} multiple required />
									</div>
								</TabsContent>

								<TabsContent value="offices" className="m-0 space-y-6 animate-in fade-in duration-300">
									<OperatingLocations division={division} />
								</TabsContent>
							</div>
						</Tabs>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default DivisionDetail;