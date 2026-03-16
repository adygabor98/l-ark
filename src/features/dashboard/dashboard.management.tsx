import { useState, useMemo, type ReactElement } from "react";
import { 
  Activity, Users, Building, ShieldCheck, FileKey, Zap, Filter, AlertCircle, 
  Calendar, Clock, MapPin, Plus, FileText, ChevronRight, TrendingUp, 
  MoreHorizontal, CheckCircle2, AlertTriangle, Search, Bell, Menu, Home, Shield,
  ArrowRightLeft, Briefcase, GraduationCap, LayoutGrid, List
} from "lucide-react";
import { 
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, 
   Cell, ComposedChart, PieChart, Pie
} from "recharts";
import { format, addHours, startOfToday, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/select";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/components/avatar";

// --- Color Palette (Luxury Enterprise) ---
const COLORS = {
  gold: "#D4AF37", // Metallic Gold
  goldLight: "#F3E5AB", 
  charcoal: "#1A1A1A",
  grey: "#F3F4F6",
  white: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

// --- Mock Data ---

const pipelineData = [
  { stage: "Leads", count: 142, value: "€4.2M", status: "healthy" },
  { stage: "Docs", count: 86, value: "€2.8M", status: "healthy" },
  { stage: "Verify", count: 45, value: "€1.5M", status: "warning" },
  { stage: "Notary", count: 28, value: "€950k", status: "healthy" },
  { stage: "Closed", count: 12, value: "€420k", status: "healthy" },
];

const officeRankingData = [
  { name: "Barcelona", value: 45, target: 40, growth: 12 },
  { name: "Madrid", value: 38, target: 45, growth: -5 },
  { name: "Valencia", value: 24, target: 20, growth: 8 },
  { name: "Seville", value: 18, target: 15, growth: 15 },
  { name: "Bilbao", value: 12, target: 15, growth: -2 },
].sort((a, b) => b.value - a.value);

const revenueTrendData = [
  { day: "Mon", value: 12000 },
  { day: "Tue", value: 18000 },
  { day: "Wed", value: 15000 },
  { day: "Thu", value: 22000 },
  { day: "Fri", value: 28000 },
  { day: "Sat", value: 24000 },
  { day: "Sun", value: 32000 },
];

const talentData = [
  { role: "Agents", count: 42, active: 38 },
  { role: "Ops", count: 18, active: 18 },
  { role: "Legal", count: 8, active: 6 },
  { role: "Admin", count: 12, active: 10 },
];

const employeePerformanceData = [
  { name: "Sofia Lopez", role: "Snr Agent", opened: 15, closed: 8, avatar: "SL" },
  { name: "Marc Guasch", role: "Agent", opened: 12, closed: 4, avatar: "MG" },
  { name: "Ana Torres", role: "Ops", opened: 8, closed: 6, avatar: "AT" },
  { name: "David Vila", role: "Agent", opened: 6, closed: 2, avatar: "DV" },
];

const comparisonData = Array.from({ length: 12 }, (_, i) => ({
  month: format(subDays(new Date(), (11 - i) * 30), "MMM"),
  officeA_ops: Math.floor(Math.random() * 50) + 20,
  officeA_rev: Math.floor(Math.random() * 50000) + 20000,
  officeB_ops: Math.floor(Math.random() * 40) + 15,
  officeB_rev: Math.floor(Math.random() * 45000) + 15000,
}));

const myAgendaData = [
  { title: "Client Meeting: Sofia L.", time: "10:00 AM", type: "Visit", location: "C/ Balmes 122", status: "upcoming" },
  { title: "Notary Signing: Op #229", time: "12:30 PM", type: "Signing", location: "Notaría García", status: "next" },
  { title: "Team Sync", time: "04:00 PM", type: "Internal", location: "Meeting Room A", status: "upcoming" },
];

const notificationsData = [
  { title: "Request OTP", desc: "View document for Client X", urgent: true },
  { title: "Follow up", desc: "Vivienda Potencial VF-001", urgent: false },
  { title: "Missing Doc", desc: "ID Card for Op #992", urgent: true },
];

const performanceData = [
  { name: 'Progress', value: 75, fill: '#D4AF37' },
  { name: 'Remaining', value: 25, fill: '#E5E7EB' },
];

// --- Shared Components ---

const GlassCard = ({ children, className, ...props }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl overflow-hidden ${className}`}
        {...props}
    >
        {children}
    </motion.div>
);

const NavPill = ({ viewMode, setViewMode }: any) => (
    <div className="flex p-1 bg-white/50 backdrop-blur-md rounded-full border border-white/50 shadow-sm relative w-full md:w-auto overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent rounded-full pointer-events-none" />
        <button
            onClick={() => setViewMode("admin")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 relative z-10
                ${viewMode === "admin" ? "bg-[#1A1A1A] text-[#D4AF37] shadow-lg" : "text-muted-foreground hover:text-[#1A1A1A]"}
            `}
        >
         Strategic
        </button>
        <button
            onClick={() => setViewMode("employee")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 relative z-10
                ${viewMode === "employee" ? "bg-[#1A1A1A] text-[#D4AF37] shadow-lg" : "text-muted-foreground hover:text-[#1A1A1A]"}
            `}
        >
            Operational
        </button>
    </div>
);

// --- Admin Components ---

const StatCard = ({ title, value, trend, icon: Icon, dark = false }: any) => (
    <GlassCard className={`flex flex-col justify-between p-6 h-40 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        ${dark ? "bg-[#1A1A1A] border-[#1A1A1A] text-white" : "bg-white"}
    `}>
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 ${dark ? "bg-[#D4AF37]" : "bg-[#1A1A1A]"}`} />
        
        <div className="flex justify-between items-start z-10">
            <div className={`p-2.5 rounded-2xl transition-colors ${dark ? "bg-white/10 text-[#D4AF37]" : "bg-[#F3F4F6] text-[#1A1A1A]"}`}>
                <Icon className="w-5 h-5" />
            </div>
            { trend &&
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${trend > 0 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"}
                `}>
                    {trend > 0 ? "+" : ""}{trend}%
                </div>
            }
        </div>
        
        <div className="z-10">
            <h3 className={`text-3xl font-bold tracking-tight mb-1 ${dark ? "text-white" : "text-[#1A1A1A]"}`}>{value}</h3>
            <p className={`text-xs font-medium uppercase tracking-wider opacity-60 ${dark ? "text-white" : "text-[#1A1A1A]"}`}>{title}</p>
        </div>
    </GlassCard>
);

const GlobalFlowWidget = () => (
    <GlassCard className="p-0">
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-linear-to-r from-white/50 to-transparent gap-4">
            <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#D4AF37]" />
                    Global Flow
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time transaction pipeline</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live System
            </div>
        </div>
        <div className="p-6 md:p-8 overflow-x-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative min-w-[600px] md:min-w-0">
                <div className="hidden md:block absolute top-7 left-[5%] w-[90%] h-0.5 bg-linear-to-r from-transparent via-gray-200 to-transparent -z-10" />
                
                { pipelineData.map((stage) => (
                    <div key={stage.stage} className="flex flex-row md:flex-col items-center group cursor-pointer w-full md:w-auto gap-4 md:gap-0 bg-white/50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border md:border-none border-white/50">
                        <div className={
                            `w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-0 md:mb-4 transition-all duration-300 shadow-sm border-2 relative z-10 shrink-0
                            ${stage.status === "warning" 
                                ? "bg-white border-rose-100 text-rose-500 shadow-rose-100" 
                                : "bg-white border-gray-100 text-[#1A1A1A] group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]"}
                        `}>
                            <span className="text-lg font-bold">{stage.count}</span>
                            {stage.status === "warning" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </div>
                        <div className="text-left md:text-center flex-1">
                            <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">{stage.stage}</div>
                            <div className="text-[10px] text-muted-foreground font-medium bg-gray-50 px-2 py-0.5 rounded-full inline-block">
                                {stage.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </GlassCard>
);

const OfficeComparisonWidget = () => {
    const [officeA, setOfficeA] = useState("Barcelona");
    const [officeB, setOfficeB] = useState("Madrid");

    return (
        <GlassCard className="col-span-12 lg:col-span-8 p-6 flex flex-col h-full min-h-[400px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-[#D4AF37]" />
                        Performance Benchmark
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Comparative analysis of regional hubs</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100 w-full md:w-auto">
                    <Select value={officeA} onValueChange={setOfficeA}>
                        <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-none shadow-sm rounded-lg font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Barcelona">Barcelona</SelectItem><SelectItem value="Valencia">Valencia</SelectItem></SelectContent>
                    </Select>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">vs</span>
                    <Select value={officeB} onValueChange={setOfficeB}>
                        <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-none shadow-sm rounded-lg font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Madrid">Madrid</SelectItem><SelectItem value="Seville">Seville</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={comparisonData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="colorOpsA" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOpsB" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val/1000}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#1A1A1A', marginBottom: '8px' }}
                            cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="officeA_rev" stroke="#D4AF37" fill="url(#colorOpsA)" strokeWidth={3} />
                        <Area yAxisId="left" type="monotone" dataKey="officeB_rev" stroke="#1A1A1A" fill="url(#colorOpsB)" strokeWidth={3} strokeDasharray="4 4" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};

const OfficeLeaderboard = () => (
    <GlassCard className="col-span-12 lg:col-span-4 p-6 h-full flex flex-col min-h-[400px]">
        <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#D4AF37]" />
                Top Offices
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Monthly closing targets</p>
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-5">
            {officeRankingData.map((office, idx) => (
                <div key={office.name} className="group cursor-pointer">
                    <div className="flex justify-between items-end mb-2">
                        <span className={`text-sm font-bold group-hover:text-[#D4AF37] transition-colors ${idx === 0 ? "text-[#1A1A1A]" : "text-muted-foreground"}`}>
                            {idx + 1}. {office.name}
                        </span>
                        <div className="text-right">
                            <span className="text-xs font-bold text-[#1A1A1A]">{office.value}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">/ {office.target}</span>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
                        <div className={`h-full rounded-full relative z-10 ${idx === 0 ? "bg-[#D4AF37]" : "bg-[#1A1A1A]"}`} />
                        {/* Target Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-0" style={{ left: `${(office.target / 60) * 100}%` }}  />
                    </div>
                </div>
            ))}
        </div>
    </GlassCard>
);

const TalentWidget = () => (
    <GlassCard className="col-span-12 lg:col-span-4 p-6 h-full">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                Talent Pulse
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Operations per top performer</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <Users className="w-5 h-5" />
            </div>
        </div>
        <div className="space-y-5">
            {/* Header Row */}
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-gray-100 pb-2">
                <span>Employee</span>
                <div className="flex gap-4">
                    <span className="w-12 text-right text-[#D4AF37]">Opened</span>
                    <span className="w-12 text-right text-[#1A1A1A]">Closed</span>
                </div>
            </div>

            {employeePerformanceData.map((emp, i) => (
                <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-[#1A1A1A] text-[#D4AF37] text-xs font-bold"> {emp.avatar} </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors">{emp.name}</div>
                            <div className="text-[10px] text-muted-foreground">{emp.role}</div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 text-right">
                            <span className="text-sm font-bold text-[#D4AF37]">{emp.opened}</span>
                        </div>
                        <div className="w-12 text-right">
                            <span className="text-sm font-bold text-[#1A1A1A]">{emp.closed}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </GlassCard>
);

// --- Employee Components ---

const TaskInbox = () => (
    <GlassCard className="p-0 h-full">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#D4AF37]" />
                Priority Inbox
            </h3>
            <div className="px-2 py-1 rounded-lg bg-[#D4AF37] text-white text-[10px] font-bold">3 New</div>
        </div>
        <div className="p-4 space-y-3">
            {notificationsData.map((note, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer group hover:shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${note.urgent ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                            {note.urgent ? "Urgent" : "Update"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">2m ago</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-1 group-hover:text-[#D4AF37] transition-colors">{note.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{note.desc}</p>
                </div>
            ))}
        </div>
    </GlassCard>
);

const AgendaTimeline = () => (
    <GlassCard className="p-6 h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
            <Calendar className="w-32 h-32 text-[#1A1A1A]" />
        </div>
        <div className="relative z-10">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Today's Agenda</h3>
            <div className="space-y-6 relative pl-4">
                <div className="absolute top-2 left-[7px] bottom-2 w-0.5 bg-gray-200" />
                
                {myAgendaData.map((item, idx) => (
                    <div key={idx} className="relative pl-6">
                        <div className={`absolute -left-1 top-1.5 w-3 h-3 rounded-full border-2 border-white ${item.status === "next" ? "bg-[#D4AF37] ring-4 ring-[#D4AF37]/20" : "bg-gray-300"}`} />
                        <div className={`p-4 rounded-2xl border transition-all
                            ${item.status === "next" 
                                ? "bg-white shadow-md border-[#D4AF37]/20" 
                                : "bg-transparent border-transparent opacity-60 hover:opacity-100"}
                        `}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide">{item.time}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{item.type}</span>
                            </div>
                            <h4 className="text-sm font-bold text-[#1A1A1A]">{item.title}</h4>
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </GlassCard>
);

// --- Main Layout ---

const DashboardManagement = (): ReactElement => {
    const [viewMode, setViewMode] = useState<"admin" | "employee">("admin");
    const today = format(new Date(), "EEEE, MMM do");

    return (
        <div className="min-h-screen w-full bg-[#F5F6F8] text-[#1A1A1A] font-sans selection:bg-[#D4AF37]/30">
            {/* Background Texture */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
            
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 px-4 md:px-6 py-4 glass-panel border-b border-white/40">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center shadow-xl shadow-[#1A1A1A]/20">
                        <span className="text-[#D4AF37] font-bold text-xl">A</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight leading-none">Arkline</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Enterprise Workspace</p>
                    </div>
                    </div>
                    
                    {/* Mobile View Toggle - Only visible on mobile */}
                    <div className="md:hidden">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    </div>
                </div>

                <NavPill viewMode={viewMode} setViewMode={setViewMode} />

                <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                    <div className="text-xs font-bold text-[#1A1A1A]">{today}</div>
                    <div className="text-[10px] text-muted-foreground">Barcelona HQ</div>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 md:p-10 relative z-10 space-y-8 pb-24 md:pb-10">
                
                <AnimatePresence mode="wait">
                {viewMode === "admin" ? (
                    <motion.div 
                    key="admin"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-8"
                    >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Revenue" value="€842.5k" trend={12} icon={Briefcase} dark />
                        <StatCard title="Active Operations" value="142" trend={5} icon={Activity} />
                        <StatCard title="Security Incidents" value="0" trend={0} icon={ShieldCheck} />
                        <StatCard title="Team Performance" value="94%" trend={2} icon={Users} />
                    </div>

                    <GlobalFlowWidget />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[400px]">
                        <OfficeComparisonWidget />
                        <OfficeLeaderboard />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                        <GlassCard className="p-8 h-full min-h-[300px]">
                            <div className="mb-6">
                            <h3 className="text-lg font-bold text-[#1A1A1A]">Revenue Trajectory</h3>
                            <p className="text-xs text-muted-foreground">Projected vs Actual Growth</p>
                            </div>
                            <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrendData}>
                                <defs>
                                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="value" stroke="#1A1A1A" strokeWidth={3} fill="url(#colorMain)" />
                                </AreaChart>
                            </ResponsiveContainer>
                            </div>
                        </GlassCard>
                        </div>
                        <div className="lg:col-span-4">
                        <TalentWidget />
                        </div>
                    </div>

                    </motion.div>
                ) : (
                    <motion.div 
                    key="employee"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                            Good Morning, <span className="text-muted-foreground">Alex</span>
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button className="flex-1 md:flex-none rounded-full bg-[#1A1A1A] text-[#D4AF37] hover:bg-[#1A1A1A]/90 h-10 px-6 shadow-lg shadow-[#1A1A1A]/20">
                                <Plus className="w-4 h-4 mr-2" /> New Lead
                            </button>
                            <button className="rounded-full h-10 w-10 p-0 border-gray-200 bg-white shrink-0">
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassCard className="p-6 bg-gradient-to-br from-[#1A1A1A] to-[#2d2d2d] text-white border-none">
                            <div className="mb-4 p-2 bg-white/10 w-fit rounded-xl"><Filter className="w-5 h-5 text-[#D4AF37]" /></div>
                            <div className="text-3xl font-bold">24</div>
                            <div className="text-xs opacity-60 uppercase tracking-wider mt-1">Active Leads</div>
                            </GlassCard>
                            <GlassCard className="p-6">
                            <div className="mb-4 p-2 bg-gray-100 w-fit rounded-xl text-[#1A1A1A]"><CheckCircle2 className="w-5 h-5" /></div>
                            <div className="text-3xl font-bold text-[#1A1A1A]">8</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Closings This Mo.</div>
                            </GlassCard>
                            <GlassCard className="p-6">
                            <div className="mb-4 p-2 bg-[#D4AF37]/10 w-fit rounded-xl text-[#D4AF37]"><Zap className="w-5 h-5" /></div>
                            <div className="text-3xl font-bold text-[#1A1A1A]">94%</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Conversion Rate</div>
                            </GlassCard>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[400px]">
                            <AgendaTimeline />
                            <GlassCard className="p-6 flex flex-col items-center justify-center text-center h-[300px] md:h-auto">
                                <h3 className="text-lg font-bold mb-6">Monthly Goal</h3>
                                <div className="w-[200px] h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                    <Pie
                                        data={performanceData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={40}
                                        paddingAngle={5}
                                    >
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-[#1A1A1A]">75%</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Completed</span>
                                </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    <div className="lg:col-span-4 h-full">
                        <TaskInbox />
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>

            </div>
        </div>
    );
}

export default DashboardManagement;