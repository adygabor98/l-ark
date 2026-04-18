import {
	useState,
	useCallback,
	type ReactElement
} from "react";
import {
	BellDot,
	Bell,
	Check,
	CheckCheck,
	FileText,
	GitPullRequest,
	CircleCheckBig,
	XCircle,
	DollarSign,
	Zap
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuSeparator
} from "./dropdown-button";
import { useNotification } from "../../server/hooks/useNotification";
import { formatRelativeDate } from "../../features/workspace/workspace.utils";
import type { Notification } from "@l-ark/types";

const NOTIFICATION_ICONS: Record<string, ReactElement> = {
	OPERATION_REQUEST_CREATED: <GitPullRequest className="w-3.5 h-3.5 text-amber-600" />,
	OPERATION_REQUEST_APPROVED: <CircleCheckBig className="w-3.5 h-3.5 text-emerald-600" />,
	OPERATION_REQUEST_REJECTED: <XCircle className="w-3.5 h-3.5 text-red-500" />,
	STEP_COMPLETED: <Check className="w-3.5 h-3.5 text-blue-600" />,
	INSTANCE_READY: <Zap className="w-3.5 h-3.5 text-emerald-600" />,
	INSTANCE_CLOSED: <FileText className="w-3.5 h-3.5 text-slate-500" />,
	PAYMENT_RECEIVED: <DollarSign className="w-3.5 h-3.5 text-orange-600" />,
};

const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) => (
	<button
		type="button"
		onClick={() => !notification.isRead && onRead(String(notification.id))}
		className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer rounded-md ${
			notification.isRead ? 'opacity-55' : 'hover:bg-black/3'
		}`}
	>
		{/* Icon */}
		<div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 ${
			notification.isRead ? 'bg-black/4' : 'bg-amber-50'
		}`}>
			{NOTIFICATION_ICONS[notification.type] ?? <Bell className="w-3.5 h-3.5 text-black/40" />}
		</div>

		{/* Content */}
		<div className="flex-1 min-w-0">
			<div className="flex items-center gap-1.5">
				<p className={`text-xs truncate ${notification.isRead ? 'font-[Lato-Regular] text-black/50' : 'font-[Lato-Bold] text-black/80'}`}>
					{notification.title}
				</p>
				{!notification.isRead && (
					<span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
				)}
			</div>
			<p className="text-[11px] font-[Lato-Regular] text-black/45 mt-0.5 line-clamp-2">
				{notification.message}
			</p>
			<p className="text-[10px] font-[Lato-Regular] text-black/30 mt-1">
				{formatRelativeDate(notification.createdAt as any)}
			</p>
		</div>
	</button>
);

const NotificationsPopover = (): ReactElement => {
	const [open, setOpen] = useState(false);
	const {
		notifications,
		unreadCount,
		loading,
		retrieveNotifications,
		markAsRead,
		markAllAsRead
	} = useNotification();

	const handleOpen = useCallback((isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			retrieveNotifications({ limit: 20 });
		}
	}, [retrieveNotifications]);

	const handleMarkAsRead = useCallback((id: string) => {
		markAsRead({ id });
	}, [markAsRead]);

	const handleMarkAllAsRead = useCallback(() => {
		markAllAsRead();
	}, [markAllAsRead]);

	return (
		<DropdownMenu open={open} onOpenChange={handleOpen}>
			<DropdownMenuTrigger asChild>
				<button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-black/50 hover:bg-black/4 hover:text-black/70 transition-all duration-200 cursor-pointer focus:outline-none">
					{unreadCount > 0 ? (
						<BellDot className="w-[18px] h-[18px]" />
					) : (
						<Bell className="w-[18px] h-[18px]" />
					)}
					{unreadCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-[Lato-Bold] text-white">
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0 rounded-xl border border-black/8 bg-white shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-black/6">
					<div className="flex items-center gap-2">
						<h3 className="text-sm font-[Lato-Bold] text-black/80">Notifications</h3>
						{unreadCount > 0 && (
							<span className="text-[10px] font-[Lato-Bold] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
								{unreadCount} new
							</span>
						)}
					</div>
					{unreadCount > 0 && (
						<button
							type="button"
							onClick={handleMarkAllAsRead}
							className="flex items-center gap-1 text-[11px] font-[Lato-Regular] text-black/40 hover:text-black/70 transition-colors cursor-pointer"
						>
							<CheckCheck className="w-3 h-3" />
							Mark all read
						</button>
					)}
				</div>

				{/* Notification List */}
				<div className="max-h-80 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-border/50">
					{loading && notifications.length === 0 ? (
						<div className="py-8 text-center">
							<p className="text-xs font-[Lato-Regular] text-black/30">Loading...</p>
						</div>
					) : notifications.length === 0 ? (
						<div className="py-8 text-center">
							<Bell className="w-6 h-6 text-black/15 mx-auto mb-2" />
							<p className="text-xs font-[Lato-Regular] text-black/30">No notifications yet</p>
						</div>
					) : (
						notifications.map((n: Notification) => (
							<NotificationItem
								key={n.id}
								notification={n}
								onRead={handleMarkAsRead}
							/>
						))
					)}
				</div>

				{notifications.length > 0 && (
					<>
						<DropdownMenuSeparator className="m-0" />
						<div className="px-4 py-2.5 text-center">
							<p className="text-[11px] font-[Lato-Regular] text-black/30">
								Showing latest {notifications.length} notifications
							</p>
						</div>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NotificationsPopover;
