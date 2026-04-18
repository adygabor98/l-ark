import {
    useEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '../../../shared/components/dialog';
import {
    AlertTriangle,
    Building2,
    Info,
    Plus
} from 'lucide-react';
import {
    useForm
} from 'react-hook-form';
import {
    Avatar,
    AvatarFallback
} from '../../../shared/components/avatar';
import {
    getShortNameUser
} from '../../../shared/utils/user.utils';
import type {
    FetchResult
} from '@apollo/client';
import {
    Status,
    type ApiResponse
} from '@l-ark/types';
import {
    useOffice
} from '../../../server/hooks/useOffice';
import {
    extractFieldErrors,
    applyResponseErrors,
    getResponseMessage
} from '../../../server/hooks/useApolloWithToast';
import {
    useToast
} from '../../../shared/hooks/useToast';
import usePermissions from '../../../shared/hooks/usePermissions';
import Field from '../../../shared/components/field';
import Button from '../../../shared/components/button';
import { useTranslation } from 'react-i18next';

type Autor = {
    type: string;
    description: string;
}

interface PropTypes {
    assignment?: any;
    autor: Autor;
    idOffice: number;
    open: boolean;
    setOpen:  Dispatch<SetStateAction<number | null>>;
}

const AssignDivision = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { assignment, idOffice, autor, open, setOpen } = props;
    /** Permissions utilities */
    const { user } = usePermissions();
    /** Definition of the formulary */
    const { control, handleSubmit, reset, watch, setError, clearErrors } = useForm<any>({
        mode: 'onChange',
        defaultValues: {
            idOfficeDivision: '',
            idUser: '',
            idDivision: '',
            isEnabled: true
        }
    });
    const idDivision = watch('idDivision');
    /** State to manage the loading of the saving requests */
    const [loading, setLoading] = useState<boolean>(false);
    /** Office api utilities */
    const { checkMultipleOfficeAssignments, assignOfficeToDivision, updateOfficeToDivision } = useOffice();
    /** Toast utilities */
    const{ onToast, onConfirmationToast } = useToast();
    /** State to manage if its edition or creation */
    const isEdition = useMemo(() => assignment && Object.keys(assignment).length > 0, [assignment]);
    /** Translation utilities */
    const { t } = useTranslation();

    /** If an assignment have been provided we initialize the form */
    useEffect(() => {
        if( isEdition ) {
            reset({
                idOfficeDivision: assignment.id,
                idUser: assignment.manager.id.toString(),
                idDivision: assignment.division.id,
                isEnabled: assignment.status === Status.ACTIVE ? true : false
            });
        }
    }, [assignment])

    /** Manage to update/create office-division-user assignment */
    const onSubmit = async (data: any): Promise<void> => {
        setLoading(true);
        
        try {
            if( isEdition ) { // Update existing assignment
                const response: FetchResult<{ data: ApiResponse }> = await updateOfficeToDivision({ ...data, idOffice: idOffice.toString() });
                if( !response.data?.data?.success ) applyResponseErrors(response.data?.data?.errors, setError);
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            } else { // Create new assignment
                const responseUserAssignments: FetchResult<{ data: boolean }> = await checkMultipleOfficeAssignments({ idUser: data.idUser, idOffice: idOffice.toString() });

                if( responseUserAssignments.data?.data ) {
                    const { confirmed } = await onConfirmationToast({
                        title: t('common.alert'),
                        description: t('common.user-already-assigned'),
                        actionText: t('buttons.assign-anyway'),
                        cancelText: t('buttons.cancel'),
                    });

                    if (confirmed) {
                        const response: FetchResult<{ data: ApiResponse }> = await assignOfficeToDivision({ idUser: data.idUser, idDivision: data.idDivision, idOffice: idOffice.toString() });
                        if( !response.data?.data?.success ) applyResponseErrors(response.data?.data?.errors, setError);
                        onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
                    }
                } else {
                    const response: FetchResult<{ data: ApiResponse }> = await assignOfficeToDivision({ idUser: data.idUser, idDivision: data.idDivision, idOffice: idOffice.toString() });
                    if( !response.data?.data?.success ) applyResponseErrors(response.data?.data?.errors, setError);
                    onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
                }
            }
            setLoading(false);
            reset({ idOfficeDivision: '', idUser: '', idDivision: '', isEnabled: true });
            setOpen(null);
        } catch(e) {
            extractFieldErrors(e).forEach(({ field, message }) => setError(field as any, { message }));
            setLoading(false);
        }
    }

    /** Manage to update the visibility of the dialog */
    const onCancel = (state: boolean = false) => {
        reset({ idOfficeDivision: '', idUser: '', idDivision: '', isEnabled: true });
        setOpen(state ? assignment ?? {} : null);
    }

    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogTrigger asChild>
                <Button variant='secondary'>
                    <Plus className="h-4 w-4" /> { t('titles.assign-division') }
                </Button>
            </DialogTrigger>
            <DialogContent className="top-1/2! sm:max-w-225 overflow-visible gap-0 border-none rounded-2xl shadow-2xl p-0!">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-100">

                    {/* Left Panel: Context & Summary */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-border/50 p-6 flex flex-col relative overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-xs font-[Lato-Bold] text-muted-foreground uppercase tracking-wider mb-6">
                                { isEdition ? t('titles.edit-assignment') : t('titles.new-assignment') }
                            </h3>

                            {/* Entity Context Card */}
                            <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-4">
                                <span className="text-xs font-[Lato-Regular] text-muted-foreground uppercase tracking-wider"> { autor.type } </span>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <p className="font-[Lato-Bold] text-sm text-foreground truncate"> { autor.description } </p>
                                </div>
                            </div>

                            {/* Mode Card */}
                            <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border/50 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-primary" />
                                <h4 className="font-[Lato-Regular] text-xs text-muted-foreground mb-1"> { t('labels.mode') } </h4>
                                <p className="text-sm font-[Lato-Bold] text-foreground">
                                    { isEdition ? t('common.editing-assignment') : t('common.creating-assignment') }
                                </p>
                            </div>

                            {/* Performed by */}
                            <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border/50">
                                <Avatar className="h-7 w-7 border border-slate-100 dark:border-border shrink-0">
                                    <AvatarFallback className="bg-slate-100 dark:bg-secondary text-slate-700 dark:text-foreground font-[Lato-Bold] text-xs"> { getShortNameUser(user?.firstName, user?.lastName) } </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground"> { t('labels.perform-by') } </p>
                                    <p className="font-[Lato-Bold] text-xs text-foreground truncate"> { user?.firstName } { user?.lastName } </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col h-full bg-white dark:bg-card overflow-auto">
                        <DialogHeader className="flex flex-row! items-center! gap-3 mb-6">
                            <DialogTitle className="text-2xl font-[Lato-Bold]">
                                { isEdition ? t('titles.edit-division-assignment') : t('titles.assign-division') }
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex items-start gap-2.5 rounded-sm bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 px-3 py-2 mb-4">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
                            <p className="text-xs font-[Lato-Regular] text-blue-900 dark:text-blue-200 leading-relaxed">
                                { isEdition
                                    ? <><span className="font-[Lato-Bold]"> { t('divisions.reassign-manager') } </span> { t('divisions.reassign-manager-description') } </>
                                    : <><span className="font-[Lato-Bold]"> { t('divisions.assign-division') } </span> { t('divisions.assign-division-description') } </>
                                }
                            </p>
                        </div>

                        { isEdition &&
                            <div className="flex items-start gap-2.5 rounded-sm bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 px-3 py-2 mb-4">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                                <p className="text-xs font-[Lato-Regular] text-amber-900 dark:text-amber-200 leading-relaxed">
                                    <span className="font-[Lato-Bold]"> { t('common.heads-up') } </span> { t('divisions.disabling-division') }
                                </p>
                            </div>
                        }

                        <div className='h-full flex flex-col gap-4 mb-2'>
                            <Field control={control} name='idDivision' label={ t('labels.division') } type='select' dataType='divisions' params={{ idOffice: isEdition ? null : idOffice }} placeholder={ t('placeholders.select-divisions') } required disabled={isEdition} />
                            { idDivision &&
                                <Field control={control} name='idUser' label={ t('labels.manager') } type='select' dataType='users' params={{ idOffice: isEdition ? null : idOffice, idDivision: idDivision }} placeholder={ t('placeholders.select-employee') } required />
                            }
                            { isEdition &&
                                <Field control={control} name='isEnabled' label={ t('labels.active-assignment') } type='checkbox' />
                            }
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                            <div className="w-1/2 flex items-center text-xs text-muted-foreground">
                                <span className="text-destructive mr-0.5">*</span>
                                <span> { t('common.required-fields') } </span>
                            </div>
                            <div className="w-full flex items-center justify-end gap-2">
                                <Button variant='secondary' onClick={() => onCancel()}>
                                    { t('buttons.cancel') }
                                </Button>
                                <Button variant='primary' onClick={() => { clearErrors(); handleSubmit(onSubmit)(); }}>
                                    { loading ? t('buttons.saving') : t('buttons.assign') }
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AssignDivision;
