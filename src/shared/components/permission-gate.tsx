import {
    type ReactElement,
    type ReactNode
} from 'react';
import {
    usePermissions
} from '../hooks/usePermissions';
import type {
    PermissionPath,
    PermissionCheckOptions
} from '../services/access-control/permission.types';

interface PropTypes {
    /** The content to render if permission is granted */
    children: ReactNode;
    /** Permission(s) required to render children */
    permissions: PermissionPath | PermissionPath[];
    /** If true, all permissions must be granted. Default: false (any permission grants access) */
    requireAll?: boolean;
    /** Content to render if permission is denied (optional) */
    fallback?: ReactNode;
}

const PermissionGate = (props: PropTypes): ReactElement | null => {
    /** Retrieve component properties */
    const { children, permissions, requireAll = false, fallback = null } = props;
    /** Permissions utilities */
    const { checkPermissions } = usePermissions();

    const options: PermissionCheckOptions = { requireAll };
    const hasAccess = checkPermissions(permissions, options);

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

export default PermissionGate;
