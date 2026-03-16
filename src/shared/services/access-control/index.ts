// Service
export { accessControlService, AccessControlService } from './access.service';

// Types
export type {
    PermissionStructure,
    PermissionPath,
    AuthenticatedUser,
    PermissionCheckOptions
} from './permission.types';
export { PERMISSION_PATHS } from './permission.types';

// Route permissions
export type { RoutePermissionConfig, NavPermissionConfig } from './route-permissions';
export { ROUTE_PERMISSIONS, NAV_PERMISSIONS, getRoutePermissionConfig } from './route-permissions';
