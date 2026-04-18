import {
    useEffect,
    useState,
    type ReactElement
} from "react";
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Calendar,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import {
    useNavigate,
    useParams
} from "react-router-dom";
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
    type OfficeDetail as OfficeDetailType,
    type OfficeResponse
} from "@l-ark/types";
import {
    useOffice
} from "../../server/hooks/useOffice";
import {
    extractFieldErrors,
    applyResponseErrors,
    getResponseMessage
} from "../../server/hooks/useApolloWithToast";
import {
    format
} from "date-fns";
import {
    LoadingStates
} from "../../constants";
import {
    useToast
} from "../../shared/hooks/useToast";
import Field from "../../shared/components/field";
import AssignedPersonnel from "./components/assigned-personnel";
import OperatingDivisions from "./components/operating-divisions";
import Button from "../../shared/components/button";

const OfficeDetail = (): ReactElement => {
    /** Navigation utilities */
    const navigate = useNavigate();
    /** URL parameters utilities */
    const params = useParams();
    /** Formulary definition */
    const { control, handleSubmit, reset, setError, clearErrors } = useForm({
        mode: 'onChange',
        defaultValues: {
           name: '',
           code: '',
           cif: '',
           nameSL: '',
           address: '',
           zipCode: '',
           city: ''
        }
    });
    /** Translation utilities */
    const { t } = useTranslation();
    /** Office api utilities */
    const { office, retrieveOfficeById, updateOfficeById, createOffice, deactivateOffice, activateOffice } = useOffice();
    /** Loading state */
    const [loading, setLoading] = useState<LoadingStates | false>(false);
    /** Toast utilities */
    const { onToast, onConfirmationToast } = useToast();

    useEffect(() => {
       if( params.id ) {
            const initialize = async () => {
                const response: FetchResult<{ data: OfficeDetailType }> = await retrieveOfficeById({ id: params.id as string });

                if( response.data?.data ) {
                    const { users, divisions, ...rest } = response.data.data;
                    reset({ ...rest });
                }
            }
            initialize();
        }
    }, [params.id]);

    /** Manage to go back to offices list */
    const onBack = (): void => {
        navigate('/offices');
    }

    /** Manage to create/update the current office information */
    const onSubmit = async (data: any): Promise<void> => {
        setLoading(LoadingStates.SAVE);
        const { id, createdAt, status, updatedAt, deletedAt, __typename, ...form } = data;

        try {
            if( params?.id ) { // Update existing office
                const response: FetchResult<{ data: OfficeResponse }> = await updateOfficeById({ id: params.id, input: {...form } });

                if( response?.data?.data?.success ) {
                    const { users, divisions, ...office } = response.data.data.data as OfficeDetailType;
                    reset({ ...office });
                } else {
                    applyResponseErrors(response.data?.data?.errors, setError);
                }
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
                setLoading(false);
            } else { // Add new office
                const response: FetchResult<{ data: ApiResponse }> = await createOffice({ input: {...form } });
                if( !response.data?.data?.success ) {
                    applyResponseErrors(response.data?.data?.errors, setError);
                }
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
                setLoading(false);
                if( response.data?.data.success ) {
                    onBack();
                }
            }
        } catch(e) {
            extractFieldErrors(e).forEach(({ field, message }) => setError(field as any, { message }));
            setLoading(false);
        }
    }

    /** MAnage to deactivate the current office */
    const onDeactivate = async (): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: t('common.dangerous-action'),
            description: t('offices.confirm-deactivate'),
            actionText: t('buttons.deactivate'),
            cancelText: t('buttons.cancel'),
            actionColor: 'error',
        });

        if (confirmed) {
            setLoading(LoadingStates.ACTIVATE_DEACTIVATE);
            try {
                const response: FetchResult<{ data: OfficeResponse }> = await deactivateOffice({ id: params.id as string });
                if( response?.data?.data?.success ) {
                    const { users, divisions, ...office } = response.data.data.data as OfficeDetailType;
                    reset({ ...office });
                }

                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
                setLoading(false);
            } catch(e: any) {
                onToast({ message: e?.message ?? t('messages.error-occurred'), type: 'error' });
                setLoading(false);
            }
        }
    }

    /** Manage to activate the current office */
    const onActivate = async (): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: t('common.dangerous-action'),
            description: t('offices.confirm-activate'),
            actionText: t('buttons.activate'),
            cancelText: t('buttons.cancel'),
        });

        if (confirmed) {
            setLoading(LoadingStates.ACTIVATE_DEACTIVATE);
            try {
                const response: FetchResult<{ data: OfficeResponse }> = await activateOffice({ id: params.id as string });
                if( response?.data?.data?.success ) {
                    const { users, divisions, ...office } = response.data.data.data as OfficeDetailType;
                    reset({ ...office });
                }
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
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
            case 'users': return t('common.users')
            case 'divisions': return t('common.divisions')
            default: return '';
        }
    }

    return (
		<div className="h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back Navigation & Header */}
            <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={() => onBack()} className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    {t('common.back-to-offices')}
                </Button>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-xl ring-1 ring-black/5 flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-[Lato-Bold] text-foreground"> { office.name ?? t('common.new-office') } </h1>
                                { params.id &&
                                    <Badge variant="secondary" className={`${office.status === Status.ACTIVE ? 'bg-emerald-50! text-emerald-600! border-emerald-100!' : 'bg-slate-100! text-slate-500! border-slate-200!'}`}>
                                        <CheckCircle2 className="mr-1 h-3 w-3" /> { office.status === Status.ACTIVE ? t('common.active') : t('common.inactive') }
                                    </Badge>
                                }
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground font-[Lato-Regular]">
                                <span className="flex items-center gap-1.5 capitalize"><MapPin className="h-4 w-4 text-[#FFBF00]" /> { office.address ? `${office.address},`  : '-'} { office.city } </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> { office.users?.length ?? '-' } {t('offices.employees')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        { params.id &&
                            <Button variant={office.status === Status.ACTIVE ? "danger" : "secondary"} onClick={office.status === Status.ACTIVE ? onDeactivate : onActivate}>
                                { office.status === Status.ACTIVE ? t('buttons.deactivate') : t('buttons.activate') }
                            </Button>
                        }
                        <Button variant="primary" loading={loading === LoadingStates.SAVE} loadingText="Saving..." onClick={() => { clearErrors(); handleSubmit(onSubmit)(); }}>
                            {t('common.save-changes')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-12 gap-8 h-[calc(100%-150px)]">
                {/* Left Sidebar Info */}
                <div className="h-full col-span-12 lg:col-span-4 space-y-6">
                    <Card className="rounded-3xl border-border/60 shadow-sm bg-white">
                        <div className="p-6 space-y-6">
                            <h3 className="font-[Lato-Bold] text-lg">{t('offices.location-details')}</h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase tracking-wider">{t('offices.address')}</p>
                                        <p className="text-sm font-[Lato-Bold] text-foreground truncate capitalize"> { office.address ?? '-' } </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase tracking-wider">{t('offices.office-phone')}</p>
                                        <p className="text-sm font-[Lato-Bold] text-foreground"> - </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase tracking-wider">{t('offices.established')}</p>
                                        <p className="text-sm font-[Lato-Bold] text-foreground"> { format(office.createdAt ?? new Date(), 'dd-MM-yyyy') } </p>
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
                                { (params.id ? ['general', 'users', 'divisions'] : ['general']).map((tab) => (
                                    <TabsTrigger key={tab} value={tab.toLowerCase()}
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFBF00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-muted-foreground data-[state=active]:text-foreground font-[Lato-Regular] cursor-pointer text-sm transition-all hover:text-foreground"
                                    >
                                        { getTabByName(tab) }
                                    </TabsTrigger>
                                ))}
                                </TabsList>
                            </div>

                            <div className="h-full p-2 px-8 overflow-y-auto">
                                <TabsContent value="general" className="m-0 space-y-6 animate-in fade-in duration-300">
                                    <p> { t('common.general-information') } </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field control={control} name='name' label={ t('labels.name') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                        <Field control={control} name='code' label={ t('labels.code') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />

                                        <Field control={control} name='nameSL' label={ t('labels.name-sl') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                        <Field control={control} name='cif' label={ t('labels.cif') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                    </div>
                                    <p> { t('common.address-information') } </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field control={control} name='address' label={ t('labels.address') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                        <Field control={control} name='zipCode' label={ t('labels.zip-code') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />

                                        <Field control={control} name='city' label={ t('labels.city') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                    </div>
                                </TabsContent>

                                <TabsContent value="users" className="m-0 space-y-6 animate-in fade-in duration-300">
                                    <AssignedPersonnel office={office} />
                                </TabsContent>

                                <TabsContent value="divisions" className="m-0 space-y-6 animate-in fade-in duration-300">
                                    <OperatingDivisions office={office} />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default OfficeDetail;
