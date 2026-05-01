import {
    useState,
    useCallback,
    type ReactElement
} from 'react';
import {
    Plus,
    Trash2,
    Grid,
    AtSign,
    Type,
    GripVertical,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    v4 as uuidv4
} from 'uuid';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock,
    FieldGridEntry,
    FieldGridEntryType
} from '../../export-layout.models';

interface FieldGridBlockProps {
    block: ExportBlock;
}

const ENTRY_TYPE_OPTIONS: { value: FieldGridEntryType; label: string; Icon: typeof Type }[] = [
    { value: 'field', label: 'Field', Icon: AtSign }
];

/** Single entry row in the editor list */
const EntryEditor = ({
    entry,
    tokens,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: {
    entry: FieldGridEntry;
    tokens: { fieldId: string; fieldLabel: string; fieldType: string; sectionTitle: string; suffix?: string | null }[];
    onUpdate: (patch: Partial<FieldGridEntry>) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}): ReactElement => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-black/10 bg-white rounded-lg overflow-hidden shadow-sm">
            {/* Main row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
                <GripVertical className="w-4 h-4 text-black/25 shrink-0 cursor-grab" />

                {/* Type selector */}
                <select
                    value={entry.type}
                    onChange={e => onUpdate({ type: e.target.value as FieldGridEntryType })}
                    className="text-xs bg-violet-50 border border-violet-200 rounded-md px-2 py-1.5 text-violet-700 font-[Lato-Regular] outline-none cursor-pointer focus:border-violet-400 shrink-0"
                >
                    { ENTRY_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Main content input */}
                <select value={entry.fieldId ?? ''} onChange={e => onUpdate({ fieldId: e.target.value || undefined })}
                    className="flex-1 h-8 text-sm border border-black/12 rounded-md px-2.5 py-1.5 outline-none focus:border-violet-400 min-w-0 text-black/70"
                >
                    <option value="">— Select field —</option>
                    { tokens.map(t => (
                        <option key={t.fieldId} value={t.fieldId}>{t.fieldLabel} ({t.sectionTitle})</option>
                    ))}
                </select>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="p-1.5 rounded-md text-black/25 hover:text-black/60 hover:bg-black/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="p-1.5 rounded-md text-black/25 hover:text-black/60 hover:bg-black/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className={`p-1.5 rounded-md transition-colors ${expanded ? 'text-violet-600 bg-violet-50' : 'text-black/25 hover:text-violet-500 hover:bg-violet-50'}`}
                        title="Options"
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-1.5 rounded-md text-black/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded options */}
            { expanded &&
                <div className="w-full px-4 py-3 border-t border-black/6 bg-black/2 gap-3">
                    <div className='w-full flex items-center justify-around gap-3'>
                        <label className="w-full flex items-center gap-2 cursor-pointer col-span-2">
                            <input
                                type="checkbox"
                                checked={entry.labelBold ?? false}
                                onChange={e => onUpdate({ labelBold: e.target.checked })}
                                className="accent-amber-500 w-4 h-4 shrink-0"
                            />
                            <span className="text-sm text-black/60 font-bold">Bold label</span>
                        </label>

                        <label className="w-full flex flex-col gap-1">
                            <span className="text-xs text-black/50 font-[Lato-Regular]">Colspan</span>
                            <input type="number" min={1} max={8} value={entry.colSpan ?? 1}
                                onChange={e => onUpdate({ colSpan: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) })}
                                className="w-full h-7.5 border border-black/12 rounded-md px-2.5 py-1.5 text-center text-sm focus:border-violet-400 outline-none"
                            />
                        </label>

                        <label className="w-full flex flex-col gap-1">
                            <span className="text-xs text-black/50 font-[Lato-Regular]">Label align</span>
                            <select value={entry.labelAlign ?? 'left'}
                                onChange={e => onUpdate({ labelAlign: e.target.value as 'left' | 'center' | 'right' })}
                                className="w-full h-7.5 border border-black/12 rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-violet-400"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </label>
                    </div>
                </div>
            }
        </div>
    );
};

/** Render a single entry cell in the grid preview */
const EntryPreviewCell = ({
    entry,
    tokens,
    layout,
    labelWidth,
    valueStyle,
    compact,
}: {
    entry: FieldGridEntry;
    tokens: { fieldId: string; fieldLabel: string; fieldType: string; suffix?: string | null }[];
    layout: string;
    labelWidth: number;
    valueStyle: string;
    compact: boolean;
}): ReactElement => {
    const field = entry.fieldId ? tokens.find(t => t.fieldId === entry.fieldId) : undefined;
    const numberSuffix = field?.fieldType === 'NUMBER' && field?.suffix ? field.suffix : null;

    const label = entry.type === 'custom'
        ? entry.customLabel ?? ''
        : field?.fieldLabel ?? '';

    const labelStyle: React.CSSProperties = {
        fontWeight: entry.labelBold ? 'bold' : 'normal',
        textAlign: entry.labelAlign ?? 'left',
    };

    const valueDecoration = valueStyle === 'underline'
        ? 'border-b border-black/20'
        : valueStyle === 'box'
            ? 'border border-black/15 rounded px-1'
            : '';

    const fieldValue = entry.type === 'custom'
        ? (entry.customValue || '—')
        : numberSuffix
            ? <span className="inline-flex items-baseline gap-1">________________<span className="text-black/30 text-[10px]">{numberSuffix}</span></span>
            : '________________';

    if (layout === 'value-only') {
        return (
            <div className={compact ? 'py-0.5' : 'py-1'}>
                <span className={`text-xs text-black/40 inline-block min-w-12 ${valueDecoration}`}>
                    {fieldValue}
                </span>
            </div>
        );
    }

    if (layout === 'stacked') {
        return (
            <div className={compact ? 'py-0.5' : 'py-1'}>
                <div className="text-[10px] text-black/50 mb-0.5" style={labelStyle}>{label}</div>
                <div className={`text-xs text-black/40 ${valueDecoration}`}>
                    {fieldValue}
                </div>
            </div>
        );
    }

    // Default: label-value inline
    return (
        <div className={`flex items-baseline gap-2 ${compact ? 'py-0.5' : 'py-1'}`}>
            <span className="text-xs text-black/60 shrink-0" style={{ ...labelStyle, width: `${labelWidth}%` }}>
                {label}:
            </span>
            <span className={`text-xs text-black/40 flex-1 ${valueDecoration}`}>
                {fieldValue}
            </span>
        </div>
    );
};

const FieldGridBlock = ({ block }: FieldGridBlockProps): ReactElement => {
    const { state, dispatch } = useExportLayout();

    const entries = block.settings.gridEntries ?? [];
    const columns = block.settings.gridColumns ?? 2;
    const labelWidth = block.settings.gridLabelWidth ?? 40;
    const showBorders = block.settings.gridShowBorders ?? true;
    const borderColor = block.settings.gridBorderColor ?? '#e5e7eb';
    const layout = block.settings.gridLayout ?? 'label-value';
    const valueStyle = block.settings.gridValueStyle ?? 'underline';
    const compact = block.settings.gridCompact ?? false;

    const updateEntries = useCallback((newEntries: FieldGridEntry[]) => {
        dispatch({
            type: 'UPDATE_BLOCK_SETTINGS',
            payload: { blockId: block.id, settings: { gridEntries: newEntries } },
        });
    }, [dispatch, block.id]);

    const addEntry = useCallback((type: FieldGridEntryType = 'field') => {
        updateEntries([...entries, { id: uuidv4(), type }]);
    }, [entries, updateEntries]);

    const removeEntry = useCallback((id: string) => {
        updateEntries(entries.filter(e => e.id !== id));
    }, [entries, updateEntries]);

    const updateEntry = useCallback((id: string, patch: Partial<FieldGridEntry>) => {
        updateEntries(entries.map(e => e.id === id ? { ...e, ...patch } : e));
    }, [entries, updateEntries]);

    const moveEntry = useCallback((id: string, direction: -1 | 1) => {
        const idx = entries.findIndex(e => e.id === id);
        if (idx === -1) return;
        const target = idx + direction;
        if (target < 0 || target >= entries.length) return;
        const newEntries = [...entries];
        [newEntries[idx], newEntries[target]] = [newEntries[target], newEntries[idx]];
        updateEntries(newEntries);
    }, [entries, updateEntries]);

    // Build grid cells for preview
    const gridCells: (FieldGridEntry | null)[][] = [];
    let currentRow: (FieldGridEntry | null)[] = [];
    let colPos = 0;
    for (const entry of entries) {
        const span = entry.colSpan ?? 1;
        if (colPos + span > columns && currentRow.length > 0) {
            // Fill remaining cells
            while (currentRow.length < columns) currentRow.push(null);
            gridCells.push(currentRow);
            currentRow = [];
            colPos = 0;
        }
        currentRow.push(entry);
        colPos += span;
        // Fill spanned placeholders
        for (let i = 1; i < span && currentRow.length < columns; i++) {
            currentRow.push(null);
        }
        if (colPos >= columns) {
            gridCells.push(currentRow);
            currentRow = [];
            colPos = 0;
        }
    }
    if (currentRow.length > 0) {
        while (currentRow.length < columns) currentRow.push(null);
        gridCells.push(currentRow);
    }

    return (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                        <Grid className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-sm font-[Lato-Regular] text-violet-700">
                        Field Grid
                        <span className="text-violet-400 text-xs ml-2">
                            {entries.length} entries · {columns} col{columns !== 1 ? 's' : ''}
                        </span>
                    </span>
                </div>
                <button onClick={() => addEntry('field')}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-violet-600 hover:bg-violet-100 rounded-md transition-colors"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>

            {/* Grid preview */}
            { entries.length > 0 &&
                <div className="mb-3 rounded-lg overflow-hidden"
                    style={{ border: showBorders ? `1px solid ${borderColor}` : 'none' }}
                >
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                        { gridCells.flatMap((row) =>
                            row.map((cell, ci) => {
                                if (!cell) return null;
                                // Skip placeholder cells for colspan
                                if (ci > 0 && row[ci - 1] === null) return null;

                                const span = cell.colSpan ?? 1;
                                return (
                                    <div key={cell.id}
                                        className={showBorders ? 'border-b border-r last:border-r-0' : ''}
                                        style={{
                                            gridColumn: `span ${span}`,
                                            borderColor,
                                            padding: compact ? '2px 6px' : '4px 8px',
                                        }}
                                    >
                                        <EntryPreviewCell
                                            entry={cell}
                                            tokens={state.tokens}
                                            layout={layout}
                                            labelWidth={labelWidth}
                                            valueStyle={valueStyle}
                                            compact={compact}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            }

            {/* Entry editor list */}
            <div className="flex flex-col gap-1.5">
                { entries.map((entry, i) => (
                    <EntryEditor
                        key={entry.id}
                        entry={entry}
                        tokens={state.tokens}
                        onUpdate={patch => updateEntry(entry.id, patch)}
                        onRemove={() => removeEntry(entry.id)}
                        onMoveUp={() => moveEntry(entry.id, -1)}
                        onMoveDown={() => moveEntry(entry.id, 1)}
                        isFirst={i === 0}
                        isLast={i === entries.length - 1}
                    />
                ))}
            </div>

            { entries.length === 0 &&
                <p className="text-xs text-violet-400 italic text-center py-3">
                    No entries yet. Click "Add" to add fields to the grid.
                </p>
            }

            {/* Quick-add row */}
            <div className="mt-2 flex items-center gap-1.5 justify-center">
                { ENTRY_TYPE_OPTIONS.map(({ value, label, Icon }) => (
                    <button key={value}
                        onClick={() => addEntry(value)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-violet-400 hover:text-violet-600 hover:bg-violet-100 rounded-md transition-colors"
                        title={`Add ${label}`}
                    >
                        <Icon className="w-3 h-3" />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FieldGridBlock;
