import {
    useMemo,
    type ReactElement
} from 'react';
import {
    Table
} from 'lucide-react';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock,
    FieldColumn,
    TableColumnConfig
} from '../../export-layout.models';

interface TableBlockProps {
    block: ExportBlock;
}

/** Returns visible columns in configured order, falling back to all columns equally */
const resolveVisibleColumns = (rawColumns: FieldColumn[] | undefined, tableColumns: TableColumnConfig[] | undefined): { id: string; name: string; widthPct?: number }[] => {
    if (!rawColumns?.length) return [];

    if (!tableColumns?.length) return rawColumns.map(c => ({ id: c.id, name: c.name }));

    return tableColumns
        .filter(tc => tc.visible)
        .map(tc => {
            const raw = rawColumns.find(c => c.id === tc.colId);
            return { id: tc.colId, name: raw?.name ?? tc.label, widthPct: tc.widthPct };
        });
}

const TableBlock = ({ block }: TableBlockProps): ReactElement => {
    const { state, dispatch } = useExportLayout();

    const tableFields = state.tokens.filter(t => t.fieldType === 'TABLE');
    const boundField = state.tokens.find(t => t.fieldId === block.sourceFieldId);
    const rawColumns = boundField?.columns;

    const visibleColumns = useMemo(() => resolveVisibleColumns(rawColumns, block.settings.tableColumns), [rawColumns, block.settings.tableColumns]);
    const hasColumns = visibleColumns.length > 0;

    const handleFieldChange = (fieldId: string) => {
        dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { sourceFieldId: fieldId } } });
    };

    return (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Table className="w-4 h-4 text-sky-600" />
                </div>
                <span className="text-sm font-[Lato-Regular] text-sky-700"> Table Block </span>
            </div>

            <label className="block text-xs text-sky-600 mb-1"> Bound TABLE field </label>
            <select
                value={block.sourceFieldId ?? ''}
                onChange={e => handleFieldChange(e.target.value)}
                className="w-full text-sm border border-sky-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-sky-400"
            >
                <option value=""> — Select a TABLE field — </option>
                { tableFields.map(f => <option key={f.fieldId} value={f.fieldId}>{f.fieldLabel} ({f.sectionTitle})</option> )}
            </select>

            { boundField &&
                <div className="mt-3 border border-sky-200 rounded-lg overflow-hidden">
                    { hasColumns ?
                        <>
                            {/* Column header row */}
                            <div className="flex bg-sky-100 border-b border-sky-200">
                                { visibleColumns.map(col => (
                                    <div key={col.id} className="px-3 py-1.5 text-xs font-semibold text-sky-700" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
                                        { col.name }
                                    </div>
                                ))}
                            </div>
                            {/* Sample data rows */}
                            { [1, 2].map(i => (
                                <div key={i} className="flex border-b border-sky-100 last:border-0">
                                    { visibleColumns.map(col => (
                                        <div key={col.id} className="px-3 py-1.5 text-xs text-sky-400 italic" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
                                            { col.name } { i }
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    :
                        <>
                            <div className="bg-sky-100 px-3 py-1.5 text-xs font-[Lato-Regular] text-sky-700">
                                { boundField.fieldLabel } — Dynamic rows
                            </div>
                            <div className="px-3 py-2 text-xs text-sky-500 italic">
                                Table rows will be populated at export time from the form submission.
                            </div>
                        </>
                    }
                </div>
            }

            { tableFields.length === 0 &&
                <p className="text-xs text-sky-500 mt-2">
                    No TABLE fields in this template. Add a TABLE field in the builder.
                </p>
            }
        </div>
    );
}

export default TableBlock;