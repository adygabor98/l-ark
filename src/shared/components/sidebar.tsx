import {
	type Dispatch,
    type ReactElement,
	type SetStateAction
} from 'react';
import {
	useLocation,
	useNavigate
} from 'react-router-dom';
import {
	ChevronLeft,
	LogOut,
	Settings,
	Shield
} from 'lucide-react';
import type {
	NavItem
} from '../models/nav.model';
import {
	Avatar,
	AvatarFallback
} from './avatar';
import {
	useUser
} from '../../server/hooks/useUser';
import {
	useDispatch
} from 'react-redux';
import {
	removeUser
} from '../../store/actions/user.actions';
import {
	useTranslation
} from 'react-i18next';
import {
	getShortNameUser
} from '../utils/user.utils';
import Logo from '../../../public/logo.png'

interface PropTypes {
	isMobileMenuOpen: boolean;
	navItems: NavItem[];
	setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, navItems}: PropTypes): ReactElement => {
	/** Location utilities */
	const location = useLocation();
	/** Navigation utilities */
	const navigate = useNavigate();
	/** User api utilities */
	const { logout } = useUser();
	/** Redux utilities */
	const dispatch = useDispatch();
	/** Translation utilities */
	const { t } = useTranslation();

	/** Manage to logout the current user from the app */
    const handleLogout = async (): Promise<void> => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(removeUser());
            navigate('/');
        }
    }

    return (
        <aside className={`hidden md:flex bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) relative z-20 ${isMobileMenuOpen ? "w-[90px]" : "w-[280px]"}`}>
			<div className="absolute -right-3 top-10 z-50">
				<button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`h-8 w-8 flex items-center justify-center rounded-full border border-border/50 shadow-md bg-white text-muted-foreground hover:text-accent hover:scale-110 transition-all duration-300 ${isMobileMenuOpen && "rotate-180"}`}>
					<ChevronLeft className="h-4 w-4" />
				</button>
			</div>

			<div className="flex flex-col h-full">
				<div className="h-24 flex items-center justify-between px-6 pt-4">
					<div className="flex flex-col">
						<span className="font-[Lato-Black] text-2xl tracking-tight text-foreground flex items-center gap-4">
							<div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm shadow-primary/20">
								<img src={Logo} alt="Logo" className="w-6 h-6 text-white" />
							</div>
							{ !isMobileMenuOpen && 'l-Ark' }
						</span>
						{ !isMobileMenuOpen && <span className="text-[10px] text-muted-foreground font-[Lato-Regular] tracking-widest uppercase ml-11 mt-1"> Enterprise </span> }
					</div>
				</div>

				<nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-none">
					<div className="space-y-2">
						{ !isMobileMenuOpen && <p className="px-4 text-xs font-[Lato-Bold] text-muted-foreground/70 uppercase tracking-widest mb-4"> { t('titles.workspace') } </p> }
						{ navItems.map((item) => {
							const isActive = location.pathname === item.href;

							return (
								<a key={item.href} onClick={() => navigate(item.href)}>
									<div className={`
										flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer relative overflow-hidden
										${isActive ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-4px_rgba(45,46,50,0.3)]" 
											: "text-muted-foreground hover:bg-[#F8F9FA] hover:text-foreground"}
										`}
									>
										<item.icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? "text-[#FFBF00]" : "text-muted-foreground group-hover:text-foreground"}`} />
										
										{ !isMobileMenuOpen &&
											<span className={`font-[Lato-Light] text-sm tracking-wide ${isActive && "font-[Lato-Regular]"}`}>
												{item.label}
											</span>
										}

										{ isActive && !isMobileMenuOpen && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#FFBF00] opacity-100 rounded-l-full" /> }
									</div>
								</a>
							);
						})}
					</div>
					<div className="space-y-2">
						{ !isMobileMenuOpen && <p className="px-4 text-xs font-[Lato-Bold] text-muted-foreground/70 uppercase tracking-widest mb-4"> { t('titles.preferences') } </p> }
						<div onClick={() => navigate("/roles") }>
							<div className={`
								group flex items-center px-4 py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 text-muted-foreground
								${location.pathname === '/roles' ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-4px_rgba(45,46,50,0.3)]" : "text-muted-foreground hover:bg-[#F8F9FA] hover:text-foreground"}
							`}>
								<Shield className="w-5 h-5 mr-3 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
								{ !isMobileMenuOpen && t('titles.roles-permissions') }
							</div>
						</div>
						<div onClick={() => navigate("/settings") }>
							<div className={`
								group flex items-center px-4 py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 text-muted-foreground
								${location.pathname === '/settings' ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-4px_rgba(45,46,50,0.3)]" : "text-muted-foreground hover:bg-[#F8F9FA] hover:text-foreground"}
							`}>
								<Settings className="w-5 h-5 mr-3 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
								{ !isMobileMenuOpen && t('titles.settings') }
							</div>
						</div>
					</div>
				</nav>

				<div className="p-4 mt-auto">
					<div className="bg-secondary/30 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex items-center gap-3 shadow-inner">
						<div className="relative">
							<Avatar className="h-10 w-10 border-2 border-background shadow-md">
								{/* <AvatarImage src={user?.avatar} /> 
								<AvatarFallback className='font-[Lato-Bold] text-sm'> { getShortNameUser(user?.firstName, user?.lastName) } </AvatarFallback>*/}
								<AvatarFallback className='font-[Lato-Bold] text-sm'> { getShortNameUser('George Adrian', 'Gabor') } </AvatarFallback>
							</Avatar>
							<div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-bold text-foreground truncate"> { `${ 'George Adrian' } ${ 'Gabor' }` }</p>
							<p className="text-xs text-muted-foreground truncate"> ggabor@outlook.es </p>
						</div>
						<div onClick={handleLogout} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
							<LogOut className="w-4 h-4" />
						</div>
					</div>
				</div>
			</div>
		</aside>
    );
}

export default Sidebar;