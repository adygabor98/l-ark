import {
    useEffect,
    useMemo,
    type ReactElement
} from "react";
import {
    useTranslation
} from "react-i18next";
import {
    format
} from "date-fns";
import {
    motion
} from "framer-motion";
import {
    Activity,
    Calendar,
    Bell,
    Clock,
    ChevronRight
} from "lucide-react";
import {
    useOperationInstance
} from "../../../server/hooks/useOperationInstance";
import {
    useAgenda
} from "../../../server/hooks/useAgenda";
import {
    useNotification
} from "../../../server/hooks/useNotification";
import {
    OperationInstanceStatus
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

export const EmployeeDashboard = (): ReactElement => {
    /** Permissions utilities */
    const { user } = usePermissions();
    /** Translation utilities */
    const { t } = useTranslation();
    /** Operation instance api utilities */
    const { instances, retrieveInstances } = useOperationInstance();
    /** Agenda api utilities */
    const { appointments, retrieveAppointments } = useAgenda();
    /** Notification api utilities */
    const { notifications, retrieveNotifications } = useNotification();

    useEffect(() => {
        if ( user?.id ) {
            retrieveInstances({ assignedToId: user.id.toString() });
        }
        retrieveAppointments({ type: "WEEK" });
        retrieveNotifications({ unreadOnly: true, limit: 5 });
    }, [user?.id]);
    /** Status labels mapped from i18n keys */
    const statusLabels = useMemo<Record<string, { label: string; color: string }>>(() => ({
        DRAFT:            { label: t('workspace.status-draft'),            color: "bg-gray-100 text-gray-600" },
        ACTIVE:           { label: t('workspace.status-active'),           color: "bg-blue-100 text-blue-600" },
        COMPLETED_READY:  { label: t('workspace.status-ready-to-close'),   color: "bg-amber-100 text-amber-600" },
        LINKED:           { label: t('workspace.status-linked'),           color: "bg-purple-100 text-purple-600" },
        CLOSED:           { label: t('workspace.status-closed'),           color: "bg-green-100 text-green-600" },
        PENDING_PAYMENT:  { label: t('workspace.status-pending-payment'),  color: "bg-orange-100 text-orange-600" },
        PARTIALLY_CLOSED: { label: t('workspace.status-partially-closed'), color: "bg-emerald-100 text-emerald-600" },
    }), [t]);
    /** Memorize the activa instances */
    const activeInstances = useMemo(() => instances.filter(i => i.status !== OperationInstanceStatus.CLOSED), [instances]);
    /** Memorize the pending step count */
    const pendingStepsCount = useMemo(() => instances.reduce((total, inst) => total + (inst.stepInstances?.filter(s => s.status === "PENDING" || s.status === "IN_PROGRESS").length ?? 0), 0), [instances])
    /** Memorize the appointments today */
    const todayAppointments = useMemo(() => appointments.filter(a => format(new Date(a.startAt), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")), [appointments, format(new Date(), "yyyy-MM-dd")]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                    { t('labels.good-morning') }, <span className="text-[#FFBF00]"> { user?.firstName } </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1"> { format(new Date(), "EEEE, MMM do") } </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 bg-linear-to-br from-[#1A1A1A] to-[#2d2d2d] text-white border-none">
                    <div className="mb-4 p-2 bg-white/10 w-fit rounded-xl"><Activity className="w-5 h-5 text-[#FFBF00]" /></div>
                    <div className="text-3xl font-bold"> { activeInstances.length } </div>
                    <div className="text-xs opacity-60 uppercase tracking-wider mt-1"> { t('workspace.active-operations') } </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-amber-50 w-fit rounded-xl"><Clock className="w-5 h-5 text-amber-500" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]"> { pendingStepsCount } </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1"> { t('workspace.pending-steps') } </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <div className="mb-4 p-2 bg-[#FFBF00]/10 w-fit rounded-xl"><Calendar className="w-5 h-5 text-[#FFBF00]" /></div>
                    <div className="text-3xl font-bold text-[#1A1A1A]"> { todayAppointments.length } </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1"> { t('workspace.todays-meetings') } </div>
                </GlassCard>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {/* Operations List */}
                    <GlassCard className="p-0">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#FFBF00]" />
                                { t('workspace.my-operations') }
                            </h3>
                            <span className="text-xs text-muted-foreground"> { t('workspace.active-count', { count: activeInstances.length }) } </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            { activeInstances.length === 0 ?
                                <div className="p-8 text-center text-sm text-muted-foreground"> { t('workspace.no-active-operations') } </div>
                            : activeInstances.slice(0, 6).map(instance => {
                                const completed = instance.stepInstances?.filter(s => s.status === "COMPLETED").length ?? 0;
                                const total = instance.stepInstances?.length ?? 0;
                                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                                const statusInfo = statusLabels[instance.status] ?? { label: instance.status, color: "bg-gray-100 text-gray-600" };

                                return (
                                    <div key={instance.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-[#1A1A1A] truncate group-hover:text-[#FFBF00] transition-colors"> { instance.title } </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusInfo.color}`}> { statusInfo.label } </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span> { instance.blueprint?.title } </span>
                                                { instance.office && <span> · { instance.office.name } </span>}
                                            </div>
                                            { total > 0 &&
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#FFBF00] rounded-full transition-all" style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground shrink-0"> { completed } / { total } steps </span>
                                                </div>
                                            }
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-[#FFBF00]" />
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>

                    {/* Today's Agenda */}
                    <GlassCard className="p-6">
                        <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2 mb-5">
                            <Calendar className="w-4 h-4 text-[#FFBF00]" />
                            { t('workspace.todays-agenda') }
                        </h3>
                        { todayAppointments.length === 0 ?
                            <div className="py-4 text-center text-sm text-muted-foreground"> { t('workspace.no-appointments') } </div>
                        :
                            <div className="space-y-3">
                                { todayAppointments.map(appt => (
                                    <div key={appt.id} className="flex items-start gap-4 p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
                                        <div className="text-center shrink-0 w-14">
                                            <div className="text-xs font-bold text-[#FFBF00]"> { format(new Date(appt.startAt), "HH:mm") } </div>
                                            <div className="text-[10px] text-muted-foreground"> { format(new Date(appt.endAt), "HH:mm") } </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-[#1A1A1A] truncate"> { appt.name } </div>
                                            { appt.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1"> { appt.description } </div> }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </GlassCard>
                </div>

                {/* Notifications Sidebar */}
                <div className="lg:col-span-4">
                    <GlassCard className="p-0">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                                <Bell className="w-4 h-4 text-[#FFBF00]" />
                                { t('workspace.notifications') }
                            </h3>
                            { notifications.length > 0 &&
                                <div className="px-2 py-0.5 rounded-lg bg-[#FFBF00] text-white text-[10px] font-bold"> { notifications.length } </div>
                            }
                        </div>
                        <div className="p-4 space-y-3">
                            { notifications.length === 0 ?
                                <div className="py-8 text-center text-sm text-muted-foreground"> { t('workspace.all-caught-up') } </div>
                            : notifications.map((n, idx) => (
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
