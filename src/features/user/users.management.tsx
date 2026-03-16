import {
    useEffect,
    type ReactElement
} from "react";
import { 
    Plus, 
    Building2, 
    ArrowRight,
    Users
} from "lucide-react";
import {
    useNavigate
} from "react-router-dom";
import {
    Badge
} from "../../shared/components/badge";
import {
    Avatar,
    AvatarFallback
} from "../../shared/components/avatar";
import {
    getShortNameUser
} from "../../shared/utils/user.utils";
import {
    useUser
} from "../../server/hooks/useUser";
import {
    UserStatus,
    type UserBasic
} from '@l-ark/types';
import {
    useTranslation
} from "react-i18next";

const UsersManagement = (): ReactElement => {
    /** Navigation utilities */
    const navigate = useNavigate();
    /** User api utilities */
    const { users, retrieveUsers } = useUser();
    const { t } = useTranslation();

    useEffect(() => {
      retrieveUsers();
    }, []);

    /** Manage to sort the users by ids */
    const getUsersSorted = (): UserBasic[] => [...users].sort((a: UserBasic, b: UserBasic) => a.id - b.id);

    
    return (
        <div className="w-full space-y-6">
            <div className="w-full flex justify-between">
                <div>
                    <h2 className="text-3xl font-[Lato-Bold] tracking-tight text-[#1A1A1A] flex items-center gap-3">
                        <Users className="w-8 h-8 text-[#D4AF37]" />
                        { t('users.title') }
                    </h2>
                    <p className="font-[Lato-Regular] text-muted-foreground mt-2 max-w-2xl text-sm">
                        { t('users.subtitle') }
                    </p>
                </div>
            </div>

            {/* Grid Layout for Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {/* Add New Card Placeholder - Moved to Beginning */}
                <button onClick={() => navigate('/users/detail')} className="group relative bg-gray-50/30 rounded-4xl border-2 border-dashed border-gray-200 hover:border-primary-foreground/50 hover:bg-[#D4AF37]/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 min-h-75">
                    <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all duration-300">
                        <Plus className="h-8 w-8" />
                    </div>
                    <span className="font-[Lato-Bold] text-gray-400 group-hover:text-primary-foreground transition-colors">{ t('users.add-new') }</span>
                </button>

                { getUsersSorted().map((user) => (
                    <div key={user.id} onClick={() => navigate(`/users/detail/${user.id}`)}
                        className="group relative bg-white rounded-3xl p-6 border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-border transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#FFBF00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`text-md! h-6 px-2.5 rounded-full font-[Lato-Regular] tracking-wide ${user.status === UserStatus.ACTIVE ? 'bg-emerald-50! text-emerald-600!' : 'bg-slate-100! text-slate-500!'}`}>
                                    { user.status === UserStatus.ACTIVE ? t('common.active') : t('common.inactive') }
                                </Badge>
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative mb-4">
                                <Avatar className="h-20 w-20 border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                                    <AvatarFallback  className='font-[Lato-Bold] text-xl'>{ getShortNameUser(user.firstName, user.lastName) }</AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-4 border-white ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500' : 'bg-slate-500'}` } />
                            </div>
                            <h3 className="text-lg font-[LAto-Bold] text-foreground mb-1 group-hover:text-primary transition-colors"> { user.firstName } { user.lastName } </h3>
                            <p className="text-sm text-muted-foreground font-[Lato-Regular] mb-1"> { user.role.name } </p>
                            <p className="text-xs text-muted-foreground/90"> { user.email } </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex flex-col items-start">
                                <span className="text-xs uppercase tracking-wider text-muted-foreground font-[Lato-Bold]"> { t('users.office') } </span>
                                <div className="flex items-center gap-1.5 mt-1 text-sm font-[Lato-Regular] text-foreground">
                                    <Building2 className="h-3.5 w-3.5 text-[#FFBF00]" />
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-[#FFBF00] transition-colors">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UsersManagement;