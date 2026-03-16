import {
    useState,
    type ReactElement
} from 'react';
import {
    Avatar,
    AvatarFallback
} from '../../../shared/components/avatar';
import {
    Edit2,
    Shield
} from 'lucide-react';
import {
    getShortNameUser
} from '../../../shared/utils/user.utils';
import {
    useNavigate
} from 'react-router-dom';
import {
    Status,
    type OfficeDetail
} from '@l-ark/types';
import {
    useTranslation
} from 'react-i18next';
import AssignUser from './assign-user';
import Button from '../../../shared/components/button';

interface PropTypes {
    office: OfficeDetail;
}

const AssignedPersonnel = (props: PropTypes): ReactElement => {
    /** Office api utilities */
    const { office } = props;
    /** State to manage the assign personnel modal displayment */
    const [assignPersonnelModal, setAssignPersonnelModal] = useState<any>(null);
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Translation utilities */
    const { t } = useTranslation();

    /** Manage to return the users ordered by active and the by alphabetically by name */
    const getUsers = () => [...(office.users ?? [])].sort((a,b) => a.status === Status.ACTIVE ? -1 : b.status === Status.ACTIVE ? 1 : `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`));

    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="font-[Lato-Bold] text-lg"> { t('titles.assigned-peronnel') } </h3>
                <AssignUser
                    assignment={assignPersonnelModal}
                    idOffice={office.id}
                    autor={{ type: t('offices.office'), description: office.name }}
                    open={!!assignPersonnelModal}
                    setOpen={setAssignPersonnelModal}
                />
            </div>

            <div className="space-y-4">
                { getUsers().map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-slate-50/50 hover:bg-white hover:border-border transition-all group">
                        <div className="relative flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-white shadow-sm">
                                <AvatarFallback className="text-lg font-[Lato-Bold]">{ getShortNameUser(user.user.firstName, user.user.lastName) }</AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-1 left-7 h-5 w-5 rounded-full border-4 border-white ${user.status === Status.ACTIVE ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <div>
                                <a onClick={() => navigate(`/users/detail/${user.user.id}`)} className="font-[Lato-Bold] text-foreground text-sm hover:underline cursor-pointer"> { user.user.firstName } { user.user.lastName } </a>
                                <p className="text-xs font-[Lato-Regular] text-muted-foreground flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    { user.user.role.name }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground hidden sm:block"> { user.user.email } </span>
                                <span className="text-xs text-muted-foreground hidden sm:block"> { user.user.phone } </span>
                            </div>
                            <Button variant='icon' onClick={() => setAssignPersonnelModal(user)}>
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
                { (office.users ?? []).length === 0 &&
                    <div className="w-full h-48 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-slate-50/50">
                        <Shield className="h-10 w-10 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-sm font-[Lato-Bold] text-muted-foreground"> { t('offices.no-personnel-assigned') } </p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5"> { t('offices.assign-first-user')} </p>
                        </div>
                    </div>
                }
            </div>
        </>
    );
}

export default AssignedPersonnel;