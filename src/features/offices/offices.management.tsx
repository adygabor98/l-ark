import {
    useEffect,
    type ReactElement
} from "react";
import {
  Plus,
  Building2,
  MapPin,
  Users,
  ArrowRight,
  Globe,
  Users2,
  UserX
} from "lucide-react";
import {
    useNavigate
} from "react-router-dom";
import {
    Badge
} from "../../shared/components/badge";

import {
    useOffice
} from "../../server/hooks/useOffice";
import {
    Status,
    type OfficeBasic
} from "@l-ark/types";
import Button from "../../shared/components/button";
import { useTranslation } from "react-i18next";

const OfficesManagement = (): ReactElement => {
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Office api utilities */
    const { offices, retrieveOffices } = useOffice();
    const { t } = useTranslation();

    useEffect(() => {
        retrieveOffices();
    }, []);

    /** Manage to count the unique employees we have across offices */
    const getUniqueTotalPersonnel = (): number => [...new Set([...offices.map(x => x.users.map(y => y.id)).flat()])].length;

    /** MAnage to count the unique cities of the offices */
    const getUniqueTotalCities = (): number => [...new Set([...offices.map(x => x.city)])].length;
    
    /** Manage to sort the offices by ids */
    const getOfficesSorted = (): OfficeBasic[] => [...offices].sort((a: OfficeBasic, b: OfficeBasic) => a.id - b.id);
    
    /** Manage to sort the offices by ids */
    const getActiveOffices = (): number => offices.filter(office => office.status === Status.ACTIVE).length;


    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-[Lato-Bold] tracking-tight text-[#1A1A1A] flex items-center gap-3">
                        <Globe className="w-8 h-8 text-[#D4AF37]" />
                        { t('offices.title') }
                    </h2>
                    <p className="font-[Lato-Regular] text-muted-foreground mt-2 max-w-2xl text-sm">
                        { t('offices.subtitle') }
                    </p>
                </div>
                <Button variant="primary" onClick={() => navigate('/offices/detail')}>
                    <Plus className="w-4 h-4 mr-2" /> { t('offices.add') }
                </Button>

            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: t('offices.total-actives'), value: getActiveOffices(), icon: Building2 },
                    { label: t('offices.locations'), value: getUniqueTotalCities(), icon: MapPin },
                    { label: t('offices.total-personnel'), value: getUniqueTotalPersonnel(), icon: Users2 },
                    { label: t('offices.without-staff'), value: offices.filter(x => x.users.length === 0).length, icon: UserX },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-[Lato-Regular] uppercase tracking-wider">{stat.label}</p>
                            <h4 className="text-2xl font-[Lato-Bold] text-[#1A1A1A] mt-1"> { stat.value } </h4>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-primary-foreground">
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                )) }
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-4">
                { getOfficesSorted().map((office: OfficeBasic) => (
                    <div key={office.id} onClick={() => navigate(`/offices/detail/${office.id}`)}
                        className="group relative bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-foreground/30 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                            {/* Identity Section */}
                            <div className="flex items-start gap-6 flex-1 min-w-75">
                                <span className='w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-lg font-[Lato-Bold] shrink-0'> { office.code } </span>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-[Lato-Bold] text-[#1A1A1A] group-hover:text-primary-foreground transition-colors">{office.name}</h3>
                                        <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-[Lato-Bold] tracking-wide border-0 ${ office.status === Status.ACTIVE ? "bg-emerald-100! text-emerald-700!" : "bg-orange-100! text-orange-700!"}`}>
                                            { office.status === Status.ACTIVE ? t('common.active') : t('common.inactive') }
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-[Lato-Regular]">
                                        <p className="text-xs text-gray-400 mt-1 capitalize"> { office.address } </p>
                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                        <span className="flex items-center gap-1 capitalize">
                                            <MapPin className="w-3 h-3" /> { office.city }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Section */}
                            <div className="flex flex-1 gap-8 md:gap-12 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8">
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-[Lato-Bold] uppercase mb-1"> { t('offices.manager') } </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-[Lato-Regular] text-[#1A1A1A]"> - </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-muted-foreground font-[Lato-Bold] uppercase mb-1"> { t('offices.employees') } </p>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-[Lato-Bold] text-[#1A1A1A]"> { office.users.length } </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                                <Button variant="ghost">
                                    { t('offices.view-office') } <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OfficesManagement;