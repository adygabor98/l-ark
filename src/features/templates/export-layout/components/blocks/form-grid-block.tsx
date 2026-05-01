import {
    useState,
    useCallback,
    type ReactElement
} from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    Type,
    AtSign,
    CheckSquare,
    Columns,
    Rows
} from 'lucide-react';
import {
    v4 as uuidv4
} from 'uuid';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock,
    FormGridCell,
    FormGridRow,
    FormGridCellContent
} from '../../export-layout.models';

interface FormGridBlockProps {
    block: ExportBlock;
}

/** Create a fresh empty cell */
const makeCell = (overrides?: Partial<FormGridCell>): FormGridCell => ({
    id: uuidv4(),
    contentType: 'empty',
    ...overrides,
});

/** Content type icon + label map */
const CONTENT_TYPES: { value: FormGridCellContent; label: string; Icon: typeof Type }[] = [
    { value: 'label', label: 'Label', Icon: Type },
    { value: 'field', label: 'Field', Icon: AtSign },
    { value: 'empty', label: 'Empty', Icon: GripVertical },
];

/** Inline cell editor — shown when a cell is selected */
const CellEditor = ({ cell, tokens, onUpdate }: {
    cell: FormGridCell;
    tokens: { fieldId: string; fieldLabel: string; fieldType: string; sectionTitle: string }[];
    onUpdate: (patch: Partial<FormGridCell>) => void;
}): ReactElement => {
    return (
        <div className="flex flex-col gap-2 p-2 bg-white border border-amber-200 rounded-lg shadow-lg min-w-56 text-xs"
            onClick={e => e.stopPropagation()}
        >
            {/* Content type selector */}
            <div className="flex gap-1">
                { CONTENT_TYPES.map(({ value, label, Icon }) => (
                    <button key={value}
                        onClick={() => onUpdate({ contentType: value })}
                        className={`flex h-7.5 text-md items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                            cell.contentType === value
                                ? 'bg-amber-100 text-amber-700 font-medium'
                                : 'text-black/50 hover:bg-black/4'
                        }`}
                    >
                        <Icon className="w-3 h-3" />
                        { label }
                    </button>
                ))}
            </div>

            {/* Label input */}
            { cell.contentType === 'label' &&
                <input
                    value={cell.label ?? ''}
                    onChange={e => onUpdate({ label: e.target.value })}
                    placeholder="Enter label text…"
                    className="h-10 border border-black/10 rounded-md px-2 py-1 text-xs outline-none focus:border-amber-400"
                    autoFocus
                />
            }

            {/* Field selector */}
            { cell.contentType === 'field' &&
                <select
                    value={cell.fieldId ?? ''}
                    onChange={e => onUpdate({ fieldId: e.target.value || undefined })}
                    className="h-10 border border-black/10 rounded-md px-2 py-1 text-xs outline-none focus:border-amber-400"
                >
                    <option value=""> Select a form field </option>
                    { tokens.map(t => (
                        <option key={t.fieldId} value={t.fieldId}>
                            {t.fieldLabel} ({t.sectionTitle})
                        </option>
                    )) }
                </select>
            }

            {/* Styling row */}
            <div className="w-full flex items-center gap-10 border-t border-black/6 pt-2">
                <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={cell.fontWeight === 'bold'}
                        onChange={e => onUpdate({ fontWeight: e.target.checked ? 'bold' : 'normal' })}
                        className="accent-amber-500"
                    />
                    <span className="font-bold text-lg"> Bold </span>
                </label>

                <select
                    value={cell.textAlign ?? 'left'}
                    onChange={e => onUpdate({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
                    className="h-7.5 border border-black/10 rounded px-1 py-0.5 text-[10px]"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>

                <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={cell.verticalText ?? false}
                        onChange={e => onUpdate({ verticalText: e.target.checked })}
                        className="accent-amber-500"
                    />
                    <span className="text-lg text-black/50">Vertical</span>
                </label>
            </div>

            {/* Span controls */}
            <div className="flex items-center gap-2 border-t border-black/6 pt-2">
                <label className="flex items-center gap-1 text-[10px] text-black/50">
                    Colspan
                    <input
                        type="number"
                        min={1}
                        max={12}
                        value={cell.colspan ?? 1}
                        onChange={e => onUpdate({ colspan: Math.max(1, Math.min(12, parseInt(e.target.value) || 1)) })}
                        className="h-10 w-20 border border-black/10 rounded px-1 py-0.5 text-center"
                    />
                </label>
                <label className="flex items-center gap-1 text-[10px] text-black/50">
                    Rowspan
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={cell.rowspan ?? 1}
                        onChange={e => onUpdate({ rowspan: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                        className="h-10 w-20 border border-black/10 rounded px-1 py-0.5 text-center"
                    />
                </label>
            </div>
        </div>
    );
};

/** Render cell content in the grid (edit mode) */
const CellContent = ({
    cell,
    tokens,
}: {
    cell: FormGridCell;
    tokens: { fieldId: string; fieldLabel: string; fieldType: string }[];
}): ReactElement => {
    const field = cell.fieldId ? tokens.find(t => t.fieldId === cell.fieldId) : undefined;

    const style: React.CSSProperties = {
        fontWeight: cell.fontWeight ?? 'normal',
        textAlign: cell.textAlign ?? 'left',
        fontSize: cell.fontSize ?? 11,
    };

    if (cell.verticalText) {
        style.writingMode = 'vertical-rl';
        style.textOrientation = 'mixed';
        style.transform = 'rotate(180deg)';
    }

    switch (cell.contentType) {
        case 'label':
            return (
                <span style={style} className="text-black/70 select-none truncate w-full block">
                    { cell.label || <span className="italic text-black/25">Label</span> }
                </span>
            );
        case 'field':
            return (
                <span style={style} className="text-blue-600 select-none truncate w-full block">
                    { field ? `@${field.fieldLabel}` : <span className="italic text-black/25">@field</span> }
                </span>
            );
        case 'checkbox':
            return (
                <span style={style} className="flex items-center gap-1 text-black/50 select-none">
                    <CheckSquare className="w-3 h-3" />
                    { field?.fieldLabel ?? <span className="italic text-black/25">checkbox</span> }
                </span>
            );
        case 'empty':
        default:
            return <span className="text-black/15 text-[10px] select-none">·</span>;
    }
};

const FormGridBlock = ({ block }: FormGridBlockProps): ReactElement => {
    const { state, dispatch } = useExportLayout();
    const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

    const gridRows = block.settings.formGridRows ?? [];
    const columns = block.settings.formGridColumns ?? 4;
    const columnWidths = block.settings.formGridColumnWidths ?? Array.from({ length: columns }, () => 100 / columns);
    const borderColor = block.settings.formGridBorderColor ?? '#d1d5db';
    const borderWidth = block.settings.formGridBorderWidth ?? 1;
    const cellPadding = block.settings.formGridCellPadding ?? 6;
    const outerBorder = block.settings.formGridOuterBorder ?? true;

    const updateGrid = useCallback((rows: FormGridRow[]) => {
        dispatch({
            type: 'UPDATE_BLOCK_SETTINGS',
            payload: {
                blockId: block.id,
                settings: { formGridRows: rows },
            },
        });
    }, [dispatch, block.id]);

    const updateCell = useCallback((rowId: string, cellId: string, patch: Partial<FormGridCell>) => {
        const newRows = gridRows.map(r => {
            if (r.id !== rowId) return r;
            return {
                ...r,
                cells: r.cells.map(c => c.id === cellId ? { ...c, ...patch } : c),
            };
        });
        updateGrid(newRows);
    }, [gridRows, updateGrid]);

    const addRow = useCallback((afterIdx?: number) => {
        const newRow: FormGridRow = {
            id: uuidv4(),
            cells: Array.from({ length: columns }, () => makeCell()),
        };
        const newRows = [...gridRows];
        newRows.splice(afterIdx !== undefined ? afterIdx + 1 : gridRows.length, 0, newRow);
        updateGrid(newRows);
    }, [gridRows, columns, updateGrid]);

    const removeRow = useCallback((rowId: string) => {
        if (gridRows.length <= 1) return;
        updateGrid(gridRows.filter(r => r.id !== rowId));
    }, [gridRows, updateGrid]);

    const addColumn = useCallback(() => {
        const newColCount = columns + 1;
        const newWidths = Array.from({ length: newColCount }, () => 100 / newColCount);
        const newRows = gridRows.map(r => ({
            ...r,
            cells: [...r.cells, makeCell()],
        }));
        dispatch({
            type: 'UPDATE_BLOCK_SETTINGS',
            payload: {
                blockId: block.id,
                settings: {
                    formGridRows: newRows,
                    formGridColumns: newColCount,
                    formGridColumnWidths: newWidths,
                },
            },
        });
    }, [gridRows, columns, dispatch, block.id]);

    const removeColumn = useCallback((colIdx: number) => {
        if (columns <= 1) return;
        const newColCount = columns - 1;
        const newWidths = Array.from({ length: newColCount }, () => 100 / newColCount);
        const newRows = gridRows.map(r => ({
            ...r,
            cells: r.cells.filter((_, i) => i !== colIdx),
        }));
        dispatch({
            type: 'UPDATE_BLOCK_SETTINGS',
            payload: {
                blockId: block.id,
                settings: {
                    formGridRows: newRows,
                    formGridColumns: newColCount,
                    formGridColumnWidths: newWidths,
                },
            },
        });
    }, [gridRows, columns, dispatch, block.id]);

    // Build a set of cells hidden by rowspan/colspan from other cells.
    // Use cell array index (ci) directly as the column position since
    // each row has exactly `columns` cells indexed by column.
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

    const selectedCell = selectedCellId
        ? gridRows.flatMap(r => r.cells).find(c => c.id === selectedCellId)
        : undefined;
    const selectedRowId = selectedCellId
        ? gridRows.find(r => r.cells.some(c => c.id === selectedCellId))?.id
        : undefined;

    return (
        <div className="bg-emerald-50 border border-emerald-200 p-4"
            onClick={() => setSelectedCellId(null)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Columns className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-[Lato-Regular] text-emerald-700">
                        Form Grid
                        <span className="text-emerald-400 text-xs ml-2">
                            {gridRows.length}×{columns}
                        </span>
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); addRow(); }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                        title="Add row"
                    >
                        <Rows className="w-3 h-3" />
                        <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); addColumn(); }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                        title="Add column"
                    >
                        <Columns className="w-3 h-3" />
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Grid table */}
            <div className="overflow-x-auto">
                <table
                    className="w-full border-collapse"
                    style={{
                        tableLayout: 'fixed',
                        border: outerBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
                    }}
                >
                    {/* Column width hints via colgroup */}
                    <colgroup>
                        { columnWidths.map((w, i) => (
                            <col key={i} style={{ width: `${w}%` }} />
                        ))}
                    </colgroup>

                    <tbody>
                        { gridRows.map((row, ri) => (
                            <tr key={row.id} className="group/row">
                                { row.cells.map((cell, ci) => {
                                    if (hiddenCells.has(cell.id)) return null;

                                    const isSelected = cell.id === selectedCellId;
                                    const cs = cell.colspan ?? 1;
                                    const rs = cell.rowspan ?? 1;

                                    return (
                                        <td key={cell.id}
                                            colSpan={cs > 1 ? cs : undefined}
                                            rowSpan={rs > 1 ? rs : undefined}
                                            className={`relative transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-amber-50 ring-2 ring-amber-400 ring-inset z-10'
                                                    : 'hover:bg-emerald-100/50'
                                            }`}
                                            style={{
                                                border: `${borderWidth}px solid ${borderColor}`,
                                                padding: cellPadding,
                                                backgroundColor: cell.backgroundColor || undefined,
                                                verticalAlign: 'middle',
                                            }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedCellId(isSelected ? null : cell.id);
                                            }}
                                        >
                                            <CellContent cell={cell} tokens={state.tokens} />

                                            {/* Spanning badge */}
                                            { (cs > 1 || rs > 1) &&
                                                <span className="absolute top-0.5 right-0.5 text-[8px] text-emerald-400 bg-emerald-50 px-1 rounded">
                                                    {cs}×{rs}
                                                </span>
                                            }
                                        </td>
                                    );
                                })}

                                {/* Row actions */}
                                <td className="w-6 border-0 p-0 align-middle">
                                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex flex-col items-center">
                                        <button onClick={(e) => { e.stopPropagation(); addRow(ri); }}
                                            className="text-emerald-400 hover:text-emerald-600 p-0.5"
                                            title="Insert row below"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        { gridRows.length > 1 &&
                                            <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
                                                className="text-red-300 hover:text-red-500 p-0.5"
                                                title="Delete row"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        }
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Column delete row */}
                        { columns > 1 &&
                            <tr>
                                { Array.from({ length: columns }, (_, ci) => (
                                    <td key={ci} className="border-0 p-0 text-center">
                                        <button onClick={(e) => { e.stopPropagation(); removeColumn(ci); }}
                                            className="text-red-200 hover:text-red-500 p-0.5 transition-colors"
                                            title={`Delete column ${ci + 1}`}
                                        >
                                            <Trash2 className="w-2.5 h-2.5 mx-auto" />
                                        </button>
                                    </td>
                                ))}
                                <td className="border-0" />
                            </tr>
                        }
                    </tbody>
                </table>
            </div>

            {/* Cell editor popover */}
            { selectedCell && selectedRowId &&
                <div className="mt-3">
                    <CellEditor
                        cell={selectedCell}
                        tokens={state.tokens}
                        onUpdate={patch => updateCell(selectedRowId, selectedCell.id, patch)}
                    />
                </div>
            }
        </div>
    );
};

export default FormGridBlock;
