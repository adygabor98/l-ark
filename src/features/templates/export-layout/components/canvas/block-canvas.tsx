import {
    useRef,
    useState,
    useEffect,
    useId,
    Fragment,
    memo,
    useCallback,
    type ReactElement,
    type ReactNode
} from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    useDraggable,
    useDroppable,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
    useSortable
} from '@dnd-kit/sortable';
import {
    CSS
} from '@dnd-kit/utilities';
import {
    GripVertical,
    Trash2,
    Plus,
    LayoutTemplate,
    FileText,
    AtSign,
    Hash,
    RefreshCw,
    Copy,
    ZoomIn,
    ZoomOut,
    Maximize
} from 'lucide-react';
import {
    useExportLayout
} from '../../export-layout.context';
import {
    createPortal
} from 'react-dom';
import HeaderFooterZone from './header-footer-zone';
import  AddBlockButton from './add-block-button';
import SlashCommandMenu from '../slash-command/slash-command-menu';
import RichTextBlock from '../blocks/rich-text-block';
import TableBlock from '../blocks/table-block';
import ImageBlock from '../blocks/image-block';
import SignatureBlock from '../blocks/signature-block';
import DividerBlock from '../blocks/divider-block';
import PageBreakBlock from '../blocks/page-break-block';
import FormGridBlock from '../blocks/form-grid-block';
import FieldGridBlock from '../blocks/field-grid-block';
import CheckboxGridBlock from '../blocks/checkbox-grid-block';
import {
    type ExportBlock,
    type ExportRow,
    type ExportCell,
    type BlockType,
    LAYOUTS
} from '../../export-layout.models';
import {
    PAGE_DIMS,
    PX_PER_MM,
    CANVAS_HORIZONTAL_PADDING_PX,
    WATERMARK_CHAR_FACTOR,
    WATERMARK_MIN_FONT_PX,
    WATERMARK_MAX_FONT_PX,
    WATERMARK_DEFAULT_OPACITY,
    CELL_MIN_WIDTH_PCT
} from '../../export-layout.constants';
import Button from '../../../../../shared/components/button';

const SLASH_MENU_EVENT = 'slash-menu-open';
const MENU_HEIGHT = 320;
const MENU_WIDTH  = 256;

const getMenuPos = (clientX: number, clientY: number) => ({
    top:  clientY + 8 + MENU_HEIGHT > window.innerHeight ? clientY - MENU_HEIGHT - 8 : clientY + 8,
    left: Math.max(8, Math.min(window.innerWidth - MENU_WIDTH - 8, clientX - MENU_WIDTH / 2)),
});

const watermarkFontSize = (text: string, paperWidth: number): number => {
    const maxWidth = paperWidth * 0.85;
    const calculated = Math.floor(maxWidth / (text.length * WATERMARK_CHAR_FACTOR));

    return Math.min(WATERMARK_MAX_FONT_PX, Math.max(WATERMARK_MIN_FONT_PX, calculated));
}

// Check if a block has meaningful content
const isEmptyRichText = (block: ExportBlock): boolean => {
    if (block.type !== 'RICH_TEXT') return false;

    if (!block.content) return true;

    const doc = block.content as { content?: Array<{ content?: unknown[] }> };
    if (!doc.content || doc.content.length === 0) return true;

    if (doc.content.length === 1) {
        const first = doc.content[0];
        if (!first.content || first.content.length === 0)
            return true;
    }
    return false;
}

const blockHasContent = (block: ExportBlock): boolean => {
    if (block.type !== 'RICH_TEXT') return true;

    return !isEmptyRichText(block);
}

const rowHasContent = (row: ExportRow): boolean => {
    return row.cells.some(c => blockHasContent(c.block));
}

// Inline delete confirmation
const DeleteConfirmation = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }): ReactElement => {
    return (
        <div className="flex flex-col items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1 shadow-lg z-50" onClick={e => e.stopPropagation()}>
            <span className="text-xs text-red-600 font-[Lato-Regular] whitespace-nowrap"> Delete? </span>
            <div>
                <Button variant='danger' onClick={onConfirm}>
                    Delete
                </Button>
                <Button variant='secondary' onClick={onCancel}>
                    Keep
                </Button>
            </div>
        </div>
    );
}

// Block renderer
const BlockContent = memo(function BlockContent({ block }: { block: ExportBlock }): ReactElement {
    switch (block.type) {
        case 'RICH_TEXT': return <RichTextBlock block={block} />;
        case 'TABLE': return <TableBlock block={block} />;
        case 'IMAGE': return <ImageBlock block={block} />;
        case 'SIGNATURE': return <SignatureBlock block={block} />;
        case 'DIVIDER': return <DividerBlock block={block} />;
        case 'PAGE_BREAK': return <PageBreakBlock />;
        case 'FIELD_GRID': return <FieldGridBlock block={block} />;
        case 'CHECKBOX_GRID': return <CheckboxGridBlock block={block} />;
        case 'FORM_GRID': return <FormGridBlock block={block} />;
        case 'BLANK': return <div className="w-full h-full min-h-10 border border-dashed border-black/15 rounded-md bg-black/1 flex items-center justify-center"><span className="text-[10px] text-black/25 font-[Lato-Regular] select-none">Empty space</span></div>;
        default: return <></>;
    }
}, (prev, next) => prev.block === next.block);

// Resize handle
interface ResizeHandleProps {
    rowId: string;
    leftCellIdx: number;
    row: ExportRow;
    pageWidth: number;
    scale: number;
}

const  ResizeHandle = ({ rowId, leftCellIdx, row, pageWidth, scale }: ResizeHandleProps): ReactElement => {
    /** Export layout api utilities */
    const { dispatch } = useExportLayout();
    /** State to manage is the handle is dagging */
    const [dragging, setDragging] = useState(false);

    // Live width values for labels during drag
    const leftWidth = row.cells[leftCellIdx].width;
    const rightWidth = row.cells[leftCellIdx + 1].width;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);

        const startX = e.clientX;
        const initLeft  = row.cells[leftCellIdx].width;
        const initRight = row.cells[leftCellIdx + 1].width;
        const totalWidth = initLeft + initRight;

        const onMouseMove = (me: MouseEvent) => {
            const deltaX = me.clientX - startX;
            const deltaPct = (deltaX / scale) / pageWidth * 100;
            const newLeft  = Math.max(CELL_MIN_WIDTH_PCT, Math.min(totalWidth - CELL_MIN_WIDTH_PCT, initLeft + deltaPct));
            const newRight = totalWidth - newLeft;
            const widths = row.cells.map((c, i) => {
                if (i === leftCellIdx)     return newLeft;
                if (i === leftCellIdx + 1) return newRight;
                return c.width;
            });
            dispatch({ type: 'UPDATE_CELL_WIDTHS', payload: { rowId, widths } });
        };

        const onMouseUp = () => {
            setDragging(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div className={`w-4 shrink-0 flex items-center justify-center cursor-col-resize select-none group/resize relative ${dragging ? 'z-50' : ''}`}
            onMouseDown={handleMouseDown}
        >
            {/* Width labels during drag */}
            { dragging &&
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-50 pointer-events-none">
                    <span className="text-[10px] font-[Lato-Regular] bg-amber-500 text-white px-1.5 py-0.5 rounded-md shadow">
                        { Math.round(leftWidth) }%
                    </span>
                    <span className="text-[10px] text-amber-500"> | </span>
                    <span className="text-[10px] font-[Lato-Regular] bg-amber-500 text-white px-1.5 py-0.5 rounded-md shadow">
                        { Math.round(rightWidth) }%
                    </span>
                </div>
            }

            {/* Always-visible dotted line */}
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-all duration-150 ${ dragging ? 'bg-amber-400 w-0.5'
                : 'border-l border-dashed border-black/15 group-hover/resize:border-amber-400 group-hover/resize:border-solid'
            }`} />

            {/* Grip dots indicator */}
            <div className={`relative z-10 flex flex-col items-center gap-0.5 py-1 px-0.5 rounded transition-all ${ dragging ? 'bg-amber-400 text-white'
                : 'text-black/20 group-hover/resize:text-amber-500 group-hover/resize:bg-amber-50'
            }`}>
                <span className="text-[8px] leading-none"> ⋮ </span>
                <span className="text-[8px] leading-none"> ⋮ </span>
            </div>
        </div>
    );
}

// Column layout picker
const ColumnLayoutButton = ({ row }: { row: ExportRow }): ReactElement => {
    /** Export layout api utilities */
    const { dispatch } = useExportLayout();
    const [open, setOpen] = useState(false);
    const id = useId();
    const current = row.cells.length;
    const firstBlockId = row.cells[0]?.block.id;

    useEffect(() => {
        const handleOtherOpen = (e: Event) => {
            if ((e as CustomEvent<{ id: string }>).detail.id !== id) setOpen(false);
        };
        document.addEventListener(SLASH_MENU_EVENT, handleOtherOpen);
        return () => document.removeEventListener(SLASH_MENU_EVENT, handleOtherOpen);
    }, [id]);

    return (
        <div className="relative">
            <button onClick={e => {
                e.stopPropagation();
                if (!open) document.dispatchEvent(new CustomEvent(SLASH_MENU_EVENT, { detail: { id } }));
                setOpen(o => !o);
            }} title="Column layout"
                className={`p-1 rounded-md transition-colors ${open ? 'text-amber-500 bg-amber-50' : 'text-black/25 hover:text-amber-500 hover:bg-amber-50'}`}
            >
                <LayoutTemplate className="w-3.5 h-3.5" />
            </button>
            { open && firstBlockId &&
                <div className="absolute right-7 top-0 z-50 bg-white border border-black/10 rounded-xl shadow-xl p-2 w-44"
                    onClick={e => e.stopPropagation()}
                >
                    <p className="text-[10px] text-black/40 uppercase tracking-wide font-semibold mb-1.5 px-1"> Column layout </p>
                    { LAYOUTS.map(({ cols, icon, title }) => (
                        <button key={cols}
                            onClick={() => {
                                dispatch({ type: 'SPLIT_ROW', payload: { blockId: firstBlockId, targetColumns: cols } });
                                setOpen(false);
                            }}
                            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                current === cols ? 'bg-amber-50 text-amber-700 font-medium' : 'text-black/60 hover:bg-black/4'
                            }`}
                        >
                            <span className="font-[Lato-Regular] tracking-tight w-8"> { icon } </span>
                            <span> { title } </span>
                        </button>
                    ))}
                </div>
            }
        </div>
    );
}

// Block type swap button (for cells in multi-column rows)
const SwapBlockButton = ({ block }: { block: ExportBlock }): ReactElement => {
    const { dispatch } = useExportLayout();
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const id = useId();

    useEffect(() => {
        const handleOtherOpen = (e: Event) => {
            if ((e as CustomEvent<{ id: string }>).detail.id !== id) setOpen(false);
        };
        document.addEventListener(SLASH_MENU_EVENT, handleOtherOpen);
        return () => document.removeEventListener(SLASH_MENU_EVENT, handleOtherOpen);
    }, [id]);

    const handleSwapClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (open) { setOpen(false); return; }
        document.dispatchEvent(new CustomEvent(SLASH_MENU_EVENT, { detail: { id } }));
        setMenuPos(getMenuPos(e.clientX, e.clientY));
        setOpen(true);
    };

    return (
        <div className="relative">
            <button
                onClick={handleSwapClick}
                title="Change block type"
                className={`p-1 rounded-md bg-white/90 border border-black/10 shadow-sm transition-colors ${
                    open ? 'text-amber-500 bg-amber-50' : 'text-black/30 hover:text-amber-500'
                }`}
            >
                <RefreshCw className="w-3 h-3" />
            </button>
            { open && createPortal(
                <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}>
                    <SlashCommandMenu
                        onInsert={(type) => {
                            dispatch({ type: 'REPLACE_BLOCK_IN_CELL', payload: { blockId: block.id, newBlockType: type } });
                            setOpen(false);
                        }}
                        onClose={() => setOpen(false)}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}


// Cell wrapper
interface CellWrapperProps {
    cell: ExportCell;
    children: ReactNode;
}

const CellWrapper = ({ cell, children }: CellWrapperProps): ReactElement => {
    const { state, dispatch } = useExportLayout();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const isSelected = state.selectedBlockId === cell.block.id;
    const marginBottom = cell.block.settings.marginBottom ?? 0;
    const s = cell.block.settings;

    // Block draggable handle
    const { attributes: dragAttrs, listeners: dragListeners, setNodeRef: setDragRef, isDragging } =
        useDraggable({ id: `block-${cell.block.id}`, data: { sourceCellId: cell.id } });

    // Cell droppable zone
    const { isOver, setNodeRef: setDropRef } = useDroppable({
        id: `cell-${cell.id}`,
        data: { targetCellId: cell.id },
    });
    
    const handleDeleteBlock = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (blockHasContent(cell.block)) {
            setConfirmDelete(true);
        } else {
            dispatch({ type: 'REMOVE_BLOCK', payload: { blockId: cell.block.id } });
        }
    };

    // Decoration styles
    const decorationStyle: React.CSSProperties = {
        marginBottom: marginBottom > 0 ? marginBottom : undefined,
        backgroundColor: s.backgroundColor || undefined,
        padding: s.padding
            ? `${s.padding.top}px ${s.padding.right}px ${s.padding.bottom}px ${s.padding.left}px`
            : undefined,
        borderWidth: s.borderWidth ? s.borderWidth : undefined,
        borderColor: s.borderColor || undefined,
        borderStyle: s.borderStyleDecoration || (s.borderWidth ? 'solid' : undefined),
        borderRadius: s.borderRadius ?? undefined,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setDropRef} className="relative group/cell flex-1 min-w-0" style={decorationStyle}
            onClick={e => { e.stopPropagation(); dispatch({ type: 'SELECT_BLOCK', payload: { id: cell.block.id } }); }}
        >
            <div className={`h-full rounded-xl transition-all ${
                    isOver ? 'ring-2 ring-amber-400 ring-offset-1 bg-amber-50/30' :
                    isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : 'ring-1 ring-transparent hover:ring-black/8'
                }`}
            >
                {children}
            </div>

            {/* Per-cell action buttons (top-right corner) */}
            <div className="absolute -top-7 right-1 flex gap-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity z-20">
                { confirmDelete ?
                    <DeleteConfirmation
                        onConfirm={() => {
                            dispatch({ type: 'REMOVE_BLOCK', payload: { blockId: cell.block.id } });
                            setConfirmDelete(false);
                        }}
                        onCancel={() => setConfirmDelete(false)}
                    />
                :
                    <>
                        {/* Block drag handle (moves block to another cell/row) */}
                        <div ref={setDragRef} {...dragAttrs} {...dragListeners} title="Drag to move block to another cell"
                            className="p-1 rounded-md bg-white/95 border border-black/10 text-black/30 hover:text-amber-500 hover:bg-amber-50 shadow-sm cursor-grab active:cursor-grabbing"
                            onClick={e => e.stopPropagation()}
                        >
                            <GripVertical className="w-3 h-3" />
                        </div>

                        <SwapBlockButton block={cell.block} />

                        <button
                            onClick={handleDeleteBlock}
                            title="Delete block"
                            className="p-1 rounded-md bg-white/95 border border-black/10 text-black/30 hover:text-red-500 hover:bg-red-50 shadow-sm"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </>
                }
            </div>
        </div>
    );
}

// Sortable row
interface SortableRowProps {
    row: ExportRow;
    pageWidth: number;
    scale: number;
}

const SortableRow = memo(function SortableRow({ row, pageWidth, scale }: SortableRowProps): ReactElement {
    const { dispatch } = useExportLayout();
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [addMenuPos, setAddMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [confirmDeleteRow, setConfirmDeleteRow] = useState(false);
    const id = useId();

    useEffect(() => {
        const handleOtherOpen = (e: Event) => {
            if ((e as CustomEvent<{ id: string }>).detail.id !== id) setShowAddMenu(false);
        };
        document.addEventListener(SLASH_MENU_EVENT, handleOtherOpen);
        return () => document.removeEventListener(SLASH_MENU_EVENT, handleOtherOpen);
    }, [id]);

    const handleAddRowClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (showAddMenu) { setShowAddMenu(false); return; }
        document.dispatchEvent(new CustomEvent(SLASH_MENU_EVENT, { detail: { id } }));
        setAddMenuPos(getMenuPos(e.clientX, e.clientY));
        setShowAddMenu(true);
    };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

    const handleInsertAfter = (type: BlockType) => {
        dispatch({ type: 'ADD_ROW', payload: { blockType: type, afterRowId: row.id } });
        setShowAddMenu(false);
    };

    const handleDeleteRow = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (rowHasContent(row)) {
            setConfirmDeleteRow(true);
        } else {
            dispatch({ type: 'REMOVE_ROW', payload: { rowId: row.id } });
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={`group/row relative rounded-lg transition-colors hover:bg-amber-50/30 ${isDragging ? 'z-50' : ''}`}>
            <div className="flex items-start gap-1.5">
                {/* Row drag handle */}
                <div {...attributes} {...listeners}
                    className="shrink-0 mt-2 opacity-0 group-hover/row:opacity-100 cursor-grab active:cursor-grabbing text-black/25 hover:text-black/50 transition-opacity"
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                {/* Cells in a row */}
                <div className="flex-1 flex items-stretch min-w-0">
                    { row.cells.map((cell, cellIdx) => (
                        <Fragment key={cell.id}>
                            <div style={{ flex: cell.width, minWidth: 0 }}>
                                <CellWrapper cell={cell}>
                                    <BlockContent block={cell.block} />
                                </CellWrapper>
                            </div>
                            { cellIdx < row.cells.length - 1 &&
                                <ResizeHandle
                                    rowId={row.id}
                                    leftCellIdx={cellIdx}
                                    row={row}
                                    pageWidth={pageWidth}
                                    scale={scale}
                                />
                            }
                        </Fragment>
                    ))}
                </div>

                {/* Row-level action buttons */}
                <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity mt-1">
                    { confirmDeleteRow ?
                        <DeleteConfirmation
                            onConfirm={() => {
                                dispatch({ type: 'REMOVE_ROW', payload: { rowId: row.id } });
                                setConfirmDeleteRow(false);
                            }}
                            onCancel={() => setConfirmDeleteRow(false)}
                        />
                    :
                        <>
                            <button
                                onClick={handleDeleteRow}
                                title="Delete row"
                                className="p-1 rounded-md text-black/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); dispatch({ type: 'DUPLICATE_ROW', payload: { rowId: row.id } }); }}
                                title="Duplicate row (Ctrl+D)"
                                className="p-1 rounded-md text-black/25 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                            <ColumnLayoutButton row={row} />
                        </>
                    }
                </div>
            </div>

            {/* Add row below button */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/row:opacity-100 transition-opacity">
                <div className="relative">
                    <button
                        onClick={handleAddRowClick}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white border border-black/10 rounded-full text-xs text-black/40 hover:text-black/70 hover:border-black/20 shadow-sm transition-all"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                    { showAddMenu && createPortal(
                        <div style={{ position: 'fixed', top: addMenuPos.top, left: addMenuPos.left, zIndex: 9999 }}>
                            <SlashCommandMenu
                                onInsert={handleInsertAfter}
                                onClose={() => setShowAddMenu(false)}
                            />
                        </div>,
                        document.body
                    )}
                </div>
            </div>
        </div>
    );
});

// Quick-start templates
interface QuickStartProps {
    onSelect: (template: 'header-body' | 'two-column' | 'blank') => void;
}

const QuickStartTemplates = ({ onSelect }: QuickStartProps): ReactElement => {
    const templates = [
        { id: 'header-body' as const, label: 'Header + Body', desc: 'A heading row followed by a text block' },
        { id: 'two-column' as const, label: 'Two Columns', desc: 'A row split into two equal columns' },
        { id: 'blank' as const, label: 'Blank Page', desc: 'Start with a single empty text block' },
    ];

    return (
        <div className="flex gap-2">
            { templates.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className="flex flex-col items-center gap-1.5 px-4 py-3 border border-black/8 rounded-xl hover:border-amber-300 hover:bg-amber-50/30 transition-all text-center"
                >
                    <span className="text-xs font-[Lato-Regular] text-black/60">{t.label}</span>
                    <span className="text-[10px] text-black/30">{t.desc}</span>
                </button>
            ))}
        </div>
    );
}

// Empty state
const  EmptyState = ({ onInsert, onQuickStart }: { onInsert: (type: BlockType) => void; onQuickStart: (template: 'header-body' | 'two-column' | 'blank') => void }): ReactElement => {
    return (
        <div className="flex flex-col items-center gap-5 py-12">
            <LayoutTemplate className="w-10 h-10 text-black/15" />
            <div className="text-center">
                <p className="text-sm font-[Lato-Regular] text-black/40 mb-1"> Your document is empty </p>
                <p className="text-xs text-black/25"> Pick a template to get started, or add a block manually </p>
            </div>
            <QuickStartTemplates onSelect={onQuickStart} />
            <div className="flex items-center gap-3 text-xs text-black/25">
                <div className="w-12 border-t border-black/8" />
                <span> or </span>
                <div className="w-12 border-t border-black/8" />
            </div>
            <AddBlockButton onInsert={onInsert} label="Add first block" />
            <div className="mt-2 w-full max-w-xs border border-black/6 rounded-xl p-4 bg-[#FAFAFA]">
                <p className="text-xs font-[Lato-Regular] text-black/40 uppercase tracking-wide mb-3">Quick tips</p>
                <div className="flex flex-col gap-2.5">
                    <Tip icon={<FileText className="w-3.5 h-3.5" />} label='Type "/" in a text block to add a new block' />
                    <Tip icon={<AtSign className="w-3.5 h-3.5" />} label='Type "@" to insert a field token' />
                    <Tip icon={<LayoutTemplate className="w-3.5 h-3.5" />} label="Use the ⊞ icon on a row to split into 2-4 columns" />
                    <Tip icon={<Hash className="w-3.5 h-3.5" />} label="Enable Page Numbers in Document Settings → Footer" />
                </div>
            </div>
        </div>
    );
}

const Tip = ({ icon, label }: { icon: ReactElement; label: string }): ReactElement => {
    return (
        <div className="flex items-start gap-2">
            <span className="text-black/30 mt-0.5 shrink-0"> { icon } </span>
            <span className="text-xs text-black/40 leading-relaxed"> { label } </span>
        </div>
    );
}

// Zoom controls
const ZoomControls = ({ scale, onZoomIn, onZoomOut, onFit }: { scale: number; onZoomIn: () => void; onZoomOut: () => void; onFit: () => void;}): ReactElement => {
    return (
        <div className="self-center flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full select-none">
            <button onClick={onZoomOut} className="p-0.5 hover:bg-white/20 rounded transition-colors" title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center tabular-nums"> { Math.round(scale * 100) }% </span>
            <button onClick={onZoomIn} className="p-0.5 hover:bg-white/20 rounded transition-colors" title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-white/30 mx-0.5" />
            <button onClick={onFit} className="p-0.5 hover:bg-white/20 rounded transition-colors" title="Fit to width">
                <Maximize className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// Main canvas
const BlockCanvas = (): ReactElement => {
    const { state, dispatch } = useExportLayout();
    const canvasRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    const [paperHeight, setPaperHeight] = useState(0);
    const [autoScale, setAutoScale] = useState(1);
    const [manualZoom, setManualZoom] = useState<number | null>(null);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

    const scale = manualZoom ?? autoScale;

    const dims = PAGE_DIMS[state.pageConfig.pageSize];
    const pageWidth = dims.width;
    const pageHeightPx = dims.height;

    // Compute CSS zoom to fit paper in available canvas width
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(([entry]) => {
            const avail = entry.contentRect.width - CANVAS_HORIZONTAL_PADDING_PX;
            setAutoScale(Math.min(1, avail / pageWidth));
        });
        observer.observe(canvas);

        return () => observer.disconnect();
    }, [pageWidth]);

    // Track paper logical height for page boundary lines
    useEffect(() => {
        const el = paperRef.current;
        if (!el) return;

        const observer = new ResizeObserver(entries => {
            setPaperHeight(entries[0].contentRect.height);
        });
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    // Ctrl+scroll wheel to zoom
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handler = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;

            e.preventDefault();
            setManualZoom(prev => {
                const current = prev ?? autoScale;
                const delta = e.deltaY > 0 ? -0.05 : 0.05;

                return Math.max(0.25, Math.min(2, current + delta));
            });
        };

        canvas.addEventListener('wheel', handler, { passive: false });

        return () => canvas.removeEventListener('wheel', handler);
    }, [autoScale]);

    const handleZoomIn = useCallback(() => {
        setManualZoom(prev => Math.min(2, (prev ?? autoScale) + 0.1));
    }, [autoScale]);

    const handleZoomOut = useCallback(() => {
        setManualZoom(prev => Math.max(0.25, (prev ?? autoScale) - 0.1));
    }, [autoScale]);

    const handleZoomFit = useCallback(() => {
        setManualZoom(null);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Unified drag start handler
    const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
        const activeId = String(event.active.id);
        if (activeId.startsWith('block-')) {
            setDraggingBlockId(activeId.replace('block-', ''));
        }
    }, []);

    // Unified drag end handler — differentiates row reorder vs block move by ID prefix
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setDraggingBlockId(null);
        
        if (!over || active.id === over.id) return;

        const activeId = String(active.id);

        if (activeId.startsWith('block-')) {
            // Block move between cells
            const sourceCellId = active.data.current?.sourceCellId as string | undefined;
            const targetCellId = (over.data.current?.targetCellId ?? String(over.id).replace('cell-', '')) as string;
            if (sourceCellId && targetCellId && sourceCellId !== targetCellId) {
                dispatch({ type: 'MOVE_BLOCK', payload: { fromCellId: sourceCellId, toCellId: targetCellId } });
            }
        } else {
            // Row reorder (sortable)
            const oldIdx = state.rows.findIndex(r => r.id === activeId);
            const newIdx = state.rows.findIndex(r => r.id === String(over.id));
            if (oldIdx >= 0 && newIdx >= 0) {
                const reordered = arrayMove(state.rows, oldIdx, newIdx);
                dispatch({ type: 'REORDER_ROWS', payload: { newOrder: reordered.map(r => r.id) } });
            }
        }
    }, [state.rows, dispatch]);

    const handleAddBlock = (type: BlockType) => {
        dispatch({ type: 'ADD_ROW', payload: { blockType: type } });
    };

    const handleQuickStart = (template: 'header-body' | 'two-column' | 'blank') => {
        switch (template) {
            case 'header-body':
                dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: { showHeader: true } });
                dispatch({ type: 'ADD_ROW', payload: { blockType: 'RICH_TEXT' } });
                break;
            case 'two-column':
                dispatch({ type: 'ADD_TWO_COLUMN_ROW' });
                break;
            case 'blank':
                dispatch({ type: 'ADD_ROW', payload: { blockType: 'RICH_TEXT' } });
                break;
        }
    };

    const { top, right, bottom, left } = state.pageConfig.margins;
    const wmText = state.pageConfig.watermark ?? '';
    const wmSize = wmText ? watermarkFontSize(wmText, pageWidth) : 0;
    const wmColor = state.pageConfig.watermarkColor ?? '#000000';
    const wmOpacity = state.pageConfig.watermarkOpacity ?? WATERMARK_DEFAULT_OPACITY;

    // Sidebar band
    const hasSidebar = state.pageConfig.showSidebar;
    const sidebarWidthMm = hasSidebar ? (state.pageConfig.sidebarWidth ?? 8) : 0;
    const sidebarPos = state.pageConfig.sidebarPosition ?? 'left';
    const sidebarWidthPx = sidebarWidthMm * PX_PER_MM;
    const effectiveLeft = sidebarPos === 'left' ? left + sidebarWidthMm : left;
    const effectiveRight = sidebarPos === 'right' ? right + sidebarWidthMm : right;

    const contentMinHeight = pageHeightPx - (top + bottom) * PX_PER_MM;

    const pageBoundaryCount = Math.floor(paperHeight / pageHeightPx);
    const pageBoundaries    = Array.from({ length: pageBoundaryCount }, (_, i) => (i + 1) * pageHeightPx);

    return (
        <div ref={canvasRef} className="h-full flex-1 overflow-auto bg-transparent flex flex-col items-center py-5 px-2 gap-3" onClick={() => dispatch({ type: 'SELECT_BLOCK', payload: { id: null } })}>
            {/* Zoom controls */}
            <ZoomControls
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFit={handleZoomFit}
            />

            {/* Paper (CSS zoom scales it to fit canvas) */}
            <div style={{ height: '100%', zoom: scale }}>
                <div ref={paperRef} className="bg-white relative"
                    style={{ width: pageWidth, minHeight: pageHeightPx,
                        padding: `${top}mm ${effectiveRight}mm ${bottom}mm ${effectiveLeft}mm`,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Sidebar band */}
                    { hasSidebar &&
                        <div className="absolute top-0 bottom-0 z-20 flex items-center justify-center overflow-hidden"
                            style={{
                                [sidebarPos]: 0,
                                width: sidebarWidthPx,
                                backgroundColor: state.pageConfig.sidebarColor ?? '#1a1a2e',
                            }}
                        >
                            { (state.pageConfig.sidebarText ?? '') &&
                                <span className="font-[Lato-Black] uppercase tracking-[0.25em] whitespace-nowrap select-none"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'mixed',
                                        transform: 'rotate(180deg)',
                                        color: state.pageConfig.sidebarTextColor ?? '#ffffff',
                                        fontSize: state.pageConfig.sidebarFontSize ?? 14,
                                        maxHeight: '90%',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {state.pageConfig.sidebarText}
                                </span>
                            }
                        </div>
                    }
                    {/* Watermark */}
                    { wmText &&
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
                            <span className="font-bold uppercase tracking-widest text-center"
                                style={{ fontSize: wmSize, transform: 'rotate(-35deg)', maxWidth: '90%', wordBreak: 'break-word', color: wmColor, opacity: wmOpacity }}
                            >
                                { wmText }
                            </span>
                        </div>
                    }

                    {/* Page boundary lines */}
                    { pageBoundaries.map(y => (
                        <div key={y} className="absolute left-0 right-0 pointer-events-none" style={{ top: y, zIndex: 5 }}>
                            <div className="border-t-2 border-dashed border-blue-200" />
                            <div className="flex justify-center">
                                <span className="text-[10px] text-blue-300 bg-blue-50 px-2 py-0.5 rounded-b-md font-medium">
                                    Page { Math.round(y / pageHeightPx) + 1 }
                                </span>
                            </div>
                        </div>
                    )) }

                    <div className="relative z-10 flex flex-col" style={{ minHeight: contentMinHeight }}>
                        {/* Header zone */}
                        <HeaderFooterZone zone="header" />

                        {/* Content rows — flex-1 so footer is pushed to the bottom */}
                        <div className="flex-1 flex flex-col gap-2">
                            { state.rows.length === 0 ?
                                <EmptyState onInsert={handleAddBlock} onQuickStart={handleQuickStart} />
                            :
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={state.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-5 py-2">
                                            { state.rows.map(row => (
                                                <SortableRow
                                                    key={row.id}
                                                    row={row}
                                                    pageWidth={pageWidth}
                                                    scale={scale}
                                                />
                                            )) }
                                        </div>
                                    </SortableContext>
                                    {/* Ghost overlay shown while dragging a block */}
                                    <DragOverlay>
                                        { draggingBlockId ?
                                            <div className="bg-white border-2 border-amber-400 rounded-xl shadow-xl px-4 py-3 text-xs text-amber-700 font-medium opacity-90 pointer-events-none">
                                                Moving block…
                                            </div>
                                        :
                                            null
                                        }
                                    </DragOverlay>
                                </DndContext>
                            }

                            { state.rows.length > 0 &&
                                <div className="mt-3">
                                    <AddBlockButton onInsert={handleAddBlock} />
                                </div>
                            }
                        </div>

                        {/* Footer zone — mt-auto pins it to the bottom of the page */}
                        <div className="mt-auto">
                            <HeaderFooterZone zone="footer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BlockCanvas;