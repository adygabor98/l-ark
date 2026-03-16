import {
    useEffect,
    useState,
    type ReactElement
} from "react";
import { 
  Building2, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  ArrowLeft,
  CheckCircle2,
  Camera
} from "lucide-react";
import {
    useNavigate,
    useParams
} from "react-router-dom";
import {
    useToast
} from "../../shared/hooks/useToast";
import {
    Avatar,
    AvatarFallback
} from "../../shared/components/avatar";
import {
    getShortNameUser
} from "../../shared/utils/user.utils";
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
import {
    useUser
} from "../../server/hooks/useUser";
import type {
    FetchResult
} from "@apollo/client";
import {
    UserStatus,
    type ApiResponse,
    type UserDetail as UserDetailType
} from "@l-ark/types";
import {
    format
} from "date-fns";
import {
    LoadingStates
} from "../../constants";
import Field from "../../shared/components/field";
import Button from "../../shared/components/button";
import OperatingLocations from "../divisions/components/operating-locations";

const UserDetail = (): ReactElement => {
    /** URL parameter utilities */
    const params = useParams();
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Toast api utilities */
    const { onToast, onConfirmationToast } = useToast();
    /** Formulary definition */
    const { control, handleSubmit, reset } = useForm<any>({
        mode: 'onChange',
        defaultValues: {
            firstName: '',
            lastName: '',
            dni: '',
            birthDate: '',
            phone: '',
            email: '',
            roleId: ''
        }
    });
    /** Translation utilities */
    const { t } = useTranslation();
    /** User api utilities */
    const { user, retrieveUserById, updateUserById, createUser, deactivateUserById, activateUserById } = useUser();
    /** Loading state */
    const [loading, setLoading] = useState<LoadingStates | false>(false);

    useEffect(() => {
        if( params.id ) {
            const initialize = async () => {
                const response: FetchResult<{ data: UserDetailType }> = await retrieveUserById({ id: params.id as string });
                if( response.data?.data ) {
                    const { role, managedDivisions, offices, ...rest } = response.data.data;
                    reset({ ...rest, roleId: rest.roleId.toString() });
                }
            }
            initialize();
        }
    }, [params.id]);

    const handleChangeAvatar = () => {
        // In a real app, this would open a file picker
        onToast({ message: "Update Profile Photo", type: 'info' });
    };

    /** Manage to redirect the user to the users list */
    const onBack = (): void => {
        navigate("/users");
    }

    /** Manage to create or update an user */
    const onSubmit = async (data: any): Promise<void> => {
        setLoading(LoadingStates.SAVE);
        const { id, username, password, createdAt, status,  __typename, ...form } = data;
        form.roleId = parseInt(data.roleId);

        try {
            if( params?.id ) { // Update existing user
                const response: FetchResult<{ data: ApiResponse<UserDetailType> }> = await updateUserById({ id: params.id, input: {...form } });

                if( response?.data?.data?.success ) {
                    const { role, managedDivisions, offices, ...user } = response.data.data.data as UserDetailType;
                    reset({ ...user, roleId: role.id.toString() });
                }
                onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
                setLoading(false);
            } else { // Add new user
                const response: FetchResult<{ data: ApiResponse<UserDetailType> }> = await createUser({ input: {...form } });
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

    /** MAnage to deactivate the current user */
    const onDeactivate = async (): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: t('common.dangerous-action'),
            description: t('users.confirm-deactivate'),
            actionText: t('buttons.deactivate'),
            cancelText: t('buttons.cancel'),
            actionColor: 'error',
        });

        if (confirmed) {
            setLoading(LoadingStates.ACTIVATE_DEACTIVATE);
            try {
                const response: FetchResult<{ data: ApiResponse<UserDetailType> }> = await deactivateUserById({ id: params.id as string });

                if( response?.data?.data?.success ) {
                    const { role, managedDivisions, offices, ...user } = response.data.data.data as UserDetailType;
                    reset({ ...user, roleId: role.id.toString() });
                }
                onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
                setLoading(false);
            } catch(e: any) {
                onToast({ message: e?.message ?? t('messages.error-occurred'), type: 'error' });
                setLoading(false);
            }
        }
    }

    /** Manage to activate the current user */
    const onActivate = async (): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: t('common.dangerous-action'),
            description: t('users.confirm-activate'),
            actionText: t('buttons.activate'),
            cancelText: t('buttons.cancel'),
        });

        if (confirmed) {
            setLoading(LoadingStates.ACTIVATE_DEACTIVATE);
            try {
                const response: FetchResult<{ data: ApiResponse<UserDetailType> }> = await activateUserById({ id: params.id as string });
                if( response?.data?.data?.success ) {
                    const { role, managedDivisions, offices, ...user } = response.data.data.data as UserDetailType;
                    reset({ ...user, roleId: role.id.toString() });
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
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    { t('common.back-to-users') }
                </Button>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={handleChangeAvatar}>
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-1 ring-black/5 group-hover:opacity-90 transition-opacity">
                                {/*<AvatarImage src={user.avatar} />*/}
                                <AvatarFallback className="text-4xl font-[Lato-Bold]"> { getShortNameUser(user.firstName ?? t('common.new-member'), user.lastName) } </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                <Camera className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                            <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-[Lato-Bold] text-foreground"> { user.firstName ?? t('common.new-member') } { user.lastName } </h1>
                                { params?.id &&
                                    <Badge variant="secondary" className={`${user.status === UserStatus.ACTIVE ? 'bg-emerald-50! text-emerald-600! border-emerald-100!' : 'bg-slate-100! text-slate-500! border-slate-200!'}`}>
                                        <CheckCircle2 className="mr-1 h-3 w-3" /> { user.status === UserStatus.ACTIVE ? t('common.active') : t('common.inactive') }
                                    </Badge>
                                }
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground font-[Lato-Regular]">
                                <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-[#FFBF00]" /> { user.role?.name ?? '-' } </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> { user.offices?.length ?? '-' } {t('common.offices')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        { params.id &&
                            <Button variant={user.status === UserStatus.ACTIVE ? "danger" : "secondary"} onClick={user.status === UserStatus.ACTIVE ? onDeactivate : onActivate}>
                                { user.status === UserStatus.ACTIVE ? t('buttons.deactivate') : t('buttons.activate') }
                            </Button>
                        }
                        <Button variant="primary" loading={loading === LoadingStates.SAVE} loadingText="Saving..." onClick={handleSubmit(onSubmit)}>
                            {t('common.save-profile')}
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
                            <h3 className="font-[Lato-Bold] text-lg"> { t('common.contact-information') } </h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden space-y-1">
                                        <p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase"> { t('users.email-address') } </p>
                                        <p className="text-sm font-[Lato-Bold] text-foreground truncate"> { user.email ?? '-' }</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden space-y-1">
                                        <p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase">{ t('users.phone-number') }</p>
                                        <p className="text-sm font-[Lato-Bold] text-foreground"> { user.phone ?? '-' } </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-[Lato-Regular] text-muted-foreground uppercase"> { t('users.joined-date') } </p>
                                        <p className="text-sm font-[Lato-Bold] text-foreground"> { format(user.createdAt ?? new Date(), 'dd-MM-yyyy') } </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                
                        <div className="bg-slate-50/50 p-4 border-t border-border/50">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span> { t('users.last-active') } </span>
                                <span className="font-[Lato-Regular] text-foreground flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    { user.updatedAt ? format(user.updatedAt, 'dd-MM-yyyy') : 'N/A' }
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Main Content */}
                <div className="h-full col-span-12 lg:col-span-8 overflow-y-auto">
                    <Card className="rounded-3xl border-border/60 shadow-sm bg-white overflow-hidden min-h-full flex flex-col">
                            <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 pt-4 shrink-0">
                                    <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start w-full border-b border-transparent">
                                        { ['general', params.id ? 'offices' : ''].map((tab) => (
                                            <TabsTrigger key={tab} value={tab.toLowerCase()}
                                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFBF00] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 text-muted-foreground data-[state=active]:text-foreground font-[Lato-Regular] cursor-pointer text-sm transition-all hover:text-foreground"
                                            >
                                                { getTabByName(tab) }
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                <div className="flex-1 p-2 px-8 overflow-y-auto">
                                    <TabsContent value="general" className="h-full m-0 space-y-8 animate-in fade-in duration-300">
                                        <p className="m-0 mb-2"> { t('common.general-information') } </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Field control={control} name='firstName' label={ t('labels.first-name') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                            <Field control={control} name='lastName' label={ t('labels.last-name') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                        
                                            <Field control={control} name='dni' label={ t('labels.dni') } placeholder={ t('placeholders.dni-placeholder') } type='text' required />
                                            <Field control={control} name='birthDate' label={ t('labels.birthDate') } placeholder={ t('placeholders.birthDate-placeholder') } type='date' required />
                                        </div>
                                        <p className="m-0 mb-2"> { t('common.contact-information') } </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Field control={control} name='email' label={ t('labels.email') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                            <Field control={control} name='phone' label={ t('labels.phone') } placeholder={ t('placeholders.enter-placeholder') } type='text' required />
                                
                                            <Field control={control} name='roleId' label={ t('labels.role') } placeholder={ t('placeholders.choose-role-placeholder') } type='select' dataType="roles" required />
                                        </div>
                                    </TabsContent>
                            
                                    <TabsContent value="offices" className="m-0 space-y-6 animate-in fade-in duration-300">
                                        <OperatingLocations user={user} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default UserDetail;