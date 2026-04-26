import type { ReactElement } from "react";
import { DatePicker, Switch } from "antd";
import dayjs from "dayjs";
import { Plus, Trash2 } from "lucide-react";
import { CELL_BASE } from "./field-styles";

/** Table cell input — renders the correct input type based on column type */
const TableCellInput = ({ colType, value, onChange, disabled }: { colType: string; value: any; onChange: (val: any) => void; disabled?: boolean }): ReactElement => {
	switch (colType) {
		case 'NUMBER':
			return (
				<input type="number" className={CELL_BASE} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={disabled} placeholder="0" />
			);
		case 'CURRENCY':
			return (
				<div className="relative">
					<input type="number" step="0.01" className={`${CELL_BASE} pr-6`} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={disabled} placeholder="0.00" />
					<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-[Lato-Bold] text-black/25 pointer-events-none">€</span>
				</div>
			);
		case 'PERCENTAGE':
			return (
				<div className="relative">
					<input type="number" min={0} max={100} className={`${CELL_BASE} pr-6`} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={disabled} placeholder="0" />
					<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-[Lato-Bold] text-black/25 pointer-events-none">%</span>
				</div>
			);
		case 'DATE':
			return (
				<DatePicker
					className="!w-full !h-8 !rounded-md !border-black/10 !font-[Lato-Regular] !text-sm hover:!border-[#FFBF00]/50"
					placeholder="Select date"
					format="DD-MM-YYYY"
					value={value ? dayjs(value) : null}
					onChange={(date: any) => onChange(date ? date.toISOString() : null)}
					disabled={disabled}
				/>
			);
		case 'DATE_TIME':
			return (
				<DatePicker
					className="!w-full !h-8 !rounded-md !border-black/10 !font-[Lato-Regular] !text-sm hover:!border-[#FFBF00]/50"
					showTime={{ format: 'HH:mm' }}
					placeholder="Select date & time"
					format="DD-MM-YYYY HH:mm"
					value={value ? dayjs(value) : null}
					onChange={(date: any) => onChange(date ? date.toISOString() : null)}
					disabled={disabled}
				/>
			);
		case 'BOOLEAN':
			return (
				<div className="flex items-center h-8 px-2">
					<Switch size="small" checked={value ?? false} onChange={(val: boolean) => onChange(val)} disabled={disabled} />
				</div>
			);
		case 'EMAIL':
			return (
				<input type="email" className={CELL_BASE} value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="email@example.com" />
			);
		case 'PHONE':
			return (
				<input type="tel" className={CELL_BASE} value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="+34..." />
			);
		case 'TEXTAREA':
			return (
				<textarea className={`${CELL_BASE} resize-y min-h-8`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="—" rows={1} />
			);
		case 'TEXT':
		default:
			return (
				<input type="text" className={CELL_BASE} value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="—" />
			);
	}
};

/** Table field with dynamic rows */
export const TableFieldRenderer = ({ field, columns, disabled }: any): ReactElement => {
	const rows: any[] = field.value ?? [{}];

	const updateCell = (rowIdx: number, colName: string, val: any) => {
		const updated = rows.map((row: any, i: number) => i === rowIdx ? { ...row, [colName]: val } : row);
		field.onChange(updated);
	};

	const addRow = () => field.onChange([...rows, {}]);

	const removeRow = (idx: number) => {
		if (rows.length <= 1) return;
		field.onChange(rows.filter((_: any, i: number) => i !== idx));
	};

	return (
		<div className="rounded-xl border border-black/8 overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="bg-[#F8F9FA]">
						{(columns ?? []).map((col: any, idx: number) => (
							<th key={idx} className="text-left px-3 py-2 text-[11px] font-[Lato-Bold] text-black/50 uppercase tracking-wider border-b border-black/6">
								{col.name}
							</th>
						))}
						{!disabled && <th className="w-8 border-b border-black/6" />}
					</tr>
				</thead>
				<tbody>
					{rows.map((row: any, rowIdx: number) => (
						<tr key={rowIdx} className="border-b border-black/4 last:border-b-0">
							{(columns ?? []).map((col: any, colIdx: number) => (
								<td key={colIdx} className="px-2 py-1.5">
									<TableCellInput
										colType={col.type ?? 'TEXT'}
										value={row[col.name]}
										onChange={(val) => updateCell(rowIdx, col.name, val)}
										disabled={disabled}
									/>
								</td>
							))}
							{!disabled && (
								<td className="px-1 py-1.5">
									{rows.length > 1 && (
										<button type="button" onClick={() => removeRow(rowIdx)} className="p-1 text-black/20 hover:text-red-500 transition-colors cursor-pointer">
											<Trash2 className="w-3 h-3" />
										</button>
									)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
			{!disabled && (
				<button
					type="button"
					onClick={addRow}
					className="w-full flex items-center justify-center gap-1 py-2 text-xs font-[Lato-Regular] text-black/30 hover:text-[#FFBF00] hover:bg-amber-50/50 transition-colors cursor-pointer border-t border-black/4"
				>
					<Plus className="w-3 h-3" /> Add Row
				</button>
			)}
		</div>
	);
};
