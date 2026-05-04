import React, {
	type ReactElement
} from 'react';
import {
	Check,
	Info
} from 'lucide-react';
import type {
	Permission,
	RolePermissions
} from '../types';
import type {
	Role
} from '@l-ark/types';
import {
	Controller,
	useFormContext
} from 'react-hook-form';
import type {
	RolesFormValues
} from '../roles-permissions.management';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '../../../shared/components/tooltip';

const PermissionCheckbox = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }): ReactElement => (
	<button type="button" role="checkbox" disabled={disabled} onClick={() => !disabled && onChange(!checked)}
		className={`w-4.5 h-4.5 rounded-[4px] border transition-all duration-150 flex items-center justify-center shrink-0
			${ checked ? 'bg-primary border-primary' : 'bg-white border-black/20 hover:border-black/40'}
			${ disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
		`}
	>
		{ checked && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} /> }
	</button>
);

const PermissionRow = React.memo(({ permission, roles, canEdit = true }: { permission: Permission; roles: Array<Role>; canEdit?: boolean; }): ReactElement => {
	/** Retrieve form utilities */
	const { control } = useFormContext<RolesFormValues>();

	return (
		<div className="group flex items-center py-2 border-b border-border/20 last:border-b-0 hover:bg-secondary/30 transition-colors">
			{/* Permission label — sticky left */}
			<div className="w-50 shrink-0 flex items-center gap-1.5 sticky left-0 z-5 bg-white  transition-colors px-6">
				<span className="text-[13px] font-[Lato-Regular] text-foreground">
					{ permission.label }
				</span>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Info className="w-3 h-3 text-muted-foreground/50 cursor-help shrink-0" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-60">
							{ permission.description }
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			{/* One cell per role */}
			{ roles.map((role) => (
				<div key={role.id} className="w-52 shrink-0 flex justify-center">
					<Controller name={`permissions.${role.id}`} control={control}
						render={({ field }) => {
							const perms = field.value as RolePermissions;
							const isEnabled = perms?.[permission.resource]?.[permission.action] ?? false;

							return (
								<PermissionCheckbox
									checked={isEnabled}
									disabled={!canEdit}
									onChange={(checked) => {
										field.onChange({
											...perms,
											[permission.resource]: {
												...perms?.[permission.resource],
												[permission.action]: checked,
											},
										});
									}}
								/>
							);
						}}
					/>
				</div>
			))}
		</div>
	);
});

export default PermissionRow;