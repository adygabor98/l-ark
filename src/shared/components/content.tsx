import {
    type Dispatch,
    type ReactElement,
    type SetStateAction
} from 'react';
import {
    Menu
} from 'lucide-react';
import {
    useLocation
} from 'react-router-dom';
import type {
    NavItem
} from '../models/nav.model';
import NotificationsPopover from './notifications-popover';

interface PropTypes {
    children: ReactElement;
    navItems: NavItem[];
    setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const Content = ({ children, navItems, setIsMobileMenuOpen }: PropTypes): ReactElement => {
    /** Location utilities */
    const location = useLocation();

    return (
        <div className="h-full w-full flex flex-col min-w-0 overflow-hidden p-2">
            {/* Relative anchor for absolute overlays (excludes sidebar, includes content padding) */}
            <div id="content-overlay-root" className="relative flex flex-col flex-1 min-h-0">
            {/* Header - Blended */}
            <header className="h-20 flex items-center justify-between px-6 bg-transparent z-10">
                <div className="flex items-center">
                    <div className="lg:hidden mr-4" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </div>

                    <div className="hidden md:flex flex-col">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-[Lato-Bold] text-foreground">
                                { navItems.find((i: NavItem) => i.href === location.pathname)?.label || "Overview" }
                            </h2>
                        </div>
                        <p className="text-xs font-[Lato-Regular] text-muted-foreground"> Manage your daily activities </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <NotificationsPopover />
                </div>
            </header>

            {/* Page Content with improved container */}
            <main className="h-[calc(100%-50px)] p-0 pr-5 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border/50 hover:scrollbar-thumb-border">
                <div className="h-full w-full space-y-8">
                    { children }
                </div>
            </main>
            </div>
        </div>
    );
}

export default Content;