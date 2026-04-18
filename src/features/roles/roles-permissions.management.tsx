import {
	useEffect,
	useState,
	type ReactElement
} from 'react';
import {
	useForm,
	FormProvider
} from 'react-hook-form';
import {
	Shield,
	Save
} from 'lucide-react';
import type {
	RolePermissions
} from './types';
import {
	Card,
	CardContent
} from '../../shared/components/card';
import type {
	FetchResult
} from '@apollo/client';
import type {
	ApiResponse
} from '@l-ark/types';
import {
	useToast
} from '../../shared/hooks/useToast';
import {
	useTranslation
} from 'react-i18next';
import {
	useRole
} from '../../server/hooks/useRole';
import {
	extractFieldErrors,
	applyResponseErrors,
	getResponseMessage
} from '../../server/hooks/useApolloWithToast';
import Button from '../../shared/components/button';
import RoleDefinitionGrid from './components/role-definition-grid';

export interface RolesFormValues {
	permissions: Record<string, RolePermissions>;
}

const RolesPermissionsManagement = (): ReactElement => {
	/** Fetch roles from the API */
	const { roles, retrieveRoles, updateRoles } = useRole();
	/** Definition of the form */
	const form = useForm<RolesFormValues>({ defaultValues: { permissions: {} } });
	/** State to manage the loading */
	const [loading, setLoading] = useState<boolean>(false);
	/** Toast utilities */
	const { onToast }= useToast();
	/** Translation utilities */
	const { t } = useTranslation();

	/** Fetch roles on mount */
	useEffect(() => {
		retrieveRoles();
	}, []);

	/** Reset form when API roles arrive */
	useEffect(() => {
		if (roles.length > 0) {
			const permissions = Object.fromEntries(roles.map((role) => [role.id, (role.permissions ?? {}) as RolePermissions]));

			form.reset({ permissions });
		}
	}, [roles]);

	const onSubmit = async (data: RolesFormValues): Promise<void> => {
		setLoading(true);

		try {
			const response: FetchResult<{ data: ApiResponse<number> }> = await updateRoles({ input: data });

			if( !response.data?.data?.success ) applyResponseErrors(response.data?.data?.errors, form.setError);
			onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
			setLoading(false);
		} catch( e ) {
			extractFieldErrors(e).forEach(({ field, message }) => form.setError(field as any, { message }));
			setLoading(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div>
					<h2 className="text-3xl font-[Lato-Bold] tracking-tight text-[#1A1A1A] flex items-center gap-3">
						<Shield className="w-8 h-8 text-[#D4AF37]" />
						Roles & Permissions
					</h2>
					<p className="font-[Lato-Regular] text-muted-foreground mt-2 max-w-2xl text-sm">
						Define which permissions each role has
					</p>
				</div>

				<div className="flex items-center gap-4">
					{/* Save */}
					<Button variant="primary" size="md" loading={loading} loadingText={ t('buttons.saving') } disabled={ !form.formState.isDirty } onClick={() => { form.clearErrors(); form.handleSubmit(onSubmit)(); }}>
						<Save className="w-4 h-4 mr-2" />
						Save Changes
					</Button>
				</div>
			</div>

			{/* Permission matrix */}
			<Card>
				<CardContent className="p-0!">
					<FormProvider {...form}>
						<RoleDefinitionGrid roles={roles} />
					</FormProvider>
				</CardContent>
			</Card>
		</div>
	);
};

export default RolesPermissionsManagement;
