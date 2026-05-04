import {
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from './dialog';
import {
    Avatar,
    AvatarFallback
} from './avatar';
import {
    useUser
} from '../../server/hooks/useUser';
import {
    useTranslation
} from 'react-i18next';
import {
    useForm
} from 'react-hook-form';
import {
    useToast
} from '../hooks/useToast';
import {
    addDays,
    addHours,
    isBefore
} from 'date-fns';
import Field from './field';

interface PropTypes {
    open: boolean;
    id: string;
    date: string;
    isReset: boolean;

    onClose: () => void;
    onLogin: (data: { username: string, password: string }) => void;
}

const InviteUser = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { id, open, date, isReset, onClose } = props;
    /** User api utilities */
    const { user, retrieveUserById } = useUser();
    /** Translation utilities */
    const { t } = useTranslation();
    /** Formulary definition */
    const { control, handleSubmit, reset } = useForm({
        mode: 'onChange',
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });
    /** Toast utilities */
    const { onToast } = useToast();
    /** Manage the loading state */
    const [loading, setLoading] = useState<boolean>(false);

    /** Manage to retrieve the user informatio by id */
    useEffect(() => {
        const dateInvitation = new Date(parseInt(date));

        if( (!isReset && isBefore(dateInvitation, addDays(dateInvitation, 1))) || (isReset && isBefore(dateInvitation, addHours(dateInvitation, 1))) ) {
            reset({ password: '', confirmPassword: '' });
            if( id ) {
                retrieveUserById({ id });
            }
        } else {
            onToast({ message: t('messages.link-expired'), type: 'info' });
            onClose();
        }
    }, [id]);
    
    /** Manage to update the password & login the user into platform */
    const onSubmit = async (data: any): Promise<void> => {
        setLoading(true);
        
        if( data.password !== data.confirmPassword ) {
            onToast({ message: t('messages.password-not-match'), type: 'error' });
            setLoading(false);
            return;
        }

        /*const response: FetchResult<{ data: ApiResponse<UserBasicSafe> }> = await updatePasswordUserById({ id: id as string, input: { password: data.password } });
        if( response.data?.data.success ) {
            onToast({ message: isReset ? t('messages.password-updated') :  response.data?.data?.message || '', type: 'success' });
        }
        setLoading(false);
        if( response.data?.data.message ) {
            onLogin({ username: response.data.data.data?.username || '', password: data.password });
        }*/
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
           <DialogContent className="sm:max-w-212.5 overflow-hidden gap-0 border-none rounded-2xl shadow-2xl p-0!">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-137.5">
                    {/* Left Panel: Context & Summary */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-border/50 p-6 flex flex-col relative overflow-hidden">                        
                        <div className="relative z-10">
                            <h3 className="text-xs font-[Lato-Bold] text-muted-foreground uppercase tracking-wider mb-6"> { t('titles.welcome') } </h3>
                            
                            {/* User Profile Card */}
                            <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-6 flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-slate-100 dark:border-border">
                                    <AvatarFallback className="bg-slate-100 dark:bg-secondary text-slate-700 dark:text-foreground font-[Lato-Bold]"> { user ? `${user.firstName} ${user.lastName}`.split(' ').map((split: string) => split[0].toUpperCase()).join('') : '' } </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-[Lato-Bold] text-sm text-foreground truncate"> { `${ user?.firstName } ${ user?.lastName }` } </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col h-full bg-white dark:bg-card overflow-auto">
                        <DialogHeader className="flex flex-row! items-center! gap-3 mb-6">
                            <DialogTitle className="text-3xl! font-[Lato-Black]"> { isReset ? t('titles.forgot-password') : t('titles.first-step') } </DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-1 flex-col gap-8 overflow-y-auto pr-2">
                            <span> { isReset ? t('labels.forgot-password-description') : t('labels.invite-user-description') } </span>

                            <Field control={control} name='password' label={ t('labels.password') } placeholder={ t('placeholders.password-placeholder') } type='password' required />
                            <Field control={control} name='confirmPassword' label={ t('labels.confirm-password') } placeholder={ t('placeholders.password-placeholder') } type='password' required />

                            <button onClick={handleSubmit(onSubmit)} className="w-full h-11 text-base font-[Lato-Regular] bg-primary text-white rounded-md hover:bg-sidebar-primary/70 cursor-pointer shadow-sm hover:shadow-md transition-all" disabled={loading}>
                                { loading ? t("buttons.signing-in") : t("buttons.confirm-and-login") }
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default InviteUser;