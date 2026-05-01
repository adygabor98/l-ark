import {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactElement,
    type ReactNode,
    type Dispatch,
    type MutableRefObject,
} from 'react';
import {
    setRenderIntent as setModuleRenderIntent,
    type RenderIntent,
} from './utils/render-intent';
import { stripLayoutIssues, reconcileLayoutAgainstTokens } from './utils/layout-reconciliation';
import {
    v4 as uuidv4
} from 'uuid';
import type {
    ExportBlock,
    ExportBlockSettings,
    ExportCell,
    ExportRow,
    ExportPageConfig,
    PageSlice,
    BlockType,
    AvailableToken,
    ExportLayoutRouteState,
    FormGridRow,
    FormGridCell,
    FieldGridEntry,
} from './export-layout.models';

// State

export interface BlockIndexEntry {
    rowIdx: number;
    cellIdx: number;
}

export interface ExportLayoutState {
    rows: ExportRow[];
    blockIndex: Map<string, BlockIndexEntry>;
    pageConfig: ExportPageConfig;
    selectedBlockId: string | null;
    viewMode: 'edit' | 'preview';
    activeEditorInsertFn: ((fieldId: string, fieldLabel: string, fieldType: string, options?: string, suffix?: string | null) => void) | null;
    tokens: AvailableToken[];
    templateId: string;
    templateName?: string;
    versionId?: string;
    isLoading: boolean;
    isDirty: boolean;
}

const DEFAULT_PAGE_CONFIG: ExportPageConfig = {
    pageSize: 'A4',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    watermark: '',
    watermarkColor: '#000000',
    watermarkOpacity: 0.08,
    showHeader: false,
    headerContent: { type: 'doc', content: [{ type: 'paragraph' }] },
    showFooter: false,
    footerContent: { type: 'doc', content: [{ type: 'paragraph' }] },
    pageNumberPosition: 'none',
    showLogo: false,
    logoWidth: 40,
    logoUrl: undefined,
    showSidebar: false,
    sidebarPosition: 'left',
    sidebarWidth: 8,
    sidebarColor: '#1a1a2e',
    sidebarText: '',
    sidebarTextColor: '#ffffff',
    sidebarFontSize: 14,
};

// Helpers

/** Build a Map<blockId, { rowIdx, cellIdx }> for O(1) block lookups. */
export function buildBlockIndex(rows: ExportRow[]): Map<string, BlockIndexEntry> {
    const index = new Map<string, BlockIndexEntry>();
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        for (let cellIdx = 0; cellIdx < row.cells.length; cellIdx++) {
            index.set(row.cells[cellIdx].block.id, { rowIdx, cellIdx });
        }
    }
    return index;
}

/** O(1) block lookup using the pre-built index. Falls back to linear scan when index is stale. */
export function findBlockInRows(rows: ExportRow[], blockId: string, index?: Map<string, BlockIndexEntry>): ExportBlock | undefined {
    if (index) {
        const entry = index.get(blockId);
        if (entry) return rows[entry.rowIdx]?.cells[entry.cellIdx]?.block;
    }
    for (const row of rows) {
        const cell = row.cells.find(c => c.block.id === blockId);
        if (cell) return cell.block;
    }
    return undefined;
}

/** O(1) row lookup using the pre-built index. */
export function findRowOfBlock(rows: ExportRow[], blockId: string, index?: Map<string, BlockIndexEntry>): ExportRow | undefined {
    if (index) {
        const entry = index.get(blockId);
        if (entry) return rows[entry.rowIdx];
    }
    return rows.find(row => row.cells.some(c => c.block.id === blockId));
}

function updateBlockInRows(rows: ExportRow[], blockId: string, updater: (b: ExportBlock) => ExportBlock): ExportRow[] {
    return rows.map(row => ({
        ...row,
        cells: row.cells.map(cell =>
            cell.block.id === blockId ? { ...cell, block: updater(cell.block) } : cell
        ),
    }));
}

/** Deep-clone a row generating fresh UUIDs for the row, all cells, and all blocks. */
function cloneRow(row: ExportRow): ExportRow {
    return {
        id: uuidv4(),
        cells: row.cells.map(cell => ({
            id: uuidv4(),
            width: cell.width,
            block: {
                ...cell.block,
                id: uuidv4(),
                content: cell.block.content ? JSON.parse(JSON.stringify(cell.block.content)) : undefined,
                settings: { ...cell.block.settings },
            },
        })),
    };
}

// Actions

type Action =
    | { type: 'ADD_ROW'; payload: { blockType: BlockType; afterRowId?: string } }
    | { type: 'REMOVE_BLOCK'; payload: { blockId: string } }
    | { type: 'REMOVE_ROW'; payload: { rowId: string } }
    | { type: 'UPDATE_BLOCK'; payload: { blockId: string; updates: Partial<ExportBlock> } }
    | { type: 'UPDATE_BLOCK_SETTINGS'; payload: { blockId: string; settings: Partial<ExportBlockSettings> } }
    | { type: 'SPLIT_ROW'; payload: { blockId: string; targetColumns: number } }
    | { type: 'REPLACE_BLOCK_IN_CELL'; payload: { blockId: string; newBlockType: BlockType } }
    | { type: 'UPDATE_CELL_WIDTHS'; payload: { rowId: string; widths: number[] } }
    | { type: 'REORDER_ROWS'; payload: { newOrder: string[] } }
    | { type: 'DUPLICATE_ROW'; payload: { rowId: string } }
    | { type: 'SELECT_BLOCK'; payload: { id: string | null } }
    | { type: 'UPDATE_PAGE_CONFIG'; payload: Partial<ExportPageConfig> }
    | { type: 'SET_VIEW_MODE'; payload: 'edit' | 'preview' }
    | { type: 'SET_ACTIVE_INSERT_FN'; payload: ((fieldId: string, fieldLabel: string, fieldType: string, options?: string, suffix?: string | null) => void) | null }
    | { type: 'LOAD_LAYOUT'; payload: { rows: ExportRow[]; pageConfig: ExportPageConfig } }
    | { type: 'MOVE_BLOCK'; payload: { fromCellId: string; toCellId: string } }
    | { type: 'MARK_CLEAN' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'ADD_TWO_COLUMN_ROW' }
    | { type: 'CLEAN_ORPHANS' }

// Block factory

/** Create a default 3-row × 4-col form grid for new FORM_GRID blocks. */
function createDefaultFormGrid(): { rows: FormGridRow[]; columns: number; columnWidths: number[] } {
    const columns = 4;
    const columnWidths = Array.from({ length: columns }, () => 100 / columns);

    const makeCell = (overrides?: Partial<FormGridCell>): FormGridCell => ({
        id: uuidv4(),
        contentType: 'empty',
        ...overrides,
    });

    const rows: FormGridRow[] = Array.from({ length: 3 }, () => ({
        id: uuidv4(),
        cells: Array.from({ length: columns }, () => makeCell()),
    }));

    // Default first row first cell to a label
    rows[0].cells[0] = makeCell({ contentType: 'label', label: 'Label', fontWeight: 'bold' });

    return { rows, columns, columnWidths };
}

export function createBlock(blockType: BlockType): ExportBlock {
    if (blockType === 'FIELD_GRID') {
        const defaultEntries: FieldGridEntry[] = [
            { id: uuidv4(), type: 'field' },
            { id: uuidv4(), type: 'field' },
        ];
        return {
            id: uuidv4(),
            type: 'FIELD_GRID',
            settings: {
                gridColumns: 2,
                gridEntries: defaultEntries,
                gridLabelWidth: 40,
                gridShowBorders: true,
                gridBorderColor: '#e5e7eb',
                gridLayout: 'label-value',
                gridLabelAlign: 'left',
                gridValueAlign: 'left',
                gridValueStyle: 'underline',
                gridCompact: false,
            },
        };
    }

    if (blockType === 'FORM_GRID') {
        const grid = createDefaultFormGrid();
        return {
            id: uuidv4(),
            type: 'FORM_GRID',
            settings: {
                formGridRows: grid.rows,
                formGridColumns: grid.columns,
                formGridColumnWidths: grid.columnWidths,
                formGridBorderColor: '#d1d5db',
                formGridBorderWidth: 1,
                formGridCellPadding: 6,
                formGridOuterBorder: true,
            },
        };
    }

    return {
        id: uuidv4(),
        type: blockType,
        content: blockType === 'RICH_TEXT'
            ? { type: 'doc', content: [{ type: 'paragraph' }] }
            : undefined,
        settings: {},
    };
}

function createRow(blockType: BlockType): ExportRow {
    const block = createBlock(blockType);
    const cell: ExportCell = { id: uuidv4(), width: 100, block };
    return { id: uuidv4(), cells: [cell] };
}

// Core reducer (no history tracking)

/** Convenience: return state with updated rows AND a rebuilt block index. */
function withRows(state: ExportLayoutState, rows: ExportRow[]): ExportLayoutState {
    return { ...state, rows, blockIndex: buildBlockIndex(rows) };
}

function coreReducer(state: ExportLayoutState, action: Action): ExportLayoutState {
    switch (action.type) {
        case 'ADD_TWO_COLUMN_ROW': {
            const newRow: ExportRow = {
                id: uuidv4(),
                cells: [
                    { id: uuidv4(), width: 50, block: createBlock('RICH_TEXT') },
                    { id: uuidv4(), width: 50, block: createBlock('RICH_TEXT') },
                ],
            };
            return { ...withRows(state, [...state.rows, newRow]), selectedBlockId: newRow.cells[0].block.id };
        }

        case 'ADD_ROW': {
            const newRow = createRow(action.payload.blockType);
            if (!action.payload.afterRowId) {
                return { ...withRows(state, [...state.rows, newRow]), selectedBlockId: newRow.cells[0].block.id };
            }
            const idx = state.rows.findIndex(r => r.id === action.payload.afterRowId);
            const newRows = [...state.rows];
            newRows.splice(idx + 1, 0, newRow);
            return { ...withRows(state, newRows), selectedBlockId: newRow.cells[0].block.id };
        }

        case 'REMOVE_BLOCK': {
            const { blockId } = action.payload;
            const newRows = state.rows
                .map(row => ({
                    ...row,
                    cells: row.cells.filter(c => c.block.id !== blockId),
                }))
                .filter(row => row.cells.length > 0)
                .map(row => {
                    const total = row.cells.reduce((sum, c) => sum + c.width, 0);
                    if (Math.abs(total - 100) < 0.01) return row;
                    const factor = 100 / total;
                    return {
                        ...row,
                        cells: row.cells.map(c => ({ ...c, width: c.width * factor })),
                    };
                });
            return {
                ...withRows(state, newRows),
                selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
            };
        }

        case 'REMOVE_ROW': {
            const { rowId } = action.payload;
            const newRows = state.rows.filter(r => r.id !== rowId);
            const removedRow = state.rows.find(r => r.id === rowId);
            const wasSelected = removedRow?.cells.some(c => c.block.id === state.selectedBlockId);
            return {
                ...withRows(state, newRows),
                selectedBlockId: wasSelected ? null : state.selectedBlockId,
            };
        }

        case 'UPDATE_BLOCK':
            return withRows(state, updateBlockInRows(state.rows, action.payload.blockId, b => ({ ...b, ...action.payload.updates })));

        case 'UPDATE_BLOCK_SETTINGS':
            return withRows(state, updateBlockInRows(state.rows, action.payload.blockId, b => ({
                ...b,
                settings: { ...b.settings, ...action.payload.settings },
            })));

        case 'SPLIT_ROW': {
            const { blockId, targetColumns } = action.payload;
            return withRows(state, state.rows.map(row => {
                    if (!row.cells.some(c => c.block.id === blockId)) return row;
                    const current = row.cells.length;
                    if (current === targetColumns) return row;
                    const newWidth = 100 / targetColumns;
                    if (current < targetColumns) {
                        const toAdd = targetColumns - current;
                        return {
                            ...row,
                            cells: [
                                ...row.cells.map(c => ({ ...c, width: newWidth })),
                                ...Array.from({ length: toAdd }, () => ({
                                    id: uuidv4(),
                                    width: newWidth,
                                    block: createBlock('RICH_TEXT'),
                                })),
                            ],
                        };
                    }
                    return {
                        ...row,
                        cells: row.cells.slice(0, targetColumns).map(c => ({ ...c, width: newWidth })),
                    };
                }));
        }

        case 'REPLACE_BLOCK_IN_CELL': {
            const { blockId, newBlockType } = action.payload;
            return {
                ...withRows(state, state.rows.map(row => ({
                    ...row,
                    cells: row.cells.map(cell => {
                        if (cell.block.id !== blockId) return cell;
                        const newBlock = createBlock(newBlockType);
                        return { ...cell, block: newBlock };
                    }),
                }))),
                selectedBlockId: null,
            };
        }

        case 'UPDATE_CELL_WIDTHS': {
            const { rowId, widths } = action.payload;
            return withRows(state, state.rows.map(row => {
                if (row.id !== rowId) return row;
                return {
                    ...row,
                    cells: row.cells.map((cell, i) => ({ ...cell, width: widths[i] ?? cell.width })),
                };
            }));
        }

        case 'REORDER_ROWS': {
            const order = action.payload.newOrder;
            const sorted = order
                .map(id => state.rows.find(r => r.id === id))
                .filter(Boolean) as ExportRow[];
            return withRows(state, sorted);
        }

        case 'DUPLICATE_ROW': {
            const { rowId } = action.payload;
            const idx = state.rows.findIndex(r => r.id === rowId);
            if (idx === -1) return state;
            const clone = cloneRow(state.rows[idx]);
            const newRows = [...state.rows];
            newRows.splice(idx + 1, 0, clone);
            return { ...withRows(state, newRows), selectedBlockId: clone.cells[0].block.id };
        }

        case 'SELECT_BLOCK':
            return { ...state, selectedBlockId: action.payload.id };

        case 'UPDATE_PAGE_CONFIG':
            return { ...state, pageConfig: { ...state.pageConfig, ...action.payload } };

        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload };

        case 'SET_ACTIVE_INSERT_FN':
            return { ...state, activeEditorInsertFn: action.payload };

        case 'LOAD_LAYOUT': {
            const basePageConfig = { ...DEFAULT_PAGE_CONFIG, ...action.payload.pageConfig };
            // Run client-side reconciliation so tokens deleted from the template
            // builder (without a version bump) are detected and flagged immediately.
            const { rows: reconciledRows, pageConfig: reconciledPageConfig } =
                reconcileLayoutAgainstTokens(action.payload.rows, basePageConfig, state.tokens);
            return {
                ...withRows(state, reconciledRows),
                pageConfig: reconciledPageConfig,
                isLoading: false,
            };
        }

        case 'MOVE_BLOCK': {
            const { fromCellId, toCellId } = action.payload;
            if (fromCellId === toCellId) return state;

            // Collect the two blocks to swap
            let fromBlock: ExportBlock | undefined;
            let toBlock: ExportBlock | undefined;
            for (const row of state.rows) {
                for (const cell of row.cells) {
                    if (cell.id === fromCellId) fromBlock = cell.block;
                    if (cell.id === toCellId) toBlock = cell.block;
                }
            }
            if (!fromBlock || !toBlock) return state;

            const fb = fromBlock;
            const tb = toBlock;
            return withRows(state, state.rows.map(row => ({
                ...row,
                cells: row.cells.map(cell => {
                    if (cell.id === fromCellId) return { ...cell, block: tb };
                    if (cell.id === toCellId)   return { ...cell, block: fb };
                    return cell;
                }),
            })));
        }

        case 'MARK_CLEAN':
            return { ...state, isDirty: false };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'CLEAN_ORPHANS': {
            const cleaned = stripLayoutIssues(state.rows, state.pageConfig);
            return { ...withRows(state, cleaned.rows), pageConfig: cleaned.pageConfig };
        }

        default:
            return state;
    }
}

// History wrapper
interface DocumentSnapshot {
    rows: ExportRow[];
    pageConfig: ExportPageConfig;
}

interface HistoryState {
    past: DocumentSnapshot[];
    future: DocumentSnapshot[];
}

const MAX_HISTORY = 50;

/** Actions that modify the document and should be tracked in history */
const DOCUMENT_ACTIONS = new Set<string>([
    'ADD_ROW', 'REMOVE_BLOCK', 'REMOVE_ROW', 'UPDATE_BLOCK', 'UPDATE_BLOCK_SETTINGS',
    'SPLIT_ROW', 'REPLACE_BLOCK_IN_CELL', 'UPDATE_CELL_WIDTHS',
    'REORDER_ROWS', 'DUPLICATE_ROW', 'UPDATE_PAGE_CONFIG', 'LOAD_LAYOUT',
    'MOVE_BLOCK', 'CLEAN_ORPHANS',
]);

function historyReducer(combined: { state: ExportLayoutState; history: HistoryState }, action: Action): { state: ExportLayoutState; history: HistoryState } {
    const { state, history } = combined;

    // ── Document-modifying actions: push to history ──
    if (DOCUMENT_ACTIONS.has(action.type)) {
        const currentSnap: DocumentSnapshot = { rows: state.rows, pageConfig: state.pageConfig };
        const newPast = [...history.past, currentSnap].slice(-MAX_HISTORY);
        const newState = coreReducer(state, action);
        // LOAD_LAYOUT is an initialization action — don't mark dirty
        const isDirty = action.type === 'LOAD_LAYOUT' ? false : true;
        return {
            state: { ...newState, isDirty },
            history: { past: newPast, future: [] }, // clear redo on new action
        };
    }

    // ── Non-document actions: pass through without history ──
    return { state: coreReducer(state, action), history };
}

// Context

interface ExportLayoutContextValue {
    state: ExportLayoutState;
    dispatch: Dispatch<Action>;
    saveCallbackRef: MutableRefObject<(() => void) | null>;
    printRef: React.RefObject<HTMLDivElement | null>;
    /** Shared pagination: the visible preview writes here so the forPrint instance can read it. */
    paginatedPagesRef: MutableRefObject<PageSlice[] | null>;
    /** Render intent — 'design' for the builder, 'export' during PDF capture.
     *  Lives outside the reducer because it is transient and must not be
     *  pushed to the undo history. */
    renderIntent: RenderIntent;
    setRenderIntent: (intent: RenderIntent) => void;
}


const ExportLayoutContext = createContext<ExportLayoutContextValue | null>(null);

interface ExportLayoutProviderProps {
    children: ReactNode;
    routeState: ExportLayoutRouteState;
}

export function ExportLayoutProvider({ children, routeState }: ExportLayoutProviderProps): ReactElement {
    const printRef = useRef<HTMLDivElement | null>(null);
    const paginatedPagesRef = useRef<PageSlice[] | null>(null);

    const tokens: AvailableToken[] = routeState.sections.flatMap(section =>
        section.fields.map(field => ({
            fieldId: field.id,
            fieldLabel: field.label,
            fieldType: field.type,
            sectionTitle: section.title,
            sectionId: section.id,
            options: field.options,
            columns: field.columns,
            suffix: field.suffix,
        }))
    );

    const initialState: ExportLayoutState = {
        rows: [],
        blockIndex: buildBlockIndex([]),
        pageConfig: DEFAULT_PAGE_CONFIG,
        selectedBlockId: null,
        viewMode: 'edit',
        activeEditorInsertFn: null,
        tokens,
        templateId: routeState.templateId,
        templateName: routeState.templateName,
        versionId: routeState.versionId,
        isLoading: !!routeState.versionId,
        isDirty: false,
    };

    const [combined, dispatch] = useReducer(historyReducer, {
        state: initialState,
        history: { past: [], future: [] },
    });

    /** External save callback registered by the header component */
    const saveCallbackRef = useRef<(() => void) | null>(null);

    // ── Render intent (transient, outside reducer) ──
    const [renderIntent, setRenderIntentState] = useState<RenderIntent>('design');
    // Mirror into the module-level channel read by TipTap extensions and
    // `sampleForColumn`, which can't easily consume React context.
    useEffect(() => {
        setModuleRenderIntent(renderIntent);
    }, [renderIntent]);

    // ── Warn on browser tab close / refresh with unsaved changes ──
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (combined.state.isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [combined.state.isDirty]);

    // ── Keyboard shortcuts ──
    const stateRef = useRef(combined.state);
    stateRef.current = combined.state;

    const stableDispatch = useCallback((action: Action) => dispatch(action), []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;

            // ── Ctrl/Cmd+S → Save ──
            if (isMeta && e.key === 's') {
                e.preventDefault();
                saveCallbackRef.current?.();
                return;
            }

            // ── Ctrl/Cmd+D → Duplicate row of selected block ──
            if (isMeta && e.key === 'd') {
                const sel = stateRef.current.selectedBlockId;
                if (!sel) return;
                e.preventDefault();
                const row = findRowOfBlock(stateRef.current.rows, sel, stateRef.current.blockIndex);
                if (row) stableDispatch({ type: 'DUPLICATE_ROW', payload: { rowId: row.id } });
                return;
            }

            // ── Delete/Backspace → Remove selected block (only when no editor is focused) ──
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const sel = stateRef.current.selectedBlockId;
                if (!sel) return;
                // Don't intercept when user is typing in an editor/input
                const tag = (document.activeElement?.tagName ?? '').toLowerCase();
                const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select'
                    || (document.activeElement as HTMLElement)?.isContentEditable;
                if (isEditable) return;
                e.preventDefault();
                stableDispatch({ type: 'REMOVE_BLOCK', payload: { blockId: sel } });
                return;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [stableDispatch]);

    return (
        <ExportLayoutContext.Provider
            value={{
                state: combined.state,
                dispatch,
                saveCallbackRef,
                printRef,
                paginatedPagesRef,
                renderIntent,
                setRenderIntent: setRenderIntentState,
            }}
        >
            {children}
        </ExportLayoutContext.Provider>
    );
}

export function useExportLayout(): ExportLayoutContextValue {
    const ctx = useContext(ExportLayoutContext);
    if (!ctx) throw new Error('useExportLayout must be used inside ExportLayoutProvider');
    return ctx;
}
