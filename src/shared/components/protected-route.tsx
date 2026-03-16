import {
    type ReactElement,
    type ReactNode
} from 'react';
import {
    Navigate,
    useLocation
} from 'react-router-dom';
import {
    usePermissions
} from '../hooks/usePermissions';
import type {
    PermissionPath,
    PermissionCheckOptions
} from '../services/access-control/permission.types';
import Unauthorized from '../../pages/unauthorized';

interface PropTypes {
    /** The content to render if access is granted */
    children: ReactNode;
    /** Permission(s) required to access this route */
    permissions?: PermissionPath | PermissionPath[];
    /** Permission check options */
    options?: PermissionCheckOptions;
    /** Where to redirect if not authenticated. Default: '/' */
    loginRedirect?: string;
}

const ProtectedRoute = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { children, permissions, options = {}, loginRedirect = '/'} = props;
    /** Location utilities */
    const location = useLocation();
    /** Permissions utilities */
    const { isAuthenticated, canAccessRoute } = usePermissions();

    // Check authentication first
    if (!isAuthenticated) {
        // Redirect to login, preserving the intended destination
        return (
            <Navigate
                to={loginRedirect}
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    // Check permissions if specified
    if (permissions) {
        const hasAccess = canAccessRoute(permissions, options);

        if (!hasAccess) {
            // Show 403 unauthorized page
            return <Unauthorized />;
        }
    }

    // Access granted - render children
    return <>{children}</>;
};

export default ProtectedRoute;
