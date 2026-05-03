import {
	useState,
	useMemo,
	type ReactElement
} from 'react';
import {
	Briefcase,
	Building2,
	Calendar,
	FolderCog,
	Inbox,
	LayoutDashboard,
	LayoutTemplate,
	Users
} from 'lucide-react';
import {
	usePermissions
} from '../shared/hooks/usePermissions';
import {
	useTranslation
} from 'react-i18next';
import Sidebar from '../shared/components/sidebar';
import Content from '../shared/components/content';

const RootLayout = ({ children }: { children: ReactElement }): ReactElement => {
	/** State to manage is the mobile menu is opened */
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
	/** Permission utilities */
	const { checkPermissions } = usePermissions();
	/** Translation utilities */
	const { t } = useTranslation();

	const allNavItems = [
		{ icon: LayoutDashboard, label: t('titles.dashboard'), href: "/dashboard", permissions: [] },
		{ icon: Calendar, label: t('titles.agenda'), href: "/agenda", permissions: ['agenda.view_all', 'agenda.view_mine_and_sub', 'agenda.view_mine'] },
		{ icon: Building2, label: t('titles.offices'), href: "/offices", permissions: ['offices.view'] },
		{ icon: Briefcase, label: t('titles.divisions'), href: "/divisions", permissions: ['divisions.view'] },
		{ icon: Users, label: t('titles.users'), href: "/users", permissions: ['users.view'] },
		{ icon: FolderCog, label: t('titles.operations'), href: "/operations", permissions: ['operations.view'] },
		{ icon: Inbox, label: 'My Workspace', href: "/workspace", permissions: ['operations.view'] },
		{ icon: LayoutTemplate, label: t('titles.templates'), href: "/templates", permissions: ['templates.view'] }
	];

	/** Filter navigation items based on user permissions */
	const navItems = useMemo(() => {
		return allNavItems.filter(item => {
			// If no permission required, show the item
			if (!item.permissions) {
				return true;
			}
			// Check if user has the required permission(s)
			return checkPermissions(item.permissions);
		});
	}, [checkPermissions]);

	return (
		<div className="flex h-screen w-full bg-[#F2F3F5] p-2 md:p-4 gap-4 overflow-hidden">
			<Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} navItems={navItems} />
			<Content navItems={navItems} setIsMobileMenuOpen={setIsMobileMenuOpen}>
				{ children }
			</Content>
			{/* Mobile Overlay */}
			{ isMobileMenuOpen && (
				<div 
					className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			) }
		</div>
	);
}

export default RootLayout;