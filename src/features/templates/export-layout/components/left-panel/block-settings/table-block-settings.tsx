import {
    useMemo,
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import {
    TABLE_BORDERS,
    type ExportBlock
} from '../../../export-layout.models';

interface TableBlockSettingsProps {
    block: ExportBlock;
}

const TableBlockSettings = ({ block }: TableBlockSettingsProps): ReactElement => {
    const { state, dispatch } = useExportLayout();

    const boundToken = useMemo(() => state.tokens.find(t => t.fieldId === block.sourceFieldId), [state.tokens, block.sourceFieldId]);

    /** Visible columns resolved the same way as table-block.tsx / preview-mode. */
    const visibleColumns = useMemo(() => {
        const rawCols = boundToken?.columns ?? [];
        if (!rawCols.length) return [];
        if (!block.settings.tableColumns?.length)
            return rawCols.map(c => ({ id: c.id, name: c.name }));
        return block.settings.tableColumns
            .filter(tc => tc.visible)
            .map(tc => {
                const raw = rawCols.find(c => c.id === tc.colId);
                return { id: tc.colId, name: raw?.name ?? tc.label };
            });
    }, [boundToken, block.settings.tableColumns]);

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Border style */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Border Style
                </label>
                <div className="flex flex-col gap-1.5">
                    { TABLE_BORDERS.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`border-${block.id}`}
                                checked={(block.settings.borderStyle ?? 'grid') === value}
                                onChange={() => dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { borderStyle: value } } })}
                                className="accent-amber-500"
                            />
                            <span className="text-sm text-black/60"> { label } </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
                <label className="block text-xs font-[Lato-Regular] text-black/50 uppercase tracking-wide">
                    Options
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={block.settings.hasHeaderRow ?? true}
                        onChange={e => dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { hasHeaderRow: e.target.checked } } })}
                        className="accent-amber-500"
                    />
                    <span className="text-sm text-black/60"> Show table headers </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={block.settings.alternatingRows ?? false}
                        onChange={e => dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { alternatingRows: e.target.checked } } })}
                        className="accent-amber-500"
                    />
                    <span className="text-sm text-black/60"> Alternating row colors </span>
                </label>
            </div>
          
            { !boundToken &&
                <p className="text-[10px] text-black italic"> Bind this block to a TABLE field to configure columns. </p>
            }
            { boundToken && visibleColumns.length === 0 &&
                <p className="text-[10px] text-black/40 italic"> Configure column visibility to enable pre-defined rows. </p>
            }
        </div>
    );
}

export default TableBlockSettings;
