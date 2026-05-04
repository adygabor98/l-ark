import {
	useEffect,
	useState,
	type ReactElement
} from 'react';
import {
	Drawer
} from 'antd';
import {
	History,
	RotateCcw,
	Edit3
} from 'lucide-react';
import {
	useRole,
	type RolePermissionAuditEntry
} from '../../../server/hooks/useRole';

interface RoleHistoryDrawerProps {
	open: boolean;
	onClose: () => void;
	roleId: string | null;
	roleName?: string;
}

const formatDate = (raw: string | null): string => {
	if (!raw) return '—';
	try {
		const d = new Date(raw);
		return d.toLocaleString();
	} catch {
		return raw;
	}
};

const ActionIcon = ({ action }: { action: string }): ReactElement => {
	if (action === 'RESET_PERMISSIONS') return <RotateCcw className="w-4 h-4 text-amber-600" />;
	return <Edit3 className="w-4 h-4 text-blue-600" />;
};

const RoleHistoryDrawer = ({ open, onClose, roleId, roleName }: RoleHistoryDrawerProps): ReactElement => {
	const { retrieveRolePermissionHistory } = useRole();
	const [entries, setEntries] = useState<Array<RolePermissionAuditEntry>>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (!open || !roleId) return;
		setLoading(true);
		retrieveRolePermissionHistory({ roleId })
			.then((res) => setEntries(res?.data?.data ?? []))
			.finally(() => setLoading(false));
	}, [open, roleId]);

	return (
		<Drawer
			title={
				<div className="flex items-center gap-2">
					<History className="w-5 h-5 text-primary" />
					<span className="font-[Lato-Bold] text-base">
						{roleName ? `History · ${roleName}` : 'Permission History'}
					</span>
				</div>
			}
			placement="right"
			width={520}
			open={open}
			onClose={onClose}
			destroyOnClose
		>
			{loading && (
				<p className="text-sm text-muted-foreground">Loading history…</p>
			)}
			{!loading && entries.length === 0 && (
				<p className="text-sm text-muted-foreground">No permission changes have been recorded for this role yet.</p>
			)}
			{!loading && entries.length > 0 && (
				<ul className="space-y-3">
					{entries.map((entry) => {
						let parsed: any = null;
						if (entry.metadata) {
							try { parsed = JSON.parse(entry.metadata); } catch { parsed = null; }
						}
						const diff: Array<{ resource: string; action: string; before: boolean; after: boolean }> = parsed?.diff ?? [];

						return (
							<li key={entry.id} className="border border-border/40 rounded-md p-3 bg-white">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<ActionIcon action={entry.action} />
										<span className="text-[13px] font-[Lato-Bold] text-foreground">
											{entry.action === 'RESET_PERMISSIONS' ? 'Reset to defaults' : 'Permissions updated'}
										</span>
									</div>
									<span className="text-[11px] text-muted-foreground">
										{formatDate(entry.createdAt)}
									</span>
								</div>
								{entry.userId && (
									<p className="text-[11px] text-muted-foreground mb-2">
										by user #{entry.userId}
									</p>
								)}
								{diff.length > 0 ? (
									<ul className="text-[12px] space-y-1">
										{diff.map((d, idx) => (
											<li key={idx} className="flex items-center gap-2">
												<code className="bg-secondary/60 px-1.5 py-0.5 rounded text-[11px]">{d.resource}.{d.action}</code>
												<span className="text-muted-foreground">{String(d.before)} → {String(d.after)}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-[12px] text-muted-foreground italic">No field-level diff captured.</p>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</Drawer>
	);
};

export default RoleHistoryDrawer;
