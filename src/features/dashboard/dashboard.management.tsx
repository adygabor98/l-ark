import { useSelector } from "react-redux";
import { type ReactElement } from "react";
import { selectUser } from "../../store/selectors/user.selector";
import { EmployeeDashboard } from "./components/employee-dashboard";
import { AdminDashboard } from "./components/admin-dashboard";
import { DirectorDashboard } from "./components/director-dashboard";
import { ExecutiveDashboard } from "./components/executive-dashboard";

const DashboardManagement = (): ReactElement => {
    const user = useSelector(selectUser);
    const roleType = user?.role?.code;

    const renderDashboard = () => {
        if (roleType === "C")   return <EmployeeDashboard />;
        if (roleType === "ADM") return <AdminDashboard />;
        if (roleType === "DIR") return <DirectorDashboard />;
        return <ExecutiveDashboard />;   // DG and any authenticated fallback
    };

    return (
        <div className="min-h-screen w-full bg-[#F5F6F8] text-[#1A1A1A] font-sans">
            <div className="max-w-400 mx-auto p-4 md:p-10 space-y-8 pb-24 md:pb-10">
                {renderDashboard()}
            </div>
        </div>
    );
};

export default DashboardManagement;
