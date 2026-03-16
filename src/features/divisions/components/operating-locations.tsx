import {
    useState,
    type ReactElement
} from 'react';
import {
    Status,
    type DivisionDetail,
    type UserDetail
} from '@l-ark/types';
import {
    useNavigate
} from 'react-router-dom';
import {
    Building2,
    Edit2
} from 'lucide-react';
import {
    Badge
} from '../../../shared/components/badge';
import AssignOffice from '../../user/components/assign-office';
import Button from '../../../shared/components/button';
import { useTranslation } from 'react-i18next';

interface PropTypes {
    division?: DivisionDetail;
    user?: UserDetail;
}

const OperatingLocations = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { division, user } = props;
    /** State to manage the assign office modal displayment */
    const [assignOfficeModal, setAssignOfficeModal] = useState<any>(null);
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Translation utilities */
    const { t } = useTranslation();

    /** Manage to return the offices ordered by active and the by alphabetically by name */
    const getOffices = () => [...((division ?? user)?.offices ?? [])].sort((a,b) => a.status === Status.ACTIVE ? -1 : b.status === Status.ACTIVE ? 1 : a.office.name.localeCompare(b.office.name));

    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="font-[Lato-Bold] text-lg"> { t('divisions.operation-locations') } </h3>
                <AssignOffice
                    assignment={assignOfficeModal}
                    idDivision={division?.id}
                    idUser={user?.id}
                    autor={{ type: division ? t('divisions.division') : t('users.user'), description: division ? division.name : `${user?.firstName} ${user?.lastName}` }}
                    open={!!assignOfficeModal}
                    setOpen={setAssignOfficeModal}
                />
            </div>

            { getOffices().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    { getOffices().map((office) => (
                        <div key={office.id} className="p-5 rounded-2xl border border-border/60 bg-slate-50/50 hover:bg-white hover:border-border transition-all flex flex-col justify-between h-auto relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary relative shrink-0">
                                        <Building2 className="h-5 w-5" />
                                        <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${office.status === Status.ACTIVE ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    </div>
                                    <div className="w-full flex flex-col">
                                        <button
                                            onClick={() => navigate(`/offices/detail/${office.office.id}`)}
                                            className="font-[Lato-Bold] text-foreground hover:underline text-left"
                                        >
                                            { office.office.name }
                                        </button>
                                        <span className="text-xs text-muted-foreground capitalize"> { office.office.address } </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5 pt-5">
                                    <Button variant='icon' onClick={() => setAssignOfficeModal(office)}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            { division &&
                                <div className="flex items-center justify-between relative z-10 mt-5">
                                    <div>
                                        <button
                                            onClick={() => navigate(`/users/detail/${(office as any).manager.id}`)}
                                            className="text-xs font-[Lato-Bold] text-foreground hover:underline text-left"
                                        >
                                            { (office as any).manager.firstName } { (office as any).manager.lastName }
                                        </button>
                                        <p className="font-[Lato-Regular] text-xs text-muted-foreground"> { (office as any).manager.role.name } </p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] h-5 bg-white shadow-sm border-border/50"> { (office as any).office.users.length } { t('labels.staff') } </Badge>
                                </div>
                            }
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-slate-50/50">
                    <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    <div className="text-center">
                        <p className="text-sm font-[Lato-Bold] text-muted-foreground"> { t('divisions.no-offices-assigned') } </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5"> { t('divisions.no-offices-assigned-description') } </p>
                    </div>
                </div>
            )}
        </>
    );
}

export default OperatingLocations;
