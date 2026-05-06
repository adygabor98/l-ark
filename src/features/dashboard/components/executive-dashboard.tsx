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
    Activity,
    Users,
    Building,
    Bell,
    Calendar,
    Briefcase,
    ChevronRight,
    TrendingUp
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import {
    Avatar,
    AvatarFallback
} from "../../../shared/components/avatar";
import {
    useOperationInstance
} from "../../../server/hooks/useOperationInstance";
import {
    useOffice
} from "../../../server/hooks/useOffice";
import {
    useUser
} from "../../../server/hooks/useUser";
import {
    useAgenda
} from "../../../server/hooks/useAgenda";
import {
    useNotification
} from "../../../server/hooks/useNotification";
import {
    OperationInstanceStatus,
    UserStatus
} from "@l-ark/types";
import usePermissions from "../../../shared/hooks/usePermissions";

/** Render the glass card */
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

interface StatPropTypes {
    title: string;
    value: string | number;
    trend?: number;
    icon: React.ElementType;
    dark?: boolean;
}

const StatCard = (props: StatPropTypes) => {
    /** Retrieve component properties */
    const { title, value, trend, icon: Icon, dark = false } = props;
    
    return (
        <GlassCard className={`flex flex-col justify-between p-6 h-40 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dark ? "bg-[#1A1A1A] border-[#1A1A1A] text-white" : "bg-white"}`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 ${dark ? "bg-[#FFBF00]" : "bg-[#1A1A1A]"}`} />
            <div className="flex justify-between items-start z-10">
                <div className={`p-2.5 rounded-2xl transition-colors ${dark ? "bg-white/10 text-[#FFBF00]" : "bg-[#F3F4F6] text-[#1A1A1A]"}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend !== undefined && (
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${trend > 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>
                        {trend > 0 ? "+" : ""}{trend}%
                    </div>
                )}
            </div>
            <div className="z-10">
                <h3 className={`text-3xl font-bold tracking-tight mb-1 ${dark ? "text-white" : "text-[#1A1A1A]"}`}>{value}</h3>
                <p className={`text-xs font-medium uppercase tracking-wider opacity-60 ${dark ? "text-white" : "text-[#1A1A1A]"}`}>{title}</p>
            </div>
        </GlassCard>
    );
};

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "#9CA3AF",
    ACTIVE: "#3B82F6",
    COMPLETED_READY: "#F59E0B",
    LINKED: "#8B5CF6",
    CLOSED: "#10B981",
    PENDING_PAYMENT: "#F97316",
    PARTIALLY_CLOSED: "#34D399"
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    COMPLETED_READY: "Ready to Close",
    LINKED: "Linked",
    CLOSED: "Closed",
    PENDING_PAYMENT: "Pending Payment",
    PARTIALLY_CLOSED: "Partially Closed"
};

const PIPELINE_ORDER = ["DRAFT", "ACTIVE", "COMPLETED_READY", "PENDING_PAYMENT", "CLOSED"];

export const ExecutiveDashboard = (): ReactElement => {
    /** Permissions utilities */
    const { user } = usePermissions();
    /** Operation instance api utilities */
    const { instances, retrieveInstances } = useOperationInstance();
    /** Office api utilities */
    const { retrieveOffices } = useOffice();
    /** User api utilities */
    const { users, retrieveUsers } = useUser();
    /** Agenda api utilities */
    const { appointments, retrieveAppointments } = useAgenda();
    /** Notification api utilities */
    const { notifications, retrieveNotifications } = useNotification();

    useEffect(() => {
        retrieveInstances({});
        retrieveOffices();
        retrieveUsers({});
        retrieveAppointments({ type: "WEEK" });
        retrieveNotifications({ unreadOnly: true, limit: 5 });
    }, []);

    /** Compute statistics */
    const totalInstances = instances.length;
    const activeCount = instances.filter(i => i.status === OperationInstanceStatus.ACTIVE).length;
    const closedCount = instances.filter(i => i.status === OperationInstanceStatus.CLOSED || i.status === OperationInstanceStatus.PARTIALLY_CLOSED).length;
    const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
    /** Compute status distribution */
    const pipelineCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        instances.forEach(i => { counts[i.status] = (counts[i.status] ?? 0) + 1; });

        return counts;
    }, [instances]);
    /** Compute office ranking */
    const topOffices = useMemo(() => {
        const officeOpCounts: Record<string, { name: string; total: number; closed: number }> = {};

        instances.forEach(inst => {
            if ( !inst.office ) return;

            const key = String(inst.office.id);
            if ( !officeOpCounts[key] ) {
                officeOpCounts[key] = { name: inst.office.name, total: 0, closed: 0 };
            }

            officeOpCounts[key].total++;
            if (inst.status === OperationInstanceStatus.CLOSED || inst.status === OperationInstanceStatus.PARTIALLY_CLOSED) {
                officeOpCounts[key].closed++;
            }
        });

        return Object.values(officeOpCounts).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [instances]);

    const maxOfficeOps = topOffices[0]?.total ?? 1;
    /** Compute employees ranking */
    const employeePerformance = useMemo(() => {
        const perf: Record<string, { name: string; avatar: string; opened: number; closed: number }> = {};

        instances.forEach(inst => {
            if ( !inst.assignedTo ) return;
            const key = String(inst.assignedTo.id);
            const name = `${inst.assignedTo.firstName} ${inst.assignedTo.lastName}`;
            const avatar = `${inst.assignedTo.firstName[0]}${inst.assignedTo.lastName[0]}`.toUpperCase();

            if ( !perf[key] ) {
                perf[key] = { name, avatar, opened: 0, closed: 0 };
            }
            perf[key].opened++;
            if ( inst.status === OperationInstanceStatus.CLOSED || inst.status === OperationInstanceStatus.PARTIALLY_CLOSED) {
                perf[key].closed++;
            }
        });

        return Object.values(perf).sort((a, b) => b.opened - a.opened).slice(0, 5);
    }, [instances]);
    /** Compute status chart data */
    const statusDonut = useMemo(() => Object.entries(pipelineCounts).map(([status, count]) => ({
        name:  STATUS_LABELS[status] ?? status,
        value: count,
        color: STATUS_COLORS[status] ?? "#9CA3AF"
    })), [pipelineCounts] );
   /** Compute agenda weekday */
    const weekDays = useMemo(() => {
        return appointments.reduce((acc: Record<string, typeof appointments>, appt) => {
            const day = format(new Date(appt.startAt), "EEE, MMM d");

            if ( !acc[day] ) acc[day] = [];
            acc[day].push(appt);
            return acc;
        }, {});
    }, [appointments]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                    Executive Overview
                </h2>
                <p className="text-sm text-muted-foreground mt-1"> { format(new Date(), "EEEE, MMM do") } · { user?.firstName } { user?.lastName } </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Operations" value={totalInstances} icon={Briefcase} dark />
                <StatCard title="Active Operations" value={activeCount} icon={Activity} />
                <StatCard title="Closed Operations" value={closedCount} icon={TrendingUp} />
                <StatCard title="Active Users" value={activeUsers} icon={Users} />
            </div>

            {/* Pipeline Status */}
            <GlassCard className="p-0">
                <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-white/50 to-transparent">
                    <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#FFBF00]" />
                            Operations Pipeline
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1"> Current distribution across all stages </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </div>
                </div>
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative min-w-0">
                        <div className="hidden md:block absolute top-7 left-[4%] w-[92%] h-0.5 bg-linear-to-r from-transparent via-gray-200 to-transparent -z-10" />
                        { PIPELINE_ORDER.map(status => {
                            const count = pipelineCounts[status] ?? 0;
                            const hasAlert = status === OperationInstanceStatus.COMPLETED_READY && count > 0;

                            return (
                                <div key={status} className="flex flex-row md:flex-col items-center group cursor-pointer w-full md:w-auto gap-4 md:gap-0 bg-white/50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border md:border-none border-white/50">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-0 md:mb-4 transition-all duration-300 shadow-sm border-2 relative z-10 shrink-0
                                        ${hasAlert ? "bg-white border-amber-100 text-amber-500 shadow-amber-100" : "bg-white border-gray-100 text-[#1A1A1A] group-hover:border-[#FFBF00] group-hover:text-[#FFBF00]"}`}
                                    >
                                        <span className="text-lg font-bold"> { count } </span>
                                        { hasAlert && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" /> }
                                    </div>
                                    <div className="text-left md:text-center flex-1">
                                        <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                                            { STATUS_LABELS[status] }
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </GlassCard>

            {/* Top Offices + Employee Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Offices by Operations */}
                <GlassCard className="lg:col-span-8 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Building className="w-5 h-5 text-[#FFBF00]" />
                                Top Offices
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1"> Ranked by total operations handled </p>
                        </div>
                    </div>
                    { topOffices.length === 0 ?
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground"> No operation data yet </div>
                    :
                        <div className="flex-1 flex flex-col justify-center space-y-5">
                            { topOffices.map((office, idx) => (
                                <div key={idx} className="group cursor-pointer">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className={`text-sm font-bold group-hover:text-[#FFBF00] transition-colors ${idx === 0 ? "text-[#1A1A1A]" : "text-muted-foreground"}`}>
                                            { idx + 1 }. { office.name }
                                        </span>
                                        <div className="text-right flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#1A1A1A]"> { office.total } ops </span>
                                            <span className="text-[10px] text-emerald-500 font-medium"> { office.closed } closed </span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? "bg-[#FFBF00]" : "bg-[#1A1A1A]"}`}
                                            style={{ width: `${(office.total / maxOfficeOps) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </GlassCard>

                {/* Employee Performance */}
                <GlassCard className="lg:col-span-4 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#FFBF00]" />
                                Talent Pulse
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1"> Top performers </p>
                        </div>
                    </div>
                    { employeePerformance.length === 0 ?
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground"> No data yet </div>
                    :
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-gray-100 pb-2">
                                <span> Employee </span>
                                <div className="flex gap-4">
                                    <span className="w-10 text-right text-[#FFBF00]"> Open </span>
                                    <span className="w-10 text-right text-[#1A1A1A]"> Closed </span>
                                </div>
                            </div>
                            { employeePerformance.map((emp, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-[#1A1A1A] text-[#FFBF00] text-[10px] font-bold"> { emp.avatar } </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#FFBF00] transition-colors truncate max-w-25">
                                            { emp.name }
                                        </span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="w-10 text-right text-sm font-bold text-[#FFBF00]"> { emp.opened } </span>
                                        <span className="w-10 text-right text-sm font-bold text-[#1A1A1A]"> { emp.closed } </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </GlassCard>
            </div>

            {/* Status Donut + Agenda + Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Status Distribution */}
                <GlassCard className="lg:col-span-4 p-6 flex flex-col items-center">
                    <h3 className="text-base font-bold text-[#1A1A1A] mb-5 self-start"> Status Distribution </h3>
                    { statusDonut.length === 0 ?
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground"> No data yet </div>
                    :
                        <>
                            <div className="h-45 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusDonut} innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3} cornerRadius={4} stroke="none">
                                            { statusDonut.map((entry, i) => <Cell key={i} fill={entry.color} />) }
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-2 mt-2">
                                { statusDonut.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                            <span className="text-muted-foreground"> { s.name } </span>
                                        </div>
                                        <span className="font-bold text-[#1A1A1A]"> { s.value } </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    }
                </GlassCard>

                {/* This Week's Agenda */}
                <GlassCard className="lg:col-span-5 p-0">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#FFBF00]" />
                            This Week's Agenda
                        </h3>
                    </div>
                    <div className="p-4 space-y-4 max-h-85 overflow-y-auto">
                        { Object.keys(weekDays).length === 0 ?
                            <div className="py-6 text-center text-sm text-muted-foreground"> No appointments this week </div>
                        : Object.entries(weekDays).slice(0, 5).map(([day, appts]) => (
                            <div key={day}>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2"> { day } </div>
                                { appts.map(appt => (
                                    <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                                        <div className="text-xs font-bold text-[#FFBF00] w-12 shrink-0">
                                            { format(new Date(appt.startAt), "HH:mm") }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#FFBF00] transition-colors"> { appt.name } </div>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-[#FFBF00]" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Notifications */}
                <GlassCard className="lg:col-span-3 p-0">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#FFBF00]" />
                            Notifications
                        </h3>
                        { notifications.length > 0 &&
                            <div className="px-2 py-0.5 rounded-lg bg-[#FFBF00] text-white text-[10px] font-bold"> { notifications.length } </div>
                        }
                    </div>
                    <div className="p-4 space-y-3 max-h-85 overflow-y-auto">
                        { notifications.length === 0 ?
                            <div className="py-8 text-center text-sm text-muted-foreground"> All caught up! </div>
                        : notifications.map((n: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                    { n.type?.replace(/_/g, ' ') }
                                </div>
                                { n.title && <div className="text-xs font-bold text-[#1A1A1A] mb-0.5"> { n.title } </div> }
                                { n.message && <p className="text-[10px] text-muted-foreground line-clamp-2"> { n.message } </p> }
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
