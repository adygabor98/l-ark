import {
    useEffect,
    useMemo,
    type ReactElement 
} from "react";
import {
    format
} from "date-fns";
import {
    motion
} from "framer-motion";
import {
    Users,
    Building,
    GitBranch,
    Bell,
    CheckCircle2,
    XCircle
} from "lucide-react";
import {
    useUser
} from "../../../server/hooks/useUser";
import {
    useOffice
} from "../../../server/hooks/useOffice";
import {
    useDivision
} from "../../../server/hooks/useDivision";
import {
    useNotification
} from "../../../server/hooks/useNotification";
import usePermissions from "../../../shared/hooks/usePermissions";

/** Manage to render the glass card component */
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }): ReactElement => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl overflow-hidden ${className}`}
    >
        { children }
    </motion.div>
);

export const AdminDashboard = (): ReactElement => {
    /** Permissions utilities */
    const { user } = usePermissions();
    /** User api utilities */
    const { users, retrieveUsers } = useUser();
    /** Office api utilities */
    const { offices, retrieveOffices } = useOffice();
    /** Division api utilities */
    const { divisions, retrieveDivisions } = useDivision();
    /** Notification api utilities */
    const { notifications, retrieveNotifications } = useNotification();

    useEffect(() => {
        retrieveUsers({});
        retrieveOffices();
        retrieveDivisions();
        retrieveNotifications({ unreadOnly: true, limit: 5 });
    }, []);

    /** Memeorize the user statistics */
    const userStats = useMemo(() => ({
        total: users.length,
        active: users.filter(u => u.status === "ACTIVE").length,
        inactive: users.filter(u => u.status === "INACTIVE").length,
        suspended: users.filter(u => u.status === "SUSPENDED").length,
    }), [users]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                    Administrative Overview
                </h2>
                <p className="text-sm text-muted-foreground mt-1"> { format(new Date(), "EEEE, MMM do") } · Welcome, { user?.firstName } </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 bg-linear-to-br from-[#1A1A1A] to-[#2d2d2d] text-white border-none">
                    <div className="mb-4 p-2 bg-white/10 w-fit rounded-xl"><Users className="w-5 h-5 text-[#FFBF00]" /></div>
                    <div className="text-3xl font-bold"> { userStats.total } </div>
                    <div className="text-xs opacity-60 uppercase tracking-wider mt-1"> Total Users </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-emerald-50 w-fit rounded-xl"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]"> { userStats.active } </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1"> Active </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-gray-100 w-fit rounded-xl"><XCircle className="w-5 h-5 text-gray-400" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]"> { userStats.inactive } </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1"> Inactive </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-[#FFBF00]/10 w-fit rounded-xl"><Building className="w-5 h-5 text-[#FFBF00]" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]"> { offices.length } </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1"> Offices </div>
                </GlassCard>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {/* Offices */}
                    <GlassCard className="p-0">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Building className="w-4 h-4 text-[#FFBF00]" />
                                Offices
                            </h3>
                            <span className="text-xs text-muted-foreground"> { offices.length } total </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            { offices.length === 0 ?
                                <div className="p-8 text-center text-sm text-muted-foreground"> No offices found </div>
                            : offices.map(office => {
                                const activeUsers = office.users?.filter((ou: any) => ou.status === "ACTIVE").length ?? 0;
                                const totalUsers = office.users?.length ?? 0;
                                const isActive = !office.deletedAt;
                                
                                return (
                                    <div key={office.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-bold text-[#1A1A1A]"> { office.name } </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                                    { isActive ? "Active" : "Inactive" }
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                { [office.city, office.code].filter(Boolean).join(" · ") }
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-[#FFBF00]"> { activeUsers } </div>
                                            <div className="text-[10px] text-muted-foreground"> / { totalUsers } users </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>

                    {/* Divisions */}
                    <GlassCard className="p-0">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-[#FFBF00]" />
                                Divisions
                            </h3>
                            <span className="text-xs text-muted-foreground"> { divisions.length } total </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            { divisions.length === 0 ?
                                <div className="p-8 text-center text-sm text-muted-foreground"> No divisions found </div>
                            : divisions.map(div => (
                                <div key={div.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div>
                                        <div className="text-sm font-bold text-[#1A1A1A]"> { div.name } </div>
                                        { div.description &&
                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1"> { div.description } </div>
                                        }
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${div.status === "ACTIVE" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                                        { div.status }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Notifications */}
                <div className="lg:col-span-4">
                    <GlassCard className="p-0">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Bell className="w-4 h-4 text-[#FFBF00]" />
                                Notifications
                            </h3>
                            { notifications.length > 0 &&
                                <div className="px-2 py-0.5 rounded-lg bg-[#FFBF00] text-white text-[10px] font-bold"> { notifications.length } </div>
                            }
                        </div>
                        <div className="p-4 space-y-3">
                            { notifications.length === 0 ?
                                <div className="py-8 text-center text-sm text-muted-foreground"> All caught up! </div>
                            : notifications.map((n, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                        { n.type?.replace(/_/g, ' ') }
                                    </div>
                                    { n.title && <div className="text-sm font-bold text-[#1A1A1A] mb-0.5"> { n.title } </div> }
                                    { n.message && <p className="text-xs text-muted-foreground line-clamp-2"> { n.message } </p> }
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
