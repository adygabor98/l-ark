import {
    type ReactElement
} from "react";
import {
    EmployeeDashboard
} from "./components/employee-dashboard";
import {
    AdminDashboard
} from "./components/admin-dashboard";
import {
    DirectorDashboard
} from "./components/director-dashboard";
import {
    ExecutiveDashboard
} from "./components/executive-dashboard";
import usePermissions from "../../shared/hooks/usePermissions";
import { UserRole } from "@l-ark/types";

const DashboardManagement = (): ReactElement => {
    /** Permissions utilities */
    const { user } = usePermissions();
    /** Retrieve role code */
    const roleType = user?.role?.code;

    const renderDashboard = () => {
        if ( roleType === UserRole.C )   return <EmployeeDashboard />;
        if ( roleType === UserRole.ADM) return <AdminDashboard />;
        if ( roleType === UserRole.DIR ) return <DirectorDashboard />;
        return <ExecutiveDashboard />;   // DG and any authenticated fallback
    };

    return (
        <div className="min-h-screen w-full bg-[#F5F6F8] text-[#1A1A1A] font-sans">
            <div className="max-w-400 mx-auto p-4 md:p-10 space-y-8 pb-24 md:pb-10">
                { renderDashboard() }
            </div>
        </div>
    );
};

export default DashboardManagement;
