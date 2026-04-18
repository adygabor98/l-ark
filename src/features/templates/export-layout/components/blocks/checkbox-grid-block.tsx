import {
    useCallback,
    type ReactElement
} from 'react';
import {
    Plus,
    Trash2,
    CheckSquare,
    Circle,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import {
    v4 as uuidv4
} from 'uuid';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock,
    CheckboxGridItem
} from '../../export-layout.models';

interface CheckboxGridBlockProps {
    block: ExportBlock;
}

const CheckboxGridBlock = ({ block }: CheckboxGridBlockProps): ReactElement => {
    const { state, dispatch } = useExportLayout();

    const items = block.settings.checkboxItems ?? [];
    const columns = block.settings.checkboxColumns ?? 4;
    const showBorders = block.settings.checkboxShowBorders ?? true;
    const borderColor = block.settings.checkboxBorderColor ?? '#e5e7eb';
    const compact = block.settings.checkboxCompact ?? false;
    const style = block.settings.checkboxStyle ?? 'checkbox';
    const title = block.settings.checkboxTitle ?? '';
    const showTitle = block.settings.checkboxShowTitle ?? false;

    const checkboxFields = state.tokens.filter(t =>
        ['BOOLEAN', 'CHECKBOX', 'RADIO_GROUP'].includes(t.fieldType)
    );

    const updateItems = useCallback((newItems: CheckboxGridItem[]) => {
        dispatch({
            type: 'UPDATE_BLOCK_SETTINGS',
            payload: { blockId: block.id, settings: { checkboxItems: newItems } },
        });
    }, [dispatch, block.id]);

    const addItem = useCallback(() => {
        updateItems([...items, { id: uuidv4() }]);
    }, [items, updateItems]);

    const removeItem = useCallback((id: string) => {
        updateItems(items.filter(i => i.id !== id));
    }, [items, updateItems]);

    const updateItem = useCallback((id: string, patch: Partial<CheckboxGridItem>) => {
        updateItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
    }, [items, updateItems]);

    const moveItem = useCallback((id: string, dir: -1 | 1) => {
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return;
        const target = idx + dir;
        if (target < 0 || target >= items.length) return;
        const newItems = [...items];
        [newItems[idx], newItems[target]] = [newItems[target], newItems[idx]];
        updateItems(newItems);
    }, [items, updateItems]);

    // Resolve label for an item
    const getLabel = (item: CheckboxGridItem): string => {
        if (item.customLabel) return item.customLabel;
        if (item.fieldId) {
            const t = state.tokens.find(tk => tk.fieldId === item.fieldId);
            return t?.fieldLabel ?? '';
        }
        return '';
    };

    const isRadio = (item: CheckboxGridItem): boolean => {
        if (style === 'radio') return true;
        if (style === 'checkbox') return false;
        return item.isRadio ?? false;
    };

    return (
        <div className="bg-orange-50 border border-orange-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-[Lato-Regular] text-orange-700">
                        Checkbox Grid
                        <span className="text-orange-400 text-xs ml-2">
                            {items.length} items · {columns} col{columns !== 1 ? 's' : ''}
                        </span>
                    </span>
                </div>
                <button onClick={addItem}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>

            {/* Grid preview */}
            { items.length > 0 &&
                <div className="mb-3 rounded-lg overflow-hidden"
                    style={{ border: showBorders ? `1px solid ${borderColor}` : 'none' }}
                >
                    { showTitle && title &&
                        <div className="px-3 py-1.5 text-xs font-[Lato-Regular] text-orange-700 bg-orange-100/50"
                            style={{ borderBottom: showBorders ? `1px solid ${borderColor}` : 'none' }}
                        >
                            {title}
                        </div>
                    }
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                        { items.map(item => {
                            const label = getLabel(item);
                            const radio = isRadio(item);
                            return (
                                <div key={item.id}
                                    className={showBorders ? 'border-b border-r last:border-r-0' : ''}
                                    style={{
                                        borderColor,
                                        padding: compact ? '3px 6px' : '5px 8px',
                                    }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        { radio
                                            ? <span className="inline-block w-3 h-3 border border-black/30 rounded-full shrink-0" />
                                            : <span className="inline-block w-3 h-3 border border-black/30 rounded-sm shrink-0" />
                                        }
                                        <span className="text-xs text-black/60 truncate">
                                            { label || <span className="italic text-black/25">—</span> }
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            }

            {/* Item editor list */}
            <div className="flex flex-col gap-1">
                { items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-1.5 bg-white border border-black/8 rounded-lg px-2 py-1">
                        {/* Icon */}
                        { isRadio(item)
                            ? <Circle className="w-3 h-3 text-orange-400 shrink-0" />
                            : <CheckSquare className="w-3 h-3 text-orange-400 shrink-0" />
                        }

                        {/* Field selector or custom label */}
                        <select
                            value={item.fieldId ?? '__custom__'}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '__custom__') {
                                    updateItem(item.id, { fieldId: undefined });
                                } else {
                                    const tk = state.tokens.find(t => t.fieldId === val);
                                    updateItem(item.id, { fieldId: val, customLabel: tk?.fieldLabel });
                                }
                            }}
                            className="flex-1 text-xs border border-black/10 rounded px-1.5 py-0.5 outline-none focus:border-orange-400 min-w-0"
                        >
                            <option value="__custom__">Custom label</option>
                            { checkboxFields.map(f => (
                                <option key={f.fieldId} value={f.fieldId}>{f.fieldLabel} ({f.sectionTitle})</option>
                            ))}
                        </select>

                        {/* Custom label input (when no field bound) */}
                        { !item.fieldId &&
                            <input
                                value={item.customLabel ?? ''}
                                onChange={e => updateItem(item.id, { customLabel: e.target.value })}
                                placeholder="Label"
                                className="w-20 text-xs border border-black/10 rounded px-1.5 py-0.5 outline-none focus:border-orange-400"
                            />
                        }

                        {/* Mixed mode: toggle radio/checkbox per item */}
                        { style === 'mixed' &&
                            <button
                                onClick={() => updateItem(item.id, { isRadio: !item.isRadio })}
                                className="text-[10px] text-orange-400 hover:text-orange-600 px-1"
                                title={item.isRadio ? 'Switch to checkbox' : 'Switch to radio'}
                            >
                                { item.isRadio ? '○' : '☐' }
                            </button>
                        }

                        {/* Move / delete */}
                        <div className="flex items-center gap-0.5 shrink-0">
                            { i > 0 &&
                                <button onClick={() => moveItem(item.id, -1)} className="text-black/20 hover:text-black/50 p-0.5">
                                    <ChevronUp className="w-3 h-3" />
                                </button>
                            }
                            { i < items.length - 1 &&
                                <button onClick={() => moveItem(item.id, 1)} className="text-black/20 hover:text-black/50 p-0.5">
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                            }
                            <button onClick={() => removeItem(item.id)} className="text-red-200 hover:text-red-500 p-0.5">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            { items.length === 0 &&
                <p className="text-xs text-orange-400 italic text-center py-3">
                    No items yet. Click "Add" to add checkboxes.
                </p>
            }
        </div>
    );
};

export default CheckboxGridBlock;
