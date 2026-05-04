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
	Save,
	History,
	RotateCcw
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
	ApiResponse,
	Role
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
	usePermissions
} from '../../shared/hooks/usePermissions';
import {
	extractFieldErrors,
	applyResponseErrors,
	getResponseMessage
} from '../../server/hooks/useApolloWithToast';
import Button from '../../shared/components/button';
import RoleDefinitionGrid from './components/role-definition-grid';
import RoleHistoryDrawer from './components/role-history-drawer';

export interface RolesFormValues {
	permissions: Record<string, RolePermissions>;
}

const RolesPermissionsManagement = (): ReactElement => {
	/** Fetch roles from the API */
	const { roles, retrieveRoles, updateRoles, resetRolePermissions } = useRole();
	/** Permission gate */
	const { hasPermission } = usePermissions();
	const canEdit = hasPermission('roles_permissions.edit' as any);
	/** Definition of the form */
	const form = useForm<RolesFormValues>({ defaultValues: { permissions: {} } });
	/** State to manage the loading */
	const [loading, setLoading] = useState<boolean>(false);
	const [resettingId, setResettingId] = useState<string | number | null>(null);
	const [historyRole, setHistoryRole] = useState<Role | null>(null);
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

	const handleReset = async (role: Role): Promise<void> => {
		if (!canEdit) return;
		const confirmed = window.confirm(`Reset "${role.name}" permissions to system defaults?`);
		if (!confirmed) return;

		setResettingId(role.id);
		try {
			const response: FetchResult<{ data: ApiResponse<number> }> = await resetRolePermissions({ roleId: String(role.id) });
			onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data?.success ? 'success' : 'error' });
			if (response.data?.data?.success) {
				await retrieveRoles();
			}
		} catch (e) {
			console.error('reset role failed', e);
		} finally {
			setResettingId(null);
		}
	};

	const sortedRoles = [...roles].sort((a: Role, b: Role) => a.id - b.id);

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
					<Button variant="primary" size="md" loading={loading} loadingText={ t('buttons.saving') } disabled={ !form.formState.isDirty || !canEdit } onClick={() => { form.clearErrors(); form.handleSubmit(onSubmit)(); }}>
						<Save className="w-4 h-4 mr-2" />
						Save Changes
					</Button>
				</div>
			</div>

			{/* Per-role actions */}
			{sortedRoles.length > 0 && (
				<Card>
					<CardContent className="p-4">
						<div className="flex flex-wrap gap-3">
							{sortedRoles.map((role) => (
								<div key={role.id} className="flex items-center gap-2 border border-border/40 rounded-md px-3 py-2 bg-white">
									<span className="text-[13px] font-[Lato-Bold] text-foreground">{role.name}</span>
									<button
										type="button"
										title="View permission history"
										className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer"
										onClick={() => setHistoryRole(role)}
									>
										<History className="w-4 h-4" />
									</button>
									{canEdit && (
										<button
											type="button"
											title="Reset to default permissions"
											disabled={resettingId === role.id}
											className="text-muted-foreground hover:text-amber-600 transition-colors p-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
											onClick={() => handleReset(role)}
										>
											<RotateCcw className={`w-4 h-4 ${resettingId === role.id ? 'animate-spin' : ''}`} />
										</button>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Permission matrix */}
			<Card>
				<CardContent className="p-0!">
					<FormProvider {...form}>
						<RoleDefinitionGrid roles={roles} canEdit={canEdit} />
					</FormProvider>
				</CardContent>
			</Card>

			{/* History drawer */}
			<RoleHistoryDrawer
				open={historyRole !== null}
				onClose={() => setHistoryRole(null)}
				roleId={historyRole ? String(historyRole.id) : null}
				roleName={historyRole?.name ?? undefined}
			/>
		</div>
	);
};

export default RolesPermissionsManagement;
