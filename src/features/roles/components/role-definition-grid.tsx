import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Info, Check, Lock, Minus } from 'lucide-react';
import { usePermissionsContext } from '../context/permissions-context';
import { usePermissions } from '../hooks/use-permissions';
import { PERMISSIONS, RESOURCE_LABELS, RESOURCES } from '../constants/permissions';
import type { Permission, Role } from '../types';
import type { RolesFormValues } from './roles-permissions-page';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../../shared/components/accordion';
import { Badge } from '../../../shared/components/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../../../shared/components/tooltip';

// ── Checkbox cell ───────────────────────────────────────────
const PermissionCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`
      w-[18px] h-[18px] rounded-[4px] border transition-all duration-150 cursor-pointer
      flex items-center justify-center shrink-0
      ${
        checked
          ? 'bg-primary border-primary'
          : 'bg-white border-black/20 hover:border-black/40'
      }
    `}
  >
    {checked && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
  </button>
);

// ── Permission row ──────────────────────────────────────────
const PermissionRow: React.FC<{
  permission: Permission;
  roles: Role[];
  canEdit: boolean;
}> = React.memo(({ permission, roles, canEdit }) => {
  const { control } = useFormContext<RolesFormValues>();

  return (
    <div className="flex items-center px-6 py-2 border-b border-border/20 last:border-b-0 hover:bg-secondary/30 transition-colors">
      {/* Permission label */}
      <div className="w-[200px] shrink-0 flex items-center gap-1.5">
        <span className="text-[13px] font-[Lato-Regular] text-foreground">
          {permission.label}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-muted-foreground/50 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[240px]">
              {permission.description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* One cell per role */}
      {roles.map((role) => (
        <div key={role.id} className="flex-1 flex justify-center min-w-[120px]">
          <Controller
            name={`permissions.${role.id}`}
            control={control}
            render={({ field }) => {
              const perms = field.value as string[];
              const isEnabled = perms.includes(permission.key);

              if (!canEdit) {
                return isEnabled ? (
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                ) : (
                  <Minus className="w-3 h-3 text-black/10" />
                );
              }

              return (
                <PermissionCheckbox
                  checked={isEnabled}
                  onChange={(checked) => {
                    field.onChange(
                      checked
                        ? [...perms, permission.key]
                        : perms.filter((k) => k !== permission.key),
                    );
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

PermissionRow.displayName = 'PermissionRow';

// ── Main grid ───────────────────────────────────────────────
const RoleDefinitionGrid: React.FC = () => {
  const { roles } = usePermissionsContext();
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission('roles_permissions.edit');

  return (
    <div>
      {/* Read-only banner */}
      {!canEdit && (
        <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 border-b border-amber-200 rounded-t-xl">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-[Lato-Regular] text-amber-700">
            Read-only view. You need the &ldquo;Roles & Permissions Edit&rdquo;
            permission to modify.
          </span>
        </div>
      )}

      {/* Column header row */}
      <div className="flex items-end border-b border-border/60 bg-[#F8F9FA] sticky top-0 z-10 px-6 py-4">
        <div className="w-[200px] shrink-0 text-[11px] font-[Lato-Bold] uppercase tracking-widest text-muted-foreground">
          Permission
        </div>
        {roles.map((role) => (
          <TooltipProvider key={role.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 min-w-[120px] text-center cursor-help">
                  <span className="text-[13px] font-[Lato-Bold] text-foreground leading-snug">
                    {role.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px]">
                <p className="text-primary-foreground/70">
                  {role.description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Accordion resource groups */}
      <Accordion type="multiple" defaultValue={[...RESOURCES]}>
        {RESOURCES.map((resource) => {
          const perms = PERMISSIONS.filter((p) => p.resource === resource);
          return (
            <AccordionItem
              key={resource}
              value={resource}
              className="border-b border-border/40"
            >
              <AccordionTrigger className="px-6 font-[Lato-Bold] text-sm hover:no-underline hover:bg-secondary/40">
                <span className="flex items-center gap-2">
                  {RESOURCE_LABELS[resource]}
                  <Badge className="bg-gray-100! text-gray-500! text-[10px] border-0!">
                    {perms.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-0!">
                {perms.map((perm) => (
                  <PermissionRow
                    key={perm.key}
                    permission={perm}
                    roles={roles}
                    canEdit={canEdit}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default RoleDefinitionGrid;
