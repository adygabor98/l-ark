import type {
	ReactElement,
	CSSProperties
} from "react";
import {
	generateHTML
} from "@tiptap/core";
import type {
	ExportBlock,
	ExportRow,
	AvailableToken,
	FormGridRow,
	FormGridCell,
	FieldGridEntry
} from "../../../templates/export-layout/export-layout.models";
import type {
	FieldValueMap
} from "../../utils/export-tiptap-extensions";

export const RichTextPreview = ({ content, extensions }: { content?: Record<string, unknown>; extensions: any[] }): ReactElement => {
	if ( !content )
		return <p className="text-black/30 italic text-sm"> Empty text block </p>;

	let html: string;
	try {
		html = generateHTML(content as never, extensions).replace(/<p[^>]*><\/p>/g, "<br />");
	} catch ( e: any ) {
		html = "<p></p>";
	}

	return (
		<div
			className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};

const formatCellValue = (val: unknown): string => {
    if ( typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val) ) {
        const d = new Date(val);

        if ( !isNaN(d.getTime()) ) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            const HH = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${dd}-${mm}-${yyyy} ${HH}:${min}`;
        }
    }
    return String(val ?? '');
};

export const TablePreview = ({ block, fieldValues, tokens }: { block: ExportBlock; fieldValues: FieldValueMap; tokens: AvailableToken[]; }): ReactElement => {
	const token = tokens.find(t => t.fieldId === block.sourceFieldId);
	const rawCols = token?.columns ?? [];

	const displayCols = block.settings.tableColumns?.length ? block.settings.tableColumns
		.filter(tc => tc.visible)
		.map(tc => {
			const raw = rawCols.find(c => c.id === tc.colId);
			return { id: tc.colId, name: raw?.name ?? tc.label, widthPct: tc.widthPct, type: raw?.type };
		})
	: rawCols.map(c => ({ id: c.id, name: c.name, widthPct: undefined as number | undefined, type: c.type }));
	const hasColumns = displayCols.length > 0;

	const tableData = fieldValues.get(String(block.sourceFieldId));
	const rows: Record<string, unknown>[] = Array.isArray(tableData) ? tableData : [];
	
	return (
		<div className={`border rounded-lg overflow-hidden text-xs ${ block.settings.borderStyle === "none" ? "border-transparent" : "border-black/15" }`}>
			{ block.settings.hasHeaderRow !== false && hasColumns &&
				<div className={`flex font-[Lato-Regular] bg-black/5 ${block.settings.borderStyle !== "none" ? "border-b border-black/10" : ""}`}>
					{ displayCols.map(col => (
						<div key={col.id} className="px-3 py-1.5" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
							{ col.name }
						</div>
					))}
				</div>
			}

			{ rows.length > 0 ?
				rows.map((row, i) => (
					<div key={i} className={`flex ${block.settings.borderStyle !== "none" ? "border-b border-black/6 last:border-0" : ""} ${block.settings.alternatingRows && i % 2 === 1 ? "bg-black/2" : ""}`}>
						{ hasColumns ? displayCols.map(col => {
								const cellVal = row[col.id] ?? row[col.name];
								if (col.type === 'SIGNATURE') {
									return (
										<div key={col.id} className="px-3 py-2" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
											{ cellVal && typeof cellVal === 'string' && cellVal.startsWith('data:image')
												? <img src={cellVal} alt="signature" style={{ maxHeight: 40, maxWidth: '100%' }} />
												: <span className="text-black/20 text-xs italic">—</span>
											}
										</div>
									);
								}
								return (
									<div key={col.id} className="px-3 py-2" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
										{ formatCellValue(cellVal) }
									</div>
								);
							})
						:
							<div className="px-3 py-2 w-full"> { JSON.stringify(row) } </div>
						}
					</div>
				))
			: [1, 2].map(i => (
					<div key={i} className={`flex text-black/30 italic ${block.settings.borderStyle !== "none" ? "border-b border-black/6 last:border-0" : ""} ${block.settings.alternatingRows && i % 2 === 0 ? "bg-black/2" : ""}`}>
						{ hasColumns ? displayCols.map(col => (
								<div key={col.id} className="px-3 py-2" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
									—
								</div>
							))
						:
							<div className="px-3 py-2 w-full">No data</div>
						}
					</div>
				))
			}
		</div>
	);
};

export const SignaturePreview = ({ block, fieldValues, tokens }: { block: ExportBlock; fieldValues: FieldValueMap; tokens: AvailableToken[]; }): ReactElement => {
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

export const FormGridPreview = ({ block, fieldValues, tokens }: { block: ExportBlock; fieldValues: FieldValueMap; tokens: AvailableToken[]; }): ReactElement => {
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

export const FieldGridPreview = ({ block, fieldValues, tokens }: { block: ExportBlock; fieldValues: FieldValueMap; tokens: AvailableToken[]; }): ReactElement => {
	const entries: FieldGridEntry[] = block.settings.gridEntries ?? [];
	const columns: number = block.settings.gridColumns ?? 2;
	const showBorders: boolean = block.settings.gridShowBorders ?? true;
	const borderColor: string = block.settings.gridBorderColor ?? "#e5e7eb";
	const layout: string = block.settings.gridLayout ?? "label-value";
	const labelWidth: number = block.settings.gridLabelWidth ?? 40;
	const valueStyle: string = block.settings.gridValueStyle ?? "underline";
	const compact: boolean = block.settings.gridCompact ?? false;

	const resolveLabel = (entry: FieldGridEntry): string => {
		if ( entry.type === "custom" ) return entry.customLabel ?? "";
		const token = entry.fieldId ? tokens.find(t => t.fieldId === entry.fieldId) : undefined;
		return token?.fieldLabel ?? "";
	};

	const resolveValue = (entry: FieldGridEntry): string => {
		if ( entry.type === "custom" ) return entry.customValue ?? "—";
		if ( !entry.fieldId ) return "";

		const raw = fieldValues.get(entry.fieldId);
		if ( raw === undefined || raw === null || raw === "" ) return "";
		const token = tokens.find(t => t.fieldId === entry.fieldId);
		if ( token && ["CHECKBOX", "RADIO_GROUP", "SELECT"].includes(token.fieldType) ) {
			const opts = token.options ?? [];
			const vals = Array.isArray(raw) ? raw as string[] : [String(raw)];
			return vals.map(v => opts.find(o => o.value === v || o.label === v)?.label ?? v).join(", ");
		}
		if ( token?.fieldType === "BOOLEAN" ) {
			return raw === true || raw === "true" || raw === "Yes" ? "Sí" : "No";
		}
		if ( token?.fieldType === "NUMBER" && token?.suffix ) {
			return `${raw} ${token.suffix}`;
		}
		if ( token?.fieldType === "CURRENCY" ) {
			const num = typeof raw === "number" ? raw : parseFloat(String(raw));
			const formatted = isNaN(num) ? String(raw) : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			return `${formatted} €`;
		}
		if ( token?.fieldType === "PERCENTAGE" ) {
			return `${raw}%`;
		}

		return String(raw);
	};

	const underlineStyle: CSSProperties = { borderBottom: "1px dotted rgba(0,0,0,0.3)", display: "inline-block", minWidth: 40 };
	const boxStyle: CSSProperties = { border: "1px solid rgba(0,0,0,0.15)", padding: "0 4px", display: "inline-block", minWidth: 40 };
	const checkboxBox: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 11, height: 11, border: "1.5px solid rgba(0,0,0,0.5)", borderRadius: 2, flexShrink: 0, verticalAlign: "middle", marginRight: 4 };
	const filledCheckbox: CSSProperties = { ...checkboxBox, backgroundColor: "#059669", borderColor: "#059669", color: "#fff", fontSize: 9, fontWeight: 700, lineHeight: 1 };
	const radioCircle: CSSProperties = { display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(0,0,0,0.5)", borderRadius: "50%", flexShrink: 0, verticalAlign: "middle", marginRight: 4 };
	const filledRadio: CSSProperties = { ...radioCircle, backgroundColor: "#000", borderColor: "#000" };

	const renderCell = (entry: FieldGridEntry): ReactElement => {
		const label = resolveLabel(entry);
		const value = resolveValue(entry);
		const hasValue = value !== "";
		const labelStyle: CSSProperties = { fontWeight: entry.labelBold ? "bold" : "normal", textAlign: entry.labelAlign ?? "left" };
		const cellPad = compact ? "2px 6px" : "4px 8px";

		if ( entry.type === "spacer" ) return <div style={{ minHeight: 16 }} />;

		if ( entry.type === "checkbox" ) {
			const checked = hasValue && (value === "Sí" || value === "true" || value === "Yes");
			return (
				<div style={{ display: "flex", alignItems: "center", gap: 6, padding: cellPad }}>
					<span style={checked ? filledCheckbox : checkboxBox}>{checked ? "✓" : ""}</span>
					<span style={{ fontSize: 11, ...labelStyle }}>{label}</span>
				</div>
			);
		}

		if ( entry.type === "radio" ) {
			const selected = hasValue;

			return (
				<div style={{ display: "flex", alignItems: "center", gap: 6, padding: cellPad }}>
					<span style={selected ? filledRadio : radioCircle} />
					<span style={{ fontSize: 11, ...labelStyle }}>{label}</span>
				</div>
			);
		}

		const valueNode = hasValue ? <span style={{ fontSize: 11 }}>{value}</span>
		: valueStyle === "box"
			? <span style={boxStyle}>&nbsp;</span>
			: <span style={underlineStyle}>&nbsp;</span>;

		if ( layout === "value-only" ) {
			return <div style={{ padding: cellPad }}>{valueNode}</div>;
		}
		if ( layout === "stacked" ) {
			return (
				<div style={{ padding: cellPad }}>
					<div style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", marginBottom: 2, ...labelStyle }}>{label}</div>
					{valueNode}
				</div>
			);
		}
		return (
			<div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: cellPad }}>
				<span style={{ fontSize: 11, color: "rgba(0,0,0,0.6)", flexShrink: 0, width: `${labelWidth}%`, ...labelStyle }}> { label }: </span>
				{ valueNode }
			</div>
		);
	};

	// Build rows respecting colSpan
	const gridCells: (FieldGridEntry | null)[][] = [];
	let currentRow: (FieldGridEntry | null)[] = [];
	let colPos = 0;
	for (const entry of entries) {
		const span = entry.colSpan ?? 1;
		if ( colPos + span > columns && currentRow.length > 0 ) {
			while (currentRow.length < columns) currentRow.push(null);

			gridCells.push(currentRow);
			currentRow = [];
			colPos = 0;
		}
		currentRow.push(entry);
		colPos += span;
		for (let i = 1; i < span && currentRow.length < columns; i++) currentRow.push(null);
		if ( colPos >= columns ) {
			gridCells.push(currentRow);
			currentRow = [];
			colPos = 0;
		}
	}
	if ( currentRow.length > 0 ) {
		while (currentRow.length < columns) currentRow.push(null);
		gridCells.push(currentRow);
	}

	return (
		<div style={{ border: showBorders ? `1px solid ${borderColor}` : "none", overflow: "hidden", fontSize: 11 }}>
			<div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
				{ gridCells.flatMap(row =>
					row.map((cell, ci) => {
						if ( !cell ) return null;
						const span = cell.colSpan ?? 1;

						return (
							<div key={`${cell.id}-${ci}`}
								style={{
									gridColumn: span > 1 ? `span ${span}` : undefined,
									borderBottom: showBorders ? `1px solid ${borderColor}` : undefined,
									borderRight: showBorders ? `1px solid ${borderColor}` : undefined,
								}}
							>
								{ renderCell(cell) }
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export const BlockPreview = ({ block, fieldValues, tokens, extensions }: { block: ExportBlock; fieldValues: FieldValueMap; tokens: AvailableToken[]; extensions: any[]; }): ReactElement | null => {
	switch ( block.type ) {
		case "RICH_TEXT":
			return <RichTextPreview content={block.content} extensions={extensions} />;
		case "TABLE":
			return <TablePreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "FORM_GRID":
			return <FormGridPreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "FIELD_GRID":
			return <FieldGridPreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "SIGNATURE":
			return <SignaturePreview block={block} fieldValues={fieldValues} tokens={tokens} />;
		case "BLANK":
			return null;
		default:
			return null;
	}
};

export const RowPreview = ({ row, fieldValues, tokens, extensions }: { row: ExportRow; fieldValues: FieldValueMap; tokens: AvailableToken[]; extensions: any[]; }): ReactElement => {
	
	return (
		<div className="flex gap-3">
			{ row.cells.map(cell => {
				const s = cell.block.settings;

				if ( cell.block.conditionalFieldId ) {
					const condVal = fieldValues.get(cell.block.conditionalFieldId.toString());
					if ( condVal === undefined || condVal === null || condVal === "" || condVal === false ) {
						return null;
					}
				}

				return (
					<div key={cell.id}
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
