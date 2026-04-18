import {
	useState,
	useEffect,
	type ReactElement
} from "react";
import {
	X,
	Loader2,
	Shield,
	UserPlus,
	Trash2,
	Clock
} from "lucide-react";
import Button from "../../../shared/components/button";
import { useToast } from "../../../shared/hooks/useToast";

interface Grant {
	id: number;
	expiresAt: string | null;
	createdAt: string;
	grantedTo: { id: number; firstName: string; lastName: string; email: string; role: string };
	grantedBy: { id: number; firstName: string; lastName: string };
}

interface User {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
}

interface PropTypes {
	docId: number;
	fileName: string;
	onClose: () => void;
}

const GrantAccessModal = ({ docId, fileName, onClose }: PropTypes): ReactElement => {
	const { onToast } = useToast();
	const [grants, setGrants] = useState<Grant[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [granting, setGranting] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<number | "">("");
	const [expiryHours, setExpiryHours] = useState<number | "">(24);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const [grantsRes, usersRes] = await Promise.all([
				fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/${docId}/grants`),
				fetch(`${import.meta.env.VITE_SERVER_HOST}/api/users?role=C`)
			]);
			const grantsData = await grantsRes.json();
			const usersData = await usersRes.json();

			if (grantsData.success) setGrants(grantsData.data);
			if (usersData.success) setUsers(usersData.data ?? []);
		} catch {
			onToast({ message: 'Failed to load data', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleGrant = async () => {
		if (!selectedUserId) return;
		setGranting(true);
		try {
			const body: Record<string, unknown> = { grantedToId: selectedUserId };
			if (expiryHours) {
				const expiresAt = new Date();
				expiresAt.setHours(expiresAt.getHours() + Number(expiryHours));
				body.expiresAt = expiresAt.toISOString();
			}

			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/${docId}/grant-access`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const result = await res.json();
			if (result.success) {
				onToast({ message: 'Access granted successfully', type: 'success' });
				setSelectedUserId("");
				await loadData();
			} else {
				onToast({ message: result.message || 'Failed to grant access', type: 'error' });
			}
		} catch {
			onToast({ message: 'Failed to grant access', type: 'error' });
		} finally {
			setGranting(false);
		}
	};

	const handleRevoke = async (grantId: number) => {
		try {
			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/grants/${grantId}`, { method: 'DELETE' });
			const result = await res.json();
			if (result.success) {
				onToast({ message: 'Access revoked', type: 'success' });
				setGrants(prev => prev.filter(g => g.id !== grantId));
			}
		} catch {
			onToast({ message: 'Failed to revoke access', type: 'error' });
		}
	};

	const grantedUserIds = new Set(grants.map(g => g.grantedTo.id));
	const availableUsers = users.filter(u => !grantedUserIds.has(u.id));

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-300">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
							<Shield className="w-4 h-4 text-violet-600" />
						</div>
						<div>
							<h2 className="text-md font-[Lato-Bold] text-black/80">Document Access</h2>
							<p className="text-[11px] font-[Lato-Regular] text-black/40 truncate max-w-75">{fileName}</p>
						</div>
					</div>
					<button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:bg-black/4 hover:text-black/60 transition-all cursor-pointer">
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Body */}
				<div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
					{loading ? (
						<div className="flex flex-col items-center gap-3 py-8">
							<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
							<p className="text-sm font-[Lato-Regular] text-black/40">Loading...</p>
						</div>
					) : (
						<>
							{/* Grant new access */}
							<div className="mb-6">
								<h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wider mb-3">Grant Access</h3>
								<div className="flex gap-2">
									<select
										value={selectedUserId}
										onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
										className="flex-1 h-9 px-3 text-sm font-[Lato-Regular] rounded-lg border border-black/10 outline-none focus:border-violet-400 bg-white"
									>
										<option value="">Select a user...</option>
										{availableUsers.map(u => (
											<option key={u.id} value={u.id}>
												{u.firstName} {u.lastName} ({u.email})
											</option>
										))}
									</select>
									<select
										value={expiryHours}
										onChange={(e) => setExpiryHours(e.target.value ? Number(e.target.value) : "")}
										className="w-28 h-9 px-2 text-sm font-[Lato-Regular] rounded-lg border border-black/10 outline-none focus:border-violet-400 bg-white"
									>
										<option value={1}>1 hour</option>
										<option value={6}>6 hours</option>
										<option value={24}>24 hours</option>
										<option value={72}>3 days</option>
										<option value={168}>7 days</option>
										<option value="">Permanent</option>
									</select>
									<Button
										variant="primary"
										size="sm"
										onClick={handleGrant}
										disabled={!selectedUserId || granting}
									>
										{granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
										Grant
									</Button>
								</div>
							</div>

							{/* Existing grants */}
							<div>
								<h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wider mb-3">
									Active Grants ({grants.length})
								</h3>
								{grants.length === 0 ? (
									<p className="text-sm font-[Lato-Regular] text-black/30 text-center py-4">
										No active access grants for this document.
									</p>
								) : (
									<div className="space-y-2">
										{grants.map(grant => (
											<div key={grant.id} className="flex items-center justify-between p-3 rounded-xl border border-black/6 bg-[#F8F9FA]">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="text-sm font-[Lato-Bold] text-black/70">
															{grant.grantedTo.firstName} {grant.grantedTo.lastName}
														</span>
														<span className="text-[9px] font-[Lato-Bold] px-1.5 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-200/50">
															{grant.grantedTo.role}
														</span>
													</div>
													<p className="text-[11px] font-[Lato-Regular] text-black/40 mt-0.5">
														{grant.grantedTo.email}
													</p>
													<div className="flex items-center gap-3 mt-1">
														<span className="text-[10px] font-[Lato-Regular] text-black/30">
															Granted by {grant.grantedBy.firstName} {grant.grantedBy.lastName}
														</span>
														{grant.expiresAt && (
															<span className="flex items-center gap-1 text-[10px] font-[Lato-Regular] text-amber-600">
																<Clock className="w-2.5 h-2.5" />
																Expires {new Date(grant.expiresAt).toLocaleDateString()}
															</span>
														)}
													</div>
												</div>
												<button
													onClick={() => handleRevoke(grant.id)}
													className="p-1.5 rounded-lg hover:bg-red-50 text-black/30 hover:text-red-500 transition-all cursor-pointer"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-3 border-t border-black/6 bg-[#F8F9FA]">
					<Button variant="ghost" onClick={onClose} className="w-full">
						Close
					</Button>
				</div>
			</div>
		</div>
	);
};

export default GrantAccessModal;
