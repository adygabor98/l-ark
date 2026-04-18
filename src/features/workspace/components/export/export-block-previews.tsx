import type { ReactElement, CSSProperties } from "react";
import { generateHTML } from "@tiptap/core";
import type { ExportBlock, ExportRow, AvailableToken, FormGridRow, FormGridCell } from "../../../templates/export-layout/export-layout.models";
import type { FieldValueMap } from "./export-tiptap-extensions";

export const RichTextPreview = ({ content, extensions }: { content?: Record<string, unknown>; extensions: any[] }): ReactElement => {
	if (!content) return <p className="text-black/30 italic text-sm">Empty text block</p>;
	let html: string;
	try {
		html = generateHTML(content as never, extensions).replace(/<p[^>]*><\/p>/g, "<br />");
	} catch {
		html = "<p></p>";
	}
	return (
		<div
			className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};

export const TablePreview = ({
	block,
	fieldValues,
	tokens,
}: {
	block: ExportBlock;
	fieldValues: FieldValueMap;
	tokens: AvailableToken[];
}): ReactElement => {
	const token = tokens.find(t => t.fieldId === block.sourceFieldId);
	const rawCols = token?.columns ?? [];

	const displayCols = block.settings.tableColumns?.length
		? block.settings.tableColumns
			.filter(tc => tc.visible)
			.map(tc => {
				const raw = rawCols.find(c => c.id === tc.colId);
				return { id: tc.colId, name: raw?.name ?? tc.label, widthPct: tc.widthPct };
			})
		: rawCols.map(c => ({ id: c.id, name: c.name, widthPct: undefined as number | undefined }));
	const hasColumns = displayCols.length > 0;

	const tableData = fieldValues.get(String(block.sourceFieldId));
	const rows: Record<string, unknown>[] = Array.isArray(tableData) ? tableData : [];

	return (
		<div className={`border rounded-lg overflow-hidden text-xs ${block.settings.borderStyle === "none" ? "border-transparent" : "border-black/15"}`}>
			{block.settings.hasHeaderRow !== false && hasColumns && (
				<div className={`flex font-[Lato-Regular] bg-black/5 ${block.settings.borderStyle !== "none" ? "border-b border-black/10" : ""}`}>
					{displayCols.map(col => (
						<div key={col.id} className="px-3 py-1.5" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
							{col.name}
						</div>
					))}
				</div>
			)}

			{rows.length > 0
				? rows.map((row, i) => (
					<div
						key={i}
						className={`flex ${block.settings.borderStyle !== "none" ? "border-b border-black/6 last:border-0" : ""}
							${block.settings.alternatingRows && i % 2 === 1 ? "bg-black/2" : ""}
						`}
					>
						{hasColumns
							? displayCols.map(col => (
								<div key={col.id} className="px-3 py-2" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
									{String(row[col.id] ?? row[col.name] ?? "")}
								</div>
							))
							: <div className="px-3 py-2 w-full">{JSON.stringify(row)}</div>
						}
					</div>
				))
				: [1, 2].map(i => (
					<div
						key={i}
						className={`flex text-black/30 italic ${block.settings.borderStyle !== "none" ? "border-b border-black/6 last:border-0" : ""}
							${block.settings.alternatingRows && i % 2 === 0 ? "bg-black/2" : ""}
						`}
					>
						{hasColumns
							? displayCols.map(col => (
								<div key={col.id} className="px-3 py-2" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
									—
								</div>
							))
							: <div className="px-3 py-2 w-full">No data</div>
						}
					</div>
				))
			}
		</div>
	);
};

export const SignaturePreview = ({
	block,
	fieldValues,
	tokens,
}: {
	block: ExportBlock;
	fieldValues: FieldValueMap;
	tokens: AvailableToken[];
}): ReactElement => {
	const token = tokens.find(t => t.fieldId === block.sourceFieldId);
	const width = block.settings.signatureWidth ?? 280;
	const sigData = fieldValues.get(String(block.sourceFieldId));
	const label = token?.fieldLabel ?? "Signature";

	return (
		<div style={{ width }} className="flex flex-col gap-1">
			<div className="relative rounded-lg overflow-hidden bg-white">
				{sigData && typeof sigData === "string" && sigData.startsWith("data:image") ? (
					<img src={sigData} alt={label} style={{ width: "100%", height: "auto" }} />
				) : (
					<div className="border border-dashed border-black/20 rounded-lg h-16 flex items-center justify-center">
						<span className="text-xs text-black/30 italic">No signature</span>
					</div>
				)}
			</div>
			<span className="text-center text-xs font-[Lato-Regular] text-slate-500 uppercase tracking-wider">{label}</span>
		</div>
	);
};

export const FormGridPreview = ({
	block,
	fieldValues,
	tokens,
}: {
	block: ExportBlock;
	fieldValues: FieldValueMap;
	tokens: AvailableToken[];
}): ReactElement => {
	const gridRows: FormGridRow[] = block.settings.formGridRows ?? [];
	const columns: number = block.settings.formGridColumns ?? 4;
	const columnWidths: number[] = block.settings.formGridColumnWidths ?? Array.from({ length: columns }, () => 100 / columns);
	const borderColor: string = block.settings.formGridBorderColor ?? '#d1d5db';
	const borderWidth: number = block.settings.formGridBorderWidth ?? 1;
	const cellPadding: number = block.settings.formGridCellPadding ?? 6;
	const outerBorder: boolean = block.settings.formGridOuterBorder ?? true;

	// Build set of cell IDs that are "consumed" by a rowspan/colspan from another cell
	const hiddenCells = new Set<string>();
	for (let ri = 0; ri < gridRows.length; ri++) {
		const row = gridRows[ri];
		for (let ci = 0; ci < row.cells.length; ci++) {
			const cell = row.cells[ci];
			if (hiddenCells.has(cell.id)) continue;
			const cs = cell.colspan ?? 1;
			const rs = cell.rowspan ?? 1;
			if (rs > 1 || cs > 1) {
				for (let dr = 0; dr < rs; dr++) {
					for (let dc = 0; dc < cs; dc++) {
						if (dr === 0 && dc === 0) continue;
						const targetRow = gridRows[ri + dr];
						if (targetRow) {
							const targetCell = targetRow.cells[ci + dc];
							if (targetCell) hiddenCells.add(targetCell.id);
						}
					}
				}
			}
		}
	}

	const renderCellContent = (cell: FormGridCell): ReactElement => {
		const token = cell.fieldId ? tokens.find(t => t.fieldId === cell.fieldId) : undefined;
		const value = cell.fieldId ? fieldValues.get(String(cell.fieldId)) : undefined;

		const style: CSSProperties = {
			fontWeight: cell.fontWeight ?? 'normal',
			textAlign: cell.textAlign ?? 'left',
			fontSize: cell.fontSize ?? 11,
			...(cell.verticalText ? {
				writingMode: 'vertical-rl' as const,
				textOrientation: 'mixed' as const,
				transform: 'rotate(180deg)',
			} : {}),
		};

		switch (cell.contentType) {
			case 'label':
				return <span style={style}>{cell.label ?? ''}</span>;
			case 'field': {
				const display = value !== undefined && value !== null && value !== ''
					? String(value)
					: <span style={{ borderBottom: '1px dotted rgba(0,0,0,0.3)', display: 'inline-block', minWidth: 40 }}>&nbsp;</span>;
				return <span style={style}>{display}</span>;
			}
			case 'checkbox': {
				const boolVal = value === true || value === 'true' || value === 'Yes';
				const boxStyle: CSSProperties = {
					display: 'inline-block', width: 11, height: 11,
					border: `1.5px solid ${boolVal ? '#059669' : 'rgba(0,0,0,0.5)'}`,
					borderRadius: 2, flexShrink: 0,
					backgroundColor: boolVal ? '#059669' : 'transparent',
					verticalAlign: 'middle', marginRight: 4,
				};
				return (
					<span style={{ ...style, display: 'inline-flex', alignItems: 'center' }}>
						<span style={boxStyle} />
						{token?.fieldLabel ?? ''}
					</span>
				);
			}
			case 'empty':
			default:
				return <span />;
		}
	};

	return (
		<table
			style={{
				width: '100%',
				borderCollapse: 'collapse',
				tableLayout: 'fixed',
				border: outerBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
				fontSize: 11,
			}}
		>
			<colgroup>
				{columnWidths.map((w, i) => (
					<col key={i} style={{ width: `${w}%` }} />
				))}
			</colgroup>
			<tbody>
				{gridRows.map(row => (
					<tr key={row.id} style={row.height ? { height: row.height } : undefined}>
						{row.cells.map(cell => {
							if (hiddenCells.has(cell.id)) return null;
							const cs = cell.colspan ?? 1;
							const rs = cell.rowspan ?? 1;
							return (
								<td
									key={cell.id}
									colSpan={cs > 1 ? cs : undefined}
									rowSpan={rs > 1 ? rs : undefined}
									style={{
										border: `${borderWidth}px solid ${borderColor}`,
										padding: cellPadding,
										backgroundColor: cell.backgroundColor || undefined,
										verticalAlign: 'middle',
										wordBreak: 'break-word',
									}}
								>
									{renderCellContent(cell)}
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export const BlockPreview = ({
	block,
	fieldValues,
	tokens,
	extensions,
}: {
	block: ExportBlock;
	fieldValues: FieldValueMap;
	tokens: AvailableToken[];
	extensions: any[];
}): ReactElement | null => {
	switch (block.type) {
		case "RICH_TEXT":
			return <RichTextPreview content={block.content} extensions={extensions} />;
		case "TABLE":
			return <TablePreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "FORM_GRID":
			return <FormGridPreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "SIGNATURE":
			return <SignaturePreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "IMAGE":
			return block.imageUrl ? (
				<div style={{ textAlign: block.settings.imageAlignment ?? "left" }}>
					<img src={block.imageUrl} alt="Document image" style={{ width: block.settings.imageWidth ?? 200, display: "inline-block" }} className="max-w-full" />
				</div>
			) : (
				<div className="border border-dashed border-black/15 rounded-lg h-16 flex items-center justify-center text-xs text-black/30">
					Image placeholder
				</div>
			);
		case "DIVIDER":
			return <hr style={{ borderTopWidth: block.settings.lineWeight ?? 1, borderColor: block.settings.lineColor ?? "#e5e7eb", borderStyle: "solid" }} />;
		case "PAGE_BREAK":
		case "BLANK":
			return null;
		default:
			return null;
	}
};

export const RowPreview = ({
	row,
	fieldValues,
	tokens,
	extensions,
}: {
	row: ExportRow;
	fieldValues: FieldValueMap;
	tokens: AvailableToken[];
	extensions: any[];
}): ReactElement => {
	return (
		<div className="flex gap-3">
			{row.cells.map(cell => {
				const s = cell.block.settings;
				// Conditional visibility: hide block if the conditional field has no value
				if (cell.block.conditionalFieldId) {
					const condVal = fieldValues.get(String(cell.block.conditionalFieldId));
					if (condVal === undefined || condVal === null || condVal === "" || condVal === false) {
						return null;
					}
				}

				return (
					<div
						key={cell.id}
						style={{
							flex: cell.width,
							minWidth: 0,
							marginBottom: s.marginBottom ?? 0,
							backgroundColor: s.backgroundColor || undefined,
							padding: s.padding
								? `${s.padding.top}px ${s.padding.right}px ${s.padding.bottom}px ${s.padding.left}px`
								: undefined,
							borderWidth: s.borderWidth || undefined,
							borderColor: s.borderColor || undefined,
							borderStyle: s.borderStyleDecoration || (s.borderWidth ? "solid" : undefined),
							borderRadius: s.borderRadius ?? undefined,
						}}
					>
						<BlockPreview block={cell.block} fieldValues={fieldValues} tokens={tokens} extensions={extensions} />
					</div>
				);
			})}
		</div>
	);
};
