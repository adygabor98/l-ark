import {
	useEffect,
	useState,
	type Dispatch,
	type SetStateAction
} from 'react';
import {
	useForm
} from 'react-hook-form';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '../../../shared/components/dialog';
import {
	format,
	parse,
	parseISO
} from 'date-fns';
import {
	useAgenda
} from '../../../server/hooks/useAgenda';
import type {
	FetchResult
} from '@apollo/client';
import type {
	ApiResponse,
	Appointment
} from '@l-ark/types';
import {
	useToast
} from '../../../shared/hooks/useToast';
import {
	getResponseMessage
} from '../../../server/hooks/useApolloWithToast';
import Field from '../../../shared/components/field';
import usePermissions from '../../../shared/hooks/usePermissions';
import {
	useTranslation
} from 'react-i18next';
import Button from '../../../shared/components/button';

const EMPTY_FORM = {
	name: '',
	description: '',
	employeeIds: [],
	date: '',
	startTime: '09:00',
	endTime: '10:00',
};

interface PropTypes {
	id: number | null | { date: string, startTime: string, endTime: string };
	open: boolean;

	setOpen: Dispatch<SetStateAction<number | null | { date: string, startTime: string, endTime: string }>>;
}
export const AppointmentModal = (props: PropTypes) => {
	/** Retrieve component properties */
	const { id, open, setOpen } = props;
	/** Permissions api utilities */
	const { user } = usePermissions();
	/** Translation utilities */
	const { t } = useTranslation();
	/** Agenda api utilities */
	const { retrieveAppointmentById, createAppointment, updateAppointment, deleteAppointment } = useAgenda();
	/** State to manage the loading */
	const [loading, setLoading] = useState<boolean>(false);
	/** Toast utilities */
	const { onToast } = useToast();
	/** Formulary definition */
	const { control, handleSubmit, reset } = useForm<any>({ defaultValues: EMPTY_FORM });
	/** State to manage the edition state */
	const isEditing = id && id !== -1 && typeof id !== 'object';

	useEffect(() => {
		if ( isEditing ) {
			const initialize = async (): Promise<void> => {
				const response: FetchResult<{ data: Appointment }> = await retrieveAppointmentById({ id: id.toString() });
				if( response.data?.data ) {

					reset({
						name: response.data.data.name,
						description: response.data.data.description ?? '',
						employeeIds: response.data.data.users.map(user => user.user.id),
						date: format(response.data.data.startAt, 'yyyy-MM-dd'),
						startTime: format(response.data.data.startAt, 'HH:mm'),
						endTime: format(response.data.data.endAt, 'HH:mm')
					})
				}
			}
			initialize();
		} else {
			const today = new Date();
			const y = today.getFullYear();
			const m = String(today.getMonth() + 1).padStart(2, '0');
			const d = String(today.getDate()).padStart(2, '0');
			
			reset({
				...EMPTY_FORM,
				date: typeof id === 'object' ? id?.date : `${y}-${m}-${d}`,
				startTime: typeof id === 'object' ? id?.startTime : '09:00',
				endTime: typeof id === 'object' ? id?.endTime : '10:00',
				
			});
		}
	}, [id, reset]);

	/** Manage to create/update an appointment */
	const onSubmit = async (data: any): Promise<void> => {
		setLoading(true);

		const localDate = format(parseISO(data.date), "yyyy-MM-dd");

		const form = {
			name: data.name,
			description: data.description,
			startAt: parse(`${localDate} ${data.startTime}`, "yyyy-MM-dd HH:mm", new Date()),
			endAt: parse(`${localDate} ${data.endTime}`, "yyyy-MM-dd HH:mm", new Date()),
			employeeIds: data.employeeIds
		}

		try {
			if( isEditing ) {
				const response: FetchResult<{ data: ApiResponse }> = await updateAppointment({ id: id, input: form });
				onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
			} else {
				const response: FetchResult<{ data: ApiResponse }> = await createAppointment({ input: form });
				onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
			}
			setLoading(false);
			setOpen(null);
		} catch( e: any ) {
			console.error(e);
			setLoading(false);

		}
	};

	/** Manage to delete an appointment */
	const handleDelete = async (): Promise<void> => {
		try {
			if ( isEditing ) {
				setLoading(true);
				const response: FetchResult<{ data: ApiResponse }> = await deleteAppointment({ id });
				onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
				setOpen(null);
			}
		} catch( e: any ) {
			setLoading(false);
			console.error(e);
		} 
	};

	return (
		<Dialog open={open} onOpenChange={() => setOpen(null)}>
            <DialogContent className="top-1/2! sm:max-w-225 overflow-visible border-none rounded-2xl shadow-2xl">
				<div className="p-6 space-y-5">
					<DialogHeader>
						<DialogTitle>
							{ isEditing ? t('agenda-labels.edit-appointment') : t('agenda-labels.new-appointment') }
						</DialogTitle>
					</DialogHeader>
					<div className='flex flex-col gap-4'>
						{/* Name */}
						<Field control={control} name='name' label={ t('labels.name') } type='text' placeholder={ t('agenda-labels.name-placeholder') } required />

						{/* Description */}
						<Field control={control} name='description' label={ t('labels.description') } type='textarea' placeholder={ t('agenda-labels.description-placeholder') } />

						{/* Date */}
						<Field control={control} name='date' label={ t('agenda-labels.date') } type='date' placeholder={ 'dd-MM-yyyy' } required />

						{/* Start + End time */}
						<div className="flex gap-3">
							<Field control={control} name='startTime' label={ t('agenda-labels.start-at') } type='time' placeholder={ 'HH:MM' } required />
							<Field control={control} name='endTime' label={ t('agenda-labels.end-at') } type='time' placeholder={ 'HH:MM' } required />
						</div>

						{/* Date */}
						<Field control={control} name='employeeIds' label={ t('agenda-labels.employees') } type='select' dataType='users' params={{ sourceUser: user?.id }} multiple placeholder={ t('agenda-labels.employees-placeholder') } required />
					</div>

					{/* Actions */}
					<DialogFooter className="pt-3 border-t border-border/30 mt-1 gap-2!">
						{ isEditing &&
							<Button variant="danger" size="md" onClick={handleDelete} className="mr-auto!">
								{ loading ? t('buttons.deleting') : t('buttons.delete') }
							</Button>
						}
						<Button variant="secondary" size="md" onClick={() => setOpen(null)}>
							{ t('buttons.cancel') }
						</Button>
						<Button variant="primary" size="md" onClick={handleSubmit(onSubmit)}>
							{ loading ? t('buttons.saving') : id ? t('buttons.save-changes') : t('buttons.create') }
						</Button>
					</DialogFooter>
				</div>
            </DialogContent>
        </Dialog>
	);
};
