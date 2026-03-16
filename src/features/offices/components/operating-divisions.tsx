import {
    useState,
    type ReactElement
} from 'react';
import {
    Status,
    type OfficeDetail
} from '@l-ark/types';
import {
    useNavigate
} from 'react-router-dom';
import {
    Briefcase,
    Edit2
} from 'lucide-react';
import AssignDivision from './assign-division';
import Button from '../../../shared/components/button';
import { useTranslation } from 'react-i18next';

interface PropTypes {
    office: OfficeDetail;
}

const OperatingDivisions = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { office } = props;
    /** State to manage the assign division modal displayment */
    const [assignDivisionModal, setAssignDivisionModal] = useState<any>(null);
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Translations utilities */
    const { t } = useTranslation();

    /** Manage to return the divisions ordered by active and the by alphabetically by name */
    const getDivisions = () => [...(office.divisions ?? [])].sort((a,b) => a.status === Status.ACTIVE ? -1 : b.status === Status.ACTIVE ? 1 : a.division.name.localeCompare(b.division.name));

    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="font-[Lato-Bold] text-lg"> { t('titles.operating-divisions') } </h3>
                <AssignDivision
                    open={!!assignDivisionModal}
                    assignment={assignDivisionModal}
                    idOffice={office.id}
                    autor={{ type: t('offices.office'), description: office.name }}
                    setOpen={setAssignDivisionModal}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                { getDivisions().map((division) => (
                    <div key={division.id} className="reltive p-5 rounded-2xl border border-border/60 bg-slate-50/50 hover:bg-white hover:border-border transition-all flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className={`absolute top-2 right-2  h-5 w-5 rounded-full border-4 border-white ${division.status === Status.ACTIVE ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
                        
                        <div className="flex items-start justify-between relative z-10">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <Button variant='icon' onClick={() => setAssignDivisionModal(division)}>
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        
                        <div className="relative z-10">
                            <a onClick={() => navigate(`/divisions/detail/${division.division.id}`)} className="font-[Lato-Bold] text-foreground hover:underline cursor-pointer"> { division.division.name } </a>
                            <div className="flex items-center justify-between mt-1">
                                <a onClick={() => navigate(`/users/detail/${division.manager.id}`)} className="flex gap-2 items-center text-xs font-[Lato-Regular] text-muted-foreground hover:underline cursor-pointer">
                                    { t('labels.head') }
                                    <span> { division.manager.firstName } { division.manager.lastName } </span>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
                { (office.divisions ?? []).length === 0 &&
                    <div className="w-full col-span-2 h-48 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-slate-50/50">
                        <Briefcase className="h-10 w-10 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-sm font-[Lato-Bold] text-muted-foreground"> { t('offices.no-divisions-assigned') } </p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5"> { t('offices.assign-division') } </p>
                        </div>
                    </div>
                }
            </div>
        </>
    );
}

export default OperatingDivisions;