import {
	type ReactElement
} from 'react';
import {
	PERMISSIONS,
	RESOURCE_LABELS,
	RESOURCES
} from '../constants/permissions';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '../../../shared/components/accordion';
import {
	Badge
} from '../../../shared/components/badge';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
} from '../../../shared/components/tooltip';
import type {
	Role
} from '@l-ark/types';
import PermissionRow from './permission-row';

const RoleDefinitionGrid = ({ roles, canEdit = true }: { roles: Array<Role>; canEdit?: boolean }): ReactElement => {
	
	/** Manage to sort the roles by id */
	const sortedRoles = [...roles].sort((a: Role, b: Role) => a.id - b.id);

	return (
		<div className="overflow-x-auto">
			<div className="min-w-fit">
				{/* Column header row — sticky top */}
				<div className="flex items-end border-b border-border/60 bg-[#F8F9FA] sticky top-0 z-10 py-4">
					{/* Header first col — sticky left + top */}
					<div className="w-50 shrink-0 sticky left-0 z-20 bg-[#F8F9FA] px-6 text-[11px] font-[Lato-Bold] uppercase tracking-widest text-muted-foreground">
						Permission
					</div>
					{ sortedRoles.map((role) => (
						<TooltipProvider key={role.id}>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="w-52 shrink-0 text-center cursor-help px-2">
										<span className="text-[13px] font-[Lato-Bold] text-foreground leading-snug whitespace-nowrap">
											{ role.name }
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-70">
									<p className="text-primary-foreground/70">
										{ (role as any).description }
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>

				{/* Accordion resource groups */}
				<Accordion type="multiple" defaultValue={[...RESOURCES]}>
					{ RESOURCES.map((resource) => {
						const perms = PERMISSIONS.filter((p) => p.resource === resource);

						return (
							<AccordionItem key={resource} value={resource} className="border-b border-border/40">
								<AccordionTrigger headerClassName="sticky left-0 z-[5] bg-white w-fit" className="px-6 font-[Lato-Bold] text-sm hover:no-underline hover:bg-secondary/40">
									<span className="flex items-center gap-2">
										{ RESOURCE_LABELS[resource] }
										<Badge className="bg-gray-100! text-gray-500! text-[10px] border-0!">
											{ perms.length }
										</Badge>
									</span>
								</AccordionTrigger>
								<AccordionContent className="pb-0!">
									{ perms.map((perm) => <PermissionRow key={perm.key} permission={perm} roles={sortedRoles} canEdit={canEdit} /> ) }
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			</div>
		</div>
	);
};

export default RoleDefinitionGrid;
