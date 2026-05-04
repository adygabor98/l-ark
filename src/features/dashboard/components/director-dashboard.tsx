import { useEffect, useMemo, type ReactElement } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Activity, Users, Bell, Calendar, BarChart2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { selectUser } from "../../../store/selectors/user.selector";
import { useOperationInstance } from "../../../server/hooks/useOperationInstance";
import { useAgenda } from "../../../server/hooks/useAgenda";
import { useNotification } from "../../../server/hooks/useNotification";

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl overflow-hidden ${className}`}
    >
        {children}
    </motion.div>
);

const STATUS_COLORS: Record<string, string> = {
    DRAFT:            "#9CA3AF",
    ACTIVE:           "#3B82F6",
    COMPLETED_READY:  "#F59E0B",
    LINKED:           "#8B5CF6",
    CLOSED:           "#10B981",
    PENDING_PAYMENT:  "#F97316",
    PARTIALLY_CLOSED: "#34D399",
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT:            "Draft",
    ACTIVE:           "Active",
    COMPLETED_READY:  "Ready to Close",
    LINKED:           "Linked",
    CLOSED:           "Closed",
    PENDING_PAYMENT:  "Pending Payment",
    PARTIALLY_CLOSED: "Partially Closed",
};

export const DirectorDashboard = (): ReactElement => {
    const user = useSelector(selectUser);
    const { instances, retrieveInstances } = useOperationInstance();
    const { appointments, retrieveAppointments } = useAgenda();
    const { notifications, retrieveNotifications } = useNotification();

    useEffect(() => {
        retrieveInstances({});
        retrieveAppointments({ type: "WEEK" });
        retrieveNotifications({ unreadOnly: true, limit: 5 });
    }, []);

    const statusDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        instances.forEach(i => { counts[i.status] = (counts[i.status] ?? 0) + 1; });
        return Object.entries(counts).map(([status, count]) => ({
            name:   STATUS_LABELS[status] ?? status,
            value:  count,
            color:  STATUS_COLORS[status] ?? "#9CA3AF",
        }));
    }, [instances]);

    const teamWorkload = useMemo(() => {
        const workload: Record<string, { name: string; total: number; completed: number }> = {};
        instances.forEach(inst => {
            if (!inst.assignedTo) return;
            const key = String(inst.assignedTo.id);
            const name = `${inst.assignedTo.firstName} ${inst.assignedTo.lastName}`;
            if (!workload[key]) workload[key] = { name, total: 0, completed: 0 };
            workload[key].total++;
            if (inst.status === "CLOSED" || inst.status === "PARTIALLY_CLOSED") workload[key].completed++;
        });
        return Object.values(workload).sort((a, b) => b.total - a.total).slice(0, 6);
    }, [instances]);

    const activeCount   = instances.filter(i => i.status === "ACTIVE").length;
    const closedCount   = instances.filter(i => i.status === "CLOSED" || i.status === "PARTIALLY_CLOSED").length;
    const pendingCount  = instances.filter(i => i.status === "COMPLETED_READY" || i.status === "PENDING_PAYMENT").length;
    const today         = format(new Date(), "EEEE, MMM do");

    const weekDays = useMemo(() => {
        return appointments.reduce((acc: Record<string, typeof appointments>, appt) => {
            const day = format(new Date(appt.startAt), "EEE, MMM d");
            if (!acc[day]) acc[day] = [];
            acc[day].push(appt);
            return acc;
        }, {});
    }, [appointments]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                    Team Operations
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{today} · {user?.firstName}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#2d2d2d] text-white border-none">
                    <div className="mb-4 p-2 bg-white/10 w-fit rounded-xl"><Activity className="w-5 h-5 text-[#FFBF00]" /></div>
                    <div className="text-3xl font-bold">{instances.length}</div>
                    <div className="text-xs opacity-60 uppercase tracking-wider mt-1">Total Ops</div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-blue-50 w-fit rounded-xl"><Activity className="w-5 h-5 text-blue-500" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]">{activeCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Active</div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-amber-50 w-fit rounded-xl"><BarChart2 className="w-5 h-5 text-amber-500" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]">{pendingCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Pending Closure</div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-emerald-50 w-fit rounded-xl"><Users className="w-5 h-5 text-emerald-500" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]">{closedCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Closed</div>
                </GlassCard>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Breakdown */}
                        <GlassCard className="p-6">
                            <h3 className="text-base font-bold text-[#1A1A1A] mb-5 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-[#FFBF00]" />
                                Status Breakdown
                            </h3>
                            {statusDistribution.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">No operations yet</div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="h-[160px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusDistribution}
                                                    innerRadius={45}
                                                    outerRadius={70}
                                                    dataKey="value"
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    paddingAngle={3}
                                                    cornerRadius={4}
                                                    stroke="none"
                                                >
                                                    {statusDistribution.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: any, name: any) => [value, name]}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-full space-y-2 mt-3">
                                        {statusDistribution.map((s, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                                    <span className="text-muted-foreground">{s.name}</span>
                                                </div>
                                                <span className="font-bold text-[#1A1A1A]">{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </GlassCard>

                        {/* Team Workload */}
                        <GlassCard className="p-6">
                            <h3 className="text-base font-bold text-[#1A1A1A] mb-5 flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#FFBF00]" />
                                Team Workload
                            </h3>
                            {teamWorkload.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">No assignments yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {teamWorkload.map((member, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-sm font-semibold text-[#1A1A1A] truncate">{member.name}</span>
                                                <span className="text-xs text-muted-foreground shrink-0 ml-2">{member.completed}/{member.total}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#FFBF00] rounded-full transition-all"
                                                    style={{ width: member.total > 0 ? `${(member.completed / member.total) * 100}%` : "0%" }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {/* Team Agenda */}
                    <GlassCard className="p-0">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#FFBF00]" />
                                This Week's Agenda
                            </h3>
                        </div>
                        <div className="p-4 space-y-4 max-h-[340px] overflow-y-auto">
                            {Object.keys(weekDays).length === 0 ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">No appointments this week</div>
                            ) : Object.entries(weekDays).slice(0, 5).map(([day, appts]) => (
                                <div key={day}>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">{day}</div>
                                    {appts.map(appt => (
                                        <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div className="text-xs font-bold text-[#FFBF00] w-12 shrink-0">
                                                {format(new Date(appt.startAt), "HH:mm")}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[#1A1A1A] truncate">{appt.name}</div>
                                            </div>
                                            {appt.users?.length > 0 && (
                                                <div className="text-[10px] text-muted-foreground shrink-0">
                                                    {appt.users.length} attendee{appt.users.length !== 1 ? "s" : ""}
                                                </div>
                                            )}
                                        </div>
                                    ))}
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
                            {notifications.length > 0 && (
                                <div className="px-2 py-0.5 rounded-lg bg-[#FFBF00] text-white text-[10px] font-bold">{notifications.length}</div>
                            )}
                        </div>
                        <div className="p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">All caught up!</div>
                            ) : notifications.map((n: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                        {n.type?.replace(/_/g, ' ')}
                                    </div>
                                    {n.title && <div className="text-sm font-bold text-[#1A1A1A] mb-0.5">{n.title}</div>}
                                    {n.message && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
