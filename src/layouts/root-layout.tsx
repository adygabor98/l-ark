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
		{ icon: Calendar, label: t('titles.agenda'), href: "/agenda", permissions: [] },
		{ icon: Building2, label: t('titles.offices'), href: "/offices", permissions: [] },
		{ icon: Briefcase, label: t('titles.divisions'), href: "/divisions", permissions: [] },
		{ icon: Users, label: t('titles.users'), href: "/users", permissions: [] },
		{ icon: FolderCog, label: t('titles.operations'), href: "/operations", permissions: [] },
		{ icon: LayoutTemplate, label: t('titles.templates'), href: "/templates", permissions: [] }
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