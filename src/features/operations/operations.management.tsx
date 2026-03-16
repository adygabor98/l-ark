import { useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useOperationState } from "./hooks/use-operation";
import { divisions } from "./data/divisions";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import type { Operation } from "./types/operation";

function relativeTime(dateStr: string) {
	const now = Date.now();
	const then = new Date(dateStr).getTime();
	const diff = now - then;
	const mins = Math.floor(diff / 60000);

	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	
	return new Date(dateStr).toLocaleDateString();
}

const OperationsManagement = (): ReactElement => {
	const { operations } = useOperationState();
	const navigate = useNavigate();
	const [search, setSearch] = useState("");

	const divisionMap = useMemo(
		() => Object.fromEntries(divisions.map((d) => [d.id, d.name])),
		[]
	);

	const filtered = useMemo(() => {
		if (!search) return operations;
		const q = search.toLowerCase();

		return operations.filter((op: any) =>
			op.title.toLowerCase().includes(q) ||
			op.description.toLowerCase().includes(q) ||
			(divisionMap[op.divisionId] ?? "").toLowerCase().includes(q)
		);
	}, [operations, search, divisionMap]);

	const stats = useMemo(() => {
		const totalSteps = operations.reduce((sum: number, op: any) => sum + op.steps.length, 0);
		const activeDivisions = new Set(operations.map((op: any) => op.divisionId).filter(Boolean)).size;

		return { totalOps: operations.length, totalSteps, activeDivisions };
	}, [operations]);

	const columns: ColumnsType<Operation> = useMemo(() => [
		{
			title: "Title",
			dataIndex: "title",
			key: "title",
			sorter: (a, b) => a.title.localeCompare(b.title),
			render: (text: string) => (
				<span className="font-semibold text-text">{text}</span>
			)
		},
		{
			title: "Description",
			dataIndex: "description",
			key: "description",
			ellipsis: true,
			render: (text: string) => (
				<span className="text-text-secondary text-sm">{text}</span>
			)
		},
		{
			title: "Division",
			dataIndex: "divisionId",
			key: "division",
			width: 180,
			filters: divisions.map((d) => ({ text: d.name, value: d.id })),
			onFilter: (value, record) => record.divisionId === value,
			render: (divId: string) => (
				<Badge variant="default">{divisionMap[divId] ?? divId}</Badge>
			)
		},
		{
			title: "Steps",
			key: "steps",
			width: 80,
			align: "center",
			sorter: (a, b) => a.steps.length - b.steps.length,
			render: (_, record) => (
				<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
					{record.steps.length}
				</span>
			)
		},
		{
			title: "Updated",
			dataIndex: "updatedAt",
			key: "updatedAt",
			width: 130,
			sorter: (a, b) =>
			new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
			defaultSortOrder: "descend",
			render: (date: string) => (
				<span className="text-text-muted text-xs">{relativeTime(date)}</span>
			)
		}
	], [divisionMap]);

	return (
		<div className="min-h-screen bg-[#f8fafc] p-6">
			<div className="mx-auto max-w-6xl space-y-5">
				{/* ── Header Card ── */}
				<div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-700 via-primary-600 to-indigo-500 px-8 py-8 shadow-lg animate-fade-in-up">
					{/* Decorative blobs */}
					<div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/0.06 blur-2xl" />
					<div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/0.04 blur-2xl" />

					<div className="relative flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-white tracking-tight">
								Operation Management
							</h1>
							<p className="mt-1.5 text-sm text-indigo-100/80">
								Create and manage operational workflows
							</p>
						</div>
						<Button
							className="bg-white/95 text-primary hover:bg-white shadow-md border-0 hover:shadow-lg hover:from-white hover:to-white"
							onClick={() => navigate("/operations/detail")}
						>
							<PlusOutlined />
							New Operation
						</Button>
					</div>
				</div>

				{/* ── Stat Cards ── */}
				<div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "0.06s" }}>
					{[
						{ label: "Total Operations", value: stats.totalOps, icon: "📋", color: "from-primary-500 to-primary-600" },
						{ label: "Total Steps", value: stats.totalSteps, icon: "🔗", color: "from-emerald-500 to-emerald-600" },
						{ label: "Active Divisions", value: stats.activeDivisions, icon: "🏢", color: "from-amber-500 to-amber-600" },
					].map((stat) => (
						<div key={stat.label} className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
							<div className="flex items-center gap-3">
								<div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${stat.color} text-lg shadow-sm`}>
									{stat.icon}
								</div>
								<div>
									<p className="text-xl font-bold text-text">{stat.value}</p>
									<p className="text-[11px] font-medium text-text-muted">{stat.label}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* ── Search + Table Card ── */}
				<div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
					{/* Search inside the card */}
					<div className="border-b border-border/40 px-5 py-3">
						<div className="relative max-w-xs">
							<SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-text-muted text-xs" />
							<Input
								placeholder="Search operations..."
								value={search}
								onChange={(e: any) => setSearch(e.target.value)}
								className="pl-8 h-8 text-sm"
							/>
						</div>
					</div>

					<Table
						dataSource={filtered}
						columns={columns}
						rowKey="id"
						pagination={{ pageSize: 10, showSizeChanger: false }}
						onRow={(record) => ({
							onClick: () => navigate(`/operations/detail/${record.id}`),
							className: "cursor-pointer hover:bg-[#faf8ff] transition-colors",
						})}
						locale={{
							emptyText: (
								<div className="py-14 text-center animate-fade-in-up">
									<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 animate-float">
										<span className="text-2xl">📋</span>
									</div>
									<p className="text-sm font-semibold text-text mb-1">No operations yet</p>
									<p className="text-xs text-text-muted mb-3">
										Get started by creating your first workflow
									</p>
									<Button size="sm" onClick={() => navigate("/operations/detail")}>
										<PlusOutlined />
										Create your first operation
									</Button>
								</div>
							)
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default OperationsManagement;