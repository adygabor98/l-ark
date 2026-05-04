import type { PermissionPath } from '../services/access-control/permission.types';

export interface NavItem {
    label: string;
    icon: React.ElementType;
    href: string;
    /** Permission(s) required to see this nav item */
    permissions?: PermissionPath | PermissionPath[];
}