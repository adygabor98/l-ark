import React, {
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
    GitBranch,
    Info,
    Plus,
    UserCircle
} from 'lucide-react';
import {
    useForm
} from 'react-hook-form';
import {
    useToast
} from '../../../shared/hooks/useToast';
import type {
    FetchResult
} from '@apollo/client';
import {
    Status,
    type ApiResponse,
    type OfficeResponse
} from '@l-ark/types';
import {
    useOffice
} from '../../../server/hooks/useOffice';
import {
    Avatar,
    AvatarFallback
} from '../../../shared/components/avatar';
import {
    getShortNameUser
} from '../../../shared/utils/user.utils';
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
    idUser?: number;
    idDivision?: number;
    autor: Autor;
    open: boolean;
    setOpen:  Dispatch<SetStateAction<any>>;
}

const AssignOffice = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { assignment, autor, open, idUser, idDivision, setOpen } = props;
    /** Permissions utilities */
    const { user } = usePermissions();
    /** Definition of the formulary */
    const { control, handleSubmit, reset } = useForm<any>({
        mode: 'onChange',
        defaultValues: {
            idOfficeUser: '',
            idOffice: '',
            idUser: '',
            isEnabled: true
        }
    });
    /** Office api utilities */
    const { checkMultipleOfficeAssignments, assignUserToOffice, assignOfficeToDivision, updateUserToOffice, updateOfficeToDivision } = useOffice();
    /** Toast api utilities */
    const { onToast, onConfirmationToast } = useToast();
    /** State to manage the loading */
    const [loading, setLoading] = useState<boolean>(false);
    /** State to manage if its edition or creation */
    const isEdition = useMemo(() => assignment && Object.keys(assignment).length > 0, [assignment]);
    /** Translation utilities */
    const { t } = useTranslation();

    /** If an assignment have been provided we initialize the form */
    useEffect(() => {
        if( isEdition ) {
            reset({
                [idDivision ? 'idOfficeDivision' : 'idOfficeUser']: assignment.id,
                idUser: idDivision ? assignment.manager?.id : (assignment.user?.id ?? idUser),
                idOffice: assignment.office.id,
                isEnabled: assignment.status === Status.ACTIVE ? true : false
            });
        }
    }, [assignment])

    /** Manage to create a new assigning of division-office-user */
    const onCreateAssignments = async (data: any): Promise<void> => {
        let response: FetchResult<{ data: OfficeResponse | ApiResponse }> | null = null;

        const responseUserAssignments: FetchResult<{ data: boolean }> = await checkMultipleOfficeAssignments({ idUser: (idUser ?? data.idUser).toString(), idOffice: data.idOffice });

        if( responseUserAssignments.data?.data ) {
            const { confirmed } = await onConfirmationToast({
                title: t('common.alert'),
                description: t('common.user-already-assigned'),
                actionText: t('buttons.assign-anyway'),
                cancelText: t('buttons.cancel'),
            });

            if (confirmed) {
                if( idUser ) {
                    response = await assignUserToOffice({ idOffice: data.idOffice, idUser: idUser.toString()  });
                } else if (idDivision ) {
                    response = await assignOfficeToDivision({ idOffice: data.idOffice, idUser: data.idUser, idDivision: idDivision.toString() });
                }
            }
        } else { // The first office assigned
            if( idUser ) {
                response = await assignUserToOffice({ idOffice: data.idOffice, idUser: idUser.toString()  });
            } else if (idDivision ) {
                response = await assignOfficeToDivision({ idOffice: data.idOffice, idUser: data.idUser, idDivision: idDivision.toString() });
            }
        }

        onToast({ message: response?.data?.data.message ?? '', type: response?.data?.data?.success ? 'success' : 'error' });
        setLoading(false);
        reset({ idOfficeUser: '', idOffice: '', idUser: '', isEnabled: true });
        setOpen(null);
    }

    /** Manage to update the information of the assignment */
    const onUpdateAssignments = async (data: any): Promise<void> => {
        let response: FetchResult<{ data: OfficeResponse | ApiResponse }> | null = null;

        if( idUser ) {
            if( !data.isEnabled ) {
                response = await updateUserToOffice({ idOfficeUser: assignment.id, isEnabled: data.isEnabled });
            } else {
                const responseUserAssignments: FetchResult<{ data: boolean }> = await checkMultipleOfficeAssignments({ idUser: (idUser ?? data.idUser).toString(), idOffice: data.idOffice });

                if( responseUserAssignments.data?.data ) {
                    const { confirmed } = await onConfirmationToast({
                        title: t('common.alert'),
                        description: t('common.user-already-assigned'),
                        actionText: t('buttons.assign-anyway'),
                        cancelText: t('buttons.cancel'),
                    });

                    if (confirmed) {
                        response = await assignUserToOffice({ idOffice: data.idOffice, idUser: idUser.toString()  });
                    }
                } else {
                    response = await updateUserToOffice({ idOfficeUser: assignment.id, isEnabled: data.isEnabled });
                }
            }
        } else if (idDivision ) {
            response = await updateOfficeToDivision({ idOfficeDivision: assignment.id, idOffice: data.idOffice, idDivision: idDivision.toString(), idUser: data.idUser, isEnabled: data.isEnabled });
        }

        onToast({ message: response?.data?.data.message ?? '', type: response?.data?.data?.success ? 'success' : 'error' });
        setLoading(false);
        reset({ idOfficeUser: '', idOffice: '', idUser: '', isEnabled: true });
        setOpen(null);
    }

    /** Manage to submit a creation/update of office-user relation */
    const onSubmit = async (data: any): Promise<void> => {
        setLoading(true);

        try {
            if( isEdition ) {
                await onUpdateAssignments(data);
            } else {
                await onCreateAssignments(data);
            }
        } catch(e) {
            console.error(e);
            setLoading(false);
        }
    }

    /** Manage to close the current modal */
    const onCancel = (state: boolean = false) => {
        reset({ idOfficeUser: '', idOffice: '', idUser: '', isEnabled: true });
        setOpen(state ? assignment ?? {} : null);
    }

    /** Return the information of the banner */
    const getInfoBanner = (): React.ReactNode => {
        if( isEdition ) {
            if( idUser ) {
                return <><span className="font-[Lato-Bold]"> { t('labels.status-change') } </span> { t('labels.status-change-description') } </>;
            }
            return <><span className="font-[Lato-Bold]"> { t('divisions.reassign-manager') } </span> { t('division.reassign-manager-description') } </>;
        }
        if( idUser ) {
            return <><span className="font-[Lato-Bold]"> { t('offices.assign-office') } </span> { t('offices.assign-office-description') } </>;
        }
        return <><span className="font-[Lato-Bold]"> { t('offices.assign-office-division') } </span> { t('offices.assign-office-division-description' ) } </>;
    }

    /** Manage to return the banner warning */
    const getWarningBanner = (): React.ReactNode => {
        if( idUser ) {
            return <><span className="font-[Lato-Bold]"> { t('common.heads-up') } </span> { t('divisions.disabling-manager') } </>;
        }
        return <><span className="font-[Lato-Bold]"> { t('common.heads-up') } </span> { t('divisions.disabling-user-operations-warning') } </>;
    }

    /** Manage to retrieve the titile of the modal */
    const getTitle = (): string => {
        if( isEdition ) return t('titles.edit-office-assignment');
        return idUser ? t('titles.assign-office') : t('titles.assign-office-division');
    }

    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogTrigger asChild>
                <Button variant='secondary'>
                    <Plus className="h-4 w-4" /> { t('titles.assign-office') }
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
                                        { idUser ? <UserCircle className="h-4 w-4" /> : <GitBranch className="h-4 w-4" /> }
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
                            <DialogTitle className="text-2xl font-[Lato-Bold]"> { getTitle() } </DialogTitle>
                        </DialogHeader>

                        <div className="flex items-start gap-2.5 rounded-sm bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 px-3 py-2 mb-4">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
                            <p className="text-xs font-[Lato-Regular] text-blue-900 dark:text-blue-200 leading-relaxed">
                                { getInfoBanner() }
                            </p>
                        </div>
                        { isEdition &&
                            <div className="flex items-start gap-2.5 rounded-sm bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 px-3 py-2 mb-4">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                                <p className="text-xs font-[Lato-Regular] text-amber-900 dark:text-amber-200 leading-relaxed">
                                    { getWarningBanner() }
                                </p>
                            </div>
                        }

                        <div className='h-full flex flex-col gap-4 mb-2'>
                            <Field control={control} name='idOffice' label={ t('offices.office') } type='select' dataType='offices' params={{ idUser: isEdition ? null : idUser, idDivision: isEdition ? null : idDivision }} placeholder={ t('placeholders.select-office') } required disabled={isEdition} />
                            { idDivision &&
                                <Field control={control} name='idUser' label={ t('labels.manager') } type='select' dataType='users' placeholder={ t('placeholders.select-employee') } required />
                            }
                            { isEdition &&
                                <Field control={control} name='isEnabled' label={ t('labels.active') } type='checkbox' />
                            }
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                            <div className="w-1/2 flex items-center text-xs text-muted-foreground">
                                <span className="text-destructive mr-0.5">*</span>
                                <span> { t('common.required-fields') } </span>
                            </div>
                            <div className="w-full flex items-center justify-end gap-2">
                                <Button variant='secondary' onClick={( )=> onCancel()}>
                                    { t('buttons.cancel') }
                                </Button>
                                <Button variant='primary' onClick={handleSubmit(onSubmit)}>
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

export default AssignOffice
