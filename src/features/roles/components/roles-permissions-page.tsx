import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Shield, Lock, Save } from 'lucide-react';
import { usePermissionsContext } from '../context/permissions-context';
import { usePermissions } from '../hooks/use-permissions';
import RoleDefinitionGrid from './role-definition-grid';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../../shared/components/select';
import { Card, CardContent } from '../../../shared/components/card';
import Button from '../../../shared/components/button';

// ── Form shape ──────────────────────────────────────────────
export interface RolesFormValues {
  permissions: Record<string, string[]>;
}

const RolesPermissionsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { roles, users, currentUserId, setCurrentUserId, setRolePermissions } =
    usePermissionsContext();

  const canView = hasPermission('roles_permissions.view');
  const canEdit = hasPermission('roles_permissions.edit');

  // ── Form setup ──────────────────────────────────────────
  const defaultValues = useMemo<RolesFormValues>(
    () => ({
      permissions: Object.fromEntries(
        roles.map((r) => [r.id, [...r.permissions]]),
      ),
    }),
    [roles],
  );

  const form = useForm<RolesFormValues>({ defaultValues });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = (data: RolesFormValues) => {
    setRolePermissions(data.permissions);
    form.reset(data);
  };

  // ── Access denied ───────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="w-12 h-12 text-amber-400 mb-4" />
        <h3 className="text-xl font-[Lato-Bold] text-[#1A1A1A]">
          Access Denied
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          You don't have permission to view the Roles & Permissions page.
        </p>
      </div>
    );
  }

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
          {/* User switcher (demo) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-[Lato-Regular] whitespace-nowrap">
              Viewing as:
            </span>
            <Select value={currentUserId} onValueChange={setCurrentUserId}>
              <SelectTrigger className="w-[220px] rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} {u.roleId ? `(${u.roleId})` : '(no role)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save */}
          {canEdit && (
            <Button
              variant="primary"
              size="md"
              disabled={!form.formState.isDirty}
              onClick={form.handleSubmit(onSubmit)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Permission matrix */}
      <Card>
        <CardContent className="p-0!">
          <FormProvider {...form}>
            <RoleDefinitionGrid />
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissionsPage;
