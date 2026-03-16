import {
    useEffect,
    type ReactElement
} from "react";
import { 
  Plus, 
  Briefcase, 
  Building2,
  ArrowRight,
  TrendingUp,
  Wallet
} from "lucide-react";
import {
    useNavigate
} from "react-router-dom";
import {
    Status,
    type DivisionBasic
} from "@l-ark/types";
import {
    useDivision
} from "../../server/hooks/useDivision";
import {
    Badge
} from "../../shared/components/badge";
import { useTranslation } from "react-i18next";

const DivisionsManagement = (): ReactElement => {
    /** Navigate utilities */
    const navigate = useNavigate();
    /** Division api utilities */
    const { divisions, retrieveDivisions } = useDivision();
    const { t } = useTranslation();

    useEffect(() => {
        retrieveDivisions();
    }, []);

    /** Manage to sort the divisions by ids */
    const getDivisionsSorted = (): DivisionBasic[] => [...divisions].sort((a: DivisionBasic, b: DivisionBasic) => a.id - b.id);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-[Lato-Bold] tracking-tight text-[#1A1A1A] flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-[#D4AF37]" />
                        { t('divisions.title') }
                    </h2>
                    <p className="font-[Lato-Regular] text-muted-foreground mt-2 max-w-2xl text-sm">
                        { t('divisions.subtitle') }
                    </p>
                </div>
            </div>

            {/* Grid Layout - 2 Columns for Richer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 'Add New' Card */}
                <button onClick={() => navigate('/divisions/detail')} className="group relative bg-gray-50/30 rounded-4xl border-2 border-dashed border-gray-200 hover:border-primary-foreground/50 hover:bg-[#D4AF37]/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 min-h-75">
                    <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all duration-300">
                        <Plus className="h-8 w-8" />
                    </div>
                    <span className="font-[Lato-Bold] text-gray-400 group-hover:text-primary-foreground transition-colors">{ t('divisions.create-new') }</span>
                </button>

                { getDivisionsSorted().map((division) => (
                    <div key={division.id} onClick={() => navigate(`/divisions/detail/${division.id}`)}
                        className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                    >
                        {/* Top Colored Bar */}
                        <div className={`h-1.5 w-full ${'red'}`} />
                        <div className="p-8 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className='h-12 w-12 rounded-2xl flex items-center justify-center bg-primary/5'>
                                        <Briefcase className='w-6 h-6 text-primary' />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-xl font-[Lato-Bold] text-[#1A1A1A] group-hover:text-primary-foreground transition-colors"> { division.name } </h3>
                                        <Badge variant="secondary" className={`${division.status === Status.ACTIVE ? 'bg-emerald-50! text-emerald-600! border-emerald-100!' : 'bg-slate-100! text-slate-500! border-slate-200!'}`}>
                                            { division.status === Status.ACTIVE ? t('common.active') : t('common.inactive') }
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm font-[Lato-Regular] text-gray-500 mb-8 leading-relaxed line-clamp-2">
                                { division.description }
                            </p>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-[10px] uppercase font-[Lato-Bold] text-muted-foreground mb-1"> { t('divisions.offices') } </p>
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm font-[Lato-Bold] text-[#1A1A1A]"> { 3 } </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-[Lato-Bold] text-muted-foreground mb-1">{ t('divisions.revenue') }</p>
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-sm font-[Lato-Bold] text-[#1A1A1A]">{ 2.54 } M €</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-[Lato-Bold] text-muted-foreground mb-1"> { t('divisions.growth') } </p>
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-sm font-[Lato-Bold] text-[#1A1A1A]"> { 0 } </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-end">
                                <div className="h-8 w-8 rounded-full bg-transparent flex items-center justify-center text-muted-foreground group-hover:bg-[#1A1A1A] group-hover:text-primary-foreground transition-all duration-300">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DivisionsManagement;