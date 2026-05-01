import {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useMemo,
    type ReactElement
} from 'react';
import {
    Eye,
    EyeOff,
    FileText,
    LayoutGrid,
} from 'lucide-react';
import { FieldUnderline, EmptyState, PreviewCheckbox, PreviewRadio } from './preview-primitives';
import {
    generateHTML
} from '@tiptap/core';
import {
    Color
} from '@tiptap/extension-color';
import {
    TextStyle
} from '@tiptap/extension-text-style';
import buildPreviewFieldTokenExtension from '../../tiptap/extensions/field-token.extension';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock,
    ExportRow,
    PageSlice,
    FormGridCell,
    FieldGridEntry,
} from '../../export-layout.models';
import {
    PAGE_DIMS,
    PX_PER_MM,
    ROW_GAP_PX,
    WATERMARK_CHAR_FACTOR,
    WATERMARK_MIN_FONT_PX,
    WATERMARK_MAX_FONT_PX,
    WATERMARK_DEFAULT_OPACITY,
} from '../../export-layout.constants';
import {
    FontSize
} from '../../tiptap/extensions/font-size.extension';
import {
    CustomBold
} from '../../tiptap/extensions/bold.extension';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { getRenderIntent } from '../../utils/render-intent';



// TipTap extensions for static HTML generation
const PREVIEW_EXTENSIONS = [
    StarterKit,
    TextAlign.configure({
        types: ['heading', 'paragraph']
    }),
    Color,
    TextStyle,
    Highlight.configure({
        multicolor: true
    }),
    Underline,
    Subscript,
    Superscript,
    FontSize,
    CustomBold,
    buildPreviewFieldTokenExtension(),
];

// Header/footer zones also need the preview token extension
const ZONE_PREVIEW_EXTENSIONS = [
    StarterKit.configure({
        heading: false
    }),
    TextAlign.configure({
        types: ['paragraph']
    }),
    Color,
    TextStyle,
    Highlight.configure({
        multicolor: true
    }),
    Underline,
    FontSize,
    CustomBold,
    buildPreviewFieldTokenExtension(),
];

/**
 * Heuristic sample value for a table column based on its name. Used in the
 * table preview so empty tables read as "this is what data looks like" rather
 * than a broken placeholder. Row 2 gets a faded variant to imply more data.
 */
const sampleForColumn = (columnName: string, rowIdx: number, colType?: string): string => {
    // Export intent: empty cells. No "John Doe" / "$1,250.00" leaking into
    // printed PDFs.
    if (getRenderIntent() === 'export') return '';
    // Signature columns: show a blank signature line placeholder
    if (colType === 'SIGNATURE') return rowIdx === 1 ? '─────────────' : '─────────────';
    const n = columnName.toLowerCase();
    // Currency / money
    if (/(amount|price|total|cost|fee|balance|subtotal|tax|discount)/.test(n)) {
        return rowIdx === 1 ? '$1,250.00' : '$980.50';
    }
    // Percentage
    if (/(percent|%|rate)/.test(n)) return rowIdx === 1 ? '12%' : '8%';
    // Date
    if (/(date|day|when|expires|created|updated|due)/.test(n)) {
        return rowIdx === 1 ? '2026-01-15' : '2026-02-03';
    }
    // Email
    if (/(e-?mail)/.test(n)) return rowIdx === 1 ? 'name@example.com' : 'other@example.com';
    // Phone
    if (/(phone|tel|mobile)/.test(n)) return rowIdx === 1 ? '+34 600 000 000' : '+34 611 111 111';
    // Quantity / count / number
    if (/(qty|quantity|count|number|num|#|units)/.test(n)) return rowIdx === 1 ? '12' : '7';
    // Name / person
    if (/(name|client|customer|person|user)/.test(n)) return rowIdx === 1 ? 'John Doe' : 'Jane Smith';
    // Description / note
    if (/(desc|note|comment|detail)/.test(n)) return rowIdx === 1 ? 'Sample description' : '…';
    // ID / reference
    if (/(id|ref|code|sku)/.test(n)) return rowIdx === 1 ? 'REF-001' : 'REF-002';
    // Fallback
    return rowIdx === 1 ? 'Sample text' : '…';
};

/** Recursively strip marks from any `fieldToken` node in a TipTap doc.
 *  Legacy documents may have textStyle/fontSize marks attached to field
 *  tokens — those marks make ProseMirror render the token inside a wrapper
 *  `<span>`, which breaks the flex chain and prevents the dotted underline
 *  from stretching. Stripping at render time keeps old docs working without
 *  a migration. */
const stripFieldTokenMarks = (node: unknown): unknown => {
    if ( !node || typeof node !== 'object' ) return node;
    const n = node as Record<string, unknown>;
    const next: Record<string, unknown> = { ...n };
    if ( n.type === 'fieldToken' && Array.isArray(n.marks) && n.marks.length ) {
        delete next.marks;
    }
    if ( Array.isArray(n.content) ) {
        next.content = n.content.map(stripFieldTokenMarks);
    }
    return next;
};

const renderRichText = (content: Record<string, unknown>): string => {
    try {
        const cleaned = stripFieldTokenMarks(content) as Record<string, unknown>;
        const html = generateHTML(cleaned as never, PREVIEW_EXTENSIONS);

        return html.replace(/<p[^>]*><\/p>/g, "<br />");
    } catch {
        return '<p></p>';
    }
}

const renderZoneText = (content: Record<string, unknown>): string => {
    try {
        return generateHTML(content as never, ZONE_PREVIEW_EXTENSIONS);
    } catch {
        return '<p></p>';
    }
}

// Rich text preview
const RichTextPreview = ({ content }: { content?: Record<string, unknown> }): ReactElement => {
    if ( !content )
        return <EmptyState icon={<FileText className="w-3.5 h-3.5" />} label="Empty text block" />;

    const html = renderRichText(content);
    return (
        <div
            className="export-rich-content prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/**
 * Paper-first signature block preview.
 *
 * Replaces the previous dashed-box + "Sign here" watermark + English labels
 * with a clean black rule, Catalan labels, optional role heading ("L'Agència"
 * / "El Client"), and stacked identity lines (Nom i cognoms / DNI / Data).
 *
 * Designer affordance: the interactive `ProfessionalSignature` pad is gone
 * from the preview — it was a web-upload metaphor on a document that will
 * ultimately be signed on paper, and the dashed gradient box rendered poorly
 * in the exported PDF. Nothing is interactive here; the block is purely a
 * print-ready affordance.
 */
const SignaturePadPreview = ({ block }: { block: ExportBlock; forPrint?: boolean }): ReactElement => {
    const { state } = useExportLayout();
    const field = state.tokens.find(t => t.fieldId === block.sourceFieldId);
    const width = block.settings.signatureWidth ?? 320;
    const role = (block.settings.signatureRole ?? '').trim();
    const label = field?.fieldLabel ?? 'Signatura';

    return (
        <div style={{ maxWidth: width, width: '100%', breakInside: 'avoid' }} className="flex flex-col gap-1 py-2">
            { role &&
                <div className="text-[10px] uppercase tracking-widest font-[Lato-Bold] text-black/75 mb-1">
                    { role }
                </div>
            }

            {/* Field label sits directly above the signing line. */}
            <div className="text-[10px] text-black/60 font-[Lato-Regular]">
                { label }
            </div>

            {/* Signing line: space above the rule is where the pen goes. */}
            <div style={{ height: 36, borderBottom: '1px solid rgba(0,0,0,0.85)' }} />
        </div>
    );
}

// Field grid entry cell (preview)
const FieldGridEntryCell = ({ entry, tokens, layout, labelWidth, valueStyle, compact }: {
    entry: FieldGridEntry;
    tokens: { fieldId: string; fieldLabel: string; fieldType: string }[];
    layout: string;
    labelWidth: number;
    valueStyle: string;
    compact: boolean;
}): ReactElement => {
    const field = entry.fieldId ? tokens.find(t => t.fieldId === entry.fieldId) : undefined;

    if (entry.type === 'spacer') return <div className="min-h-4" />;

    const label = entry.type === 'custom' ? (entry.customLabel ?? '') : (field?.fieldLabel ?? '');
    const labelStyle: React.CSSProperties = {
        fontWeight: entry.labelBold ? 'bold' : 'normal',
        textAlign: entry.labelAlign ?? 'left',
    };
    const valDeco = valueStyle === 'underline' ? 'border-b border-black/20' : valueStyle === 'box' ? 'border border-black/15 px-1' : '';

    if (entry.type === 'checkbox') {
        return (
            <div className={`flex items-center gap-1.5 ${compact ? 'py-0.5' : 'py-1'}`}>
                <PreviewCheckbox />
                <span className="text-xs text-black/60" style={labelStyle}>{label}</span>
            </div>
        );
    }
    if (entry.type === 'radio') {
        return (
            <div className={`flex items-center gap-1.5 ${compact ? 'py-0.5' : 'py-1'}`}>
                <PreviewRadio />
                <span className="text-xs text-black/60" style={labelStyle}>{label}</span>
            </div>
        );
    }
    // For "box" style the FieldUnderline would nest a border inside a border —
    // render plain text in that case, the wrapping box already provides framing.
    const renderValue = (): ReactElement => {
        if (entry.type === 'custom') {
            return <span className="text-xs text-black/55">{entry.customValue || '—'}</span>;
        }
        if (valueStyle === 'box') {
            return <span className="text-xs text-black/35">&nbsp;</span>;
        }
        return <FieldUnderline compact={compact} />;
    };

    if (layout === 'value-only') {
        return (
            <div className={`flex items-center ${compact ? 'py-0.5' : 'py-1'}`}>
                <span className={`text-xs inline-flex items-center flex-1 min-w-12 ${valDeco}`}>
                    {renderValue()}
                </span>
            </div>
        );
    }
    if (layout === 'stacked') {
        return (
            <div className={compact ? 'py-0.5' : 'py-1'}>
                <div className="text-[10px] text-black/55 mb-0.5" style={labelStyle}>{label}</div>
                <div className={`flex items-center text-xs ${valDeco}`}>
                    {renderValue()}
                </div>
            </div>
        );
    }
    return (
        <div className={`flex items-baseline gap-2 ${compact ? 'py-0.5' : 'py-1'}`}>
            <span className="text-xs text-black/60 shrink-0" style={{ ...labelStyle, width: `${labelWidth}%` }}>{label}:</span>
            <span className={`flex items-center text-xs flex-1 ${valDeco}`}>
                {renderValue()}
            </span>
        </div>
    );
};

// Field grid preview (full grid rendering)
const FieldGridPreview = ({ block }: { block: ExportBlock }): ReactElement => {
    const { state } = useExportLayout();
    const entries = block.settings.gridEntries ?? [];
    const columns = block.settings.gridColumns ?? 2;
    const showBorders = block.settings.gridShowBorders ?? true;
    const borderColor = block.settings.gridBorderColor ?? '#e5e7eb';
    const layout = block.settings.gridLayout ?? 'label-value';
    const labelWidth = block.settings.gridLabelWidth ?? 40;
    const valueStyle = block.settings.gridValueStyle ?? 'underline';
    const compact = block.settings.gridCompact ?? false;

    // Build rows from entries considering colSpan
    const gridCells: (FieldGridEntry | null)[][] = [];
    let currentRow: (FieldGridEntry | null)[] = [];
    let colPos = 0;
    for (const entry of entries) {
        const span = entry.colSpan ?? 1;
        if (colPos + span > columns && currentRow.length > 0) {
            while (currentRow.length < columns) currentRow.push(null);
            gridCells.push(currentRow);
            currentRow = [];
            colPos = 0;
        }
        currentRow.push(entry);
        colPos += span;
        for (let i = 1; i < span && currentRow.length < columns; i++) currentRow.push(null);
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

    if (entries.length === 0) {
        return <EmptyState icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Empty field grid" />;
    }

    return (
        <div style={{ border: showBorders ? `1px solid ${borderColor}` : 'none' }} className="overflow-hidden">
            <div className="grid text-xs" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                { gridCells.flatMap(row =>
                    row.map((cell) => {
                        if (!cell) return null;
                        const span = cell.colSpan ?? 1;
                        return (
                            <div key={cell.id}
                                style={{
                                    gridColumn: span > 1 ? `span ${span}` : undefined,
                                    borderColor: showBorders ? borderColor : undefined,
                                    padding: compact ? '2px 6px' : '4px 8px',
                                }}
                                className={showBorders ? 'border-b border-r last:border-r-0' : ''}
                            >
                                <FieldGridEntryCell
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
    );
};

// Form grid cell content (preview)
const FormGridCellPreview = ({ cell, tokens }: { cell: FormGridCell; tokens: { fieldId: string; fieldLabel: string; fieldType: string }[] }): ReactElement => {
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
            return <span style={style}>{cell.label ?? ''}</span>;
        case 'field':
            return (
                <span style={style} className="flex items-center text-black/40 w-full">
                    { field ? <FieldUnderline /> : null }
                </span>
            );
        case 'checkbox':
            return (
                <span style={style} className="flex items-center gap-1.5 text-black/60">
                    <PreviewCheckbox />
                    { field?.fieldLabel ?? '' }
                </span>
            );
        default:
            return <span />;
    }
};

// Form grid preview (full table rendering)
const FormGridPreview = ({ block }: { block: ExportBlock }): ReactElement => {
    const { state } = useExportLayout();
    const gridRows = block.settings.formGridRows ?? [];
    const columns = block.settings.formGridColumns ?? 4;
    const columnWidths = block.settings.formGridColumnWidths ?? Array.from({ length: columns }, () => 100 / columns);
    const borderColor = block.settings.formGridBorderColor ?? '#d1d5db';
    const borderWidth = block.settings.formGridBorderWidth ?? 1;
    const cellPadding = block.settings.formGridCellPadding ?? 6;
    const outerBorder = block.settings.formGridOuterBorder ?? true;

    // Build hidden cells set (covered by rowspan/colspan).
    // Use ci directly as column index since each row has one cell per column.
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

    return (
        <table className="w-full border-collapse text-xs"
            style={{ tableLayout: 'fixed', border: outerBorder ? `${borderWidth}px solid ${borderColor}` : 'none' }}
        >
            <colgroup>
                { columnWidths.map((w, i) => (
                    <col key={i} style={{ width: `${w}%` }} />
                ))}
            </colgroup>
            <tbody>
                { gridRows.map(row => (
                    <tr key={row.id} style={row.height ? { height: row.height } : undefined}>
                        { row.cells.map(cell => {
                            if (hiddenCells.has(cell.id)) return null;
                            const cs = cell.colspan ?? 1;
                            const rs = cell.rowspan ?? 1;
                            return (
                                <td key={cell.id}
                                    colSpan={cs > 1 ? cs : undefined}
                                    rowSpan={rs > 1 ? rs : undefined}
                                    style={{
                                        border: `${borderWidth}px solid ${borderColor}`,
                                        padding: cellPadding,
                                        backgroundColor: cell.backgroundColor || undefined,
                                        verticalAlign: 'middle',
                                    }}
                                >
                                    <FormGridCellPreview cell={cell} tokens={state.tokens} />
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

// Individual block previews
const BlockPreview = ({ block, forPrint }: { block: ExportBlock; forPrint?: boolean }): ReactElement | null => {
    /** Export layout api utilities */
    /** Export layout api utilities */
    const { state } = useExportLayout();

    switch (block.type) {
        case 'RICH_TEXT':
            return <RichTextPreview content={block.content} />;
        case 'TABLE': {
            const field = state.tokens.find(t => t.fieldId === block.sourceFieldId);
            const rawCols = field?.columns ?? [];

            // Apply tableColumns config: filter hidden, respect order + widths
            const displayCols = block.settings.tableColumns?.length
                ? block.settings.tableColumns
                    .filter(tc => tc.visible)
                    .map(tc => {
                        const raw = rawCols.find(c => c.id === tc.colId);
                        return { id: tc.colId, name: raw?.name ?? tc.label, widthPct: tc.widthPct, type: raw?.type };
                    })
                : rawCols.map(c => ({ id: c.id, name: c.name, widthPct: undefined, type: c.type }));
            const hasColumns = displayCols.length > 0;

            const hasBorder = block.settings.borderStyle !== 'none';

            return (
                <div className={`border overflow-hidden text-xs ${ hasBorder ? 'border-black/15' : 'border-transparent'}`}>
                    { block.settings.hasHeaderRow !== false && hasColumns &&
                        <div className={`flex font-[Lato-Bold] text-black/70 bg-black/1 ${ hasBorder ? 'border-b border-black/15' : '' }`}>
                            { displayCols.map(col => (
                                <div key={col.id} className="px-3 py-1.5" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
                                    {col.name}
                                </div>
                            ))}
                        </div>
                    }
                    { block.settings.hasHeaderRow !== false && !hasColumns &&
                        <div className="px-3 py-1.5 font-[Lato-Bold] text-black/70 bg-black/1 border-b border-black/15">
                            { field?.fieldLabel ?? 'Unbound Table' }
                        </div>
                    }
                    { [1, 2].map(i => {
                            // Row 2 is a faded "more data" hint.
                            const tone = i === 1 ? 'text-black/60' : 'text-black/35';
                            return (
                                <div key={i}
                                    className={`flex ${tone} ${ hasBorder ? 'border-b border-black/8 last:border-0' : ''}
                                        ${block.settings.alternatingRows && i % 2 === 0 ? 'bg-black/2' : ''}
                                    `}
                                >
                                    { hasColumns ?
                                        displayCols.map(col => (
                                            <div key={col.id} className="px-3 py-2 truncate" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
                                                { sampleForColumn(col.name, i, col.type) }
                                            </div>
                                        ))
                                    :
                                        <div className="px-3 py-2 w-full">
                                            { getRenderIntent() === 'export' ? '' : (i === 1 ? 'Sample row' : '…') }
                                        </div>
                                    }
                                </div>
                            );
                        })
                    }
                </div>
            );
        }
        case 'SIGNATURE':
            return <SignaturePadPreview block={block} forPrint={forPrint} />;
        case 'FIELD_GRID':
            return <FieldGridPreview block={block} />;
        case 'FORM_GRID':
            return <FormGridPreview block={block} />;
        case 'BLANK':
            return <div />;
        default:
            return null;
    }
}

// Row preview (renders cells side-by-side)
const RowPreview = ({ row, showConditional, forPrint }: { row: ExportRow; showConditional?: boolean; forPrint?: boolean }): ReactElement => {
    return (
        <div className="flex gap-3">
            { row.cells.map(cell => {
                const s = cell.block.settings;
                const isConditional = !!cell.block.conditionalFieldId;

                // In preview: conditionally-hidden blocks are dimmed or hidden
                if ( isConditional && !showConditional ) return null;

                return (
                    <div key={cell.id} className={isConditional && showConditional ? 'relative' : undefined}
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
                            borderStyle: s.borderStyleDecoration || (s.borderWidth ? 'solid' : undefined),
                            borderRadius: s.borderRadius ?? undefined,
                        }}
                    >
                        {/* Conditional overlay */}
                        { isConditional && showConditional &&
                            <div className="absolute inset-0 bg-black/5 rounded pointer-events-none z-10 flex items-start justify-end p-1">
                                <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-[Lato-Bold]">
                                    Conditional
                                </span>
                            </div>
                        }
                        <BlockPreview block={cell.block} forPrint={forPrint} />
                    </div>
                );
            })}
        </div>
    );
}

// Header / footer bands
const HeaderBand = (): ReactElement | null => {
    /** Export layout api utilities */
    const { state } = useExportLayout();
    /** Page configuration */
    const { pageConfig } = state;

    if (!pageConfig.showHeader) return null;

    const logoWidth = pageConfig.logoWidth ?? 40;
    const headerHtml = pageConfig.headerContent ? renderZoneText(pageConfig.headerContent) : '';

    const hasLogo = pageConfig.showLogo && pageConfig.logoUrl;

    // Nothing to render — don't reserve space for empty header chrome.
    if (!hasLogo && !headerHtml) return null;

    return (
        <div className="flex items-start gap-3 pb-2 mb-3 text-xs text-black/55">
            { pageConfig.showLogo && pageConfig.logoUrl &&
                <img src={pageConfig.logoUrl} alt="Logo" className="shrink-0 object-contain rounded" style={{ width: logoWidth, height: logoWidth }} />
            }

            { headerHtml &&
                <div className="export-rich-content flex-1 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: headerHtml }} />
            }
        </div>
    );
}

const FooterBand = ({ pageNum, totalPages }: { pageNum: number; totalPages: number }): ReactElement | null => {
    /** Export layout api utilities */
    const { state } = useExportLayout();
    /** Page configuration */
    const { pageConfig } = state;

    if (!pageConfig.showFooter) return null;

    const pos = pageConfig.pageNumberPosition;
    const pageLabel = pos !== 'none' ? `Page ${pageNum} of ${totalPages}` : null;
    const footerHtml = pageConfig.footerContent ? renderZoneText(pageConfig.footerContent) : '';

    // Nothing to render — don't reserve space for empty footer chrome.
    if (!footerHtml && !pageLabel) return null;

    return (
        <div className="pt-2 mt-3 text-xs text-black/55">
            { footerHtml &&
                <div className="export-rich-content mb-1 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: footerHtml }} />
            }

            { pageLabel &&
                <div className={pos === 'center' ? 'text-center' : pos === 'right' ? 'text-right' : 'text-left'}>
                    { pageLabel }
                </div>
            }
        </div>
    );
}

// Watermark
const Watermark = ({ text, pageWidth, color, opacity }: { text: string; pageWidth: number; color?: string; opacity?: number }): ReactElement | null => {
    if (!text) return null;
    
    const maxWidth = pageWidth * 0.85;
    const calculated = Math.floor(maxWidth / (text.length * WATERMARK_CHAR_FACTOR));
    const size = Math.min(WATERMARK_MAX_FONT_PX, Math.max(WATERMARK_MIN_FONT_PX, calculated));

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
            <span
                className="font-[Lato-Black] uppercase tracking-widest text-center"
                style={{ fontSize: size, transform: 'rotate(-35deg)', maxWidth: '90%', wordBreak: 'break-word', color: color ?? '#000000', opacity: opacity ?? 0.08 }}
            >
                { text }
            </span>
        </div>
    );
}

// Sidebar brand band
const SidebarBand = ({ pageHeight }: { pageHeight: number }): ReactElement | null => {
    const { state } = useExportLayout();
    const { pageConfig } = state;

    if (!pageConfig.showSidebar) return null;

    const position = pageConfig.sidebarPosition ?? 'left';
    const widthMm = pageConfig.sidebarWidth ?? 8;
    const widthPx = widthMm * PX_PER_MM;
    const bgColor = pageConfig.sidebarColor ?? '#1a1a2e';
    const textColor = pageConfig.sidebarTextColor ?? '#ffffff';
    const fontSize = pageConfig.sidebarFontSize ?? 14;
    const text = pageConfig.sidebarText ?? '';

    return (
        <div className="absolute top-0 bottom-0 z-20 flex items-center justify-center overflow-hidden"
            style={{
                [position]: 0,
                width: widthPx,
                height: pageHeight,
                backgroundColor: bgColor,
            }}
        >
            { text &&
                <span className="font-[Lato-Black] uppercase tracking-[0.25em] whitespace-nowrap select-none"
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                        color: textColor,
                        fontSize,
                        maxHeight: '90%',
                        overflow: 'hidden',
                    }}
                >
                    {text}
                </span>
            }
        </div>
    );
};

// Helpers
const arrEq = (a: number[], b: number[]): boolean => {
    if ( a.length !== b.length ) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}

// Preview mode with automatic pagination
const PreviewMode = ({ forPrint = false }: { forPrint?: boolean } = {}): ReactElement => {
    /** Export layout api utilities */
    const { state, paginatedPagesRef } = useExportLayout();
    /** Page configuraitons */
    const { pageConfig, rows } = state;
    /** State to manage the conditional rendering */
    const [showConditional, setShowConditional] = useState(true);

    /** Page layout configuration */
    const dims       = PAGE_DIMS[pageConfig.pageSize];
    const pageWidth  = dims.width;
    const pageHeight = dims.height;
    const { top, right, bottom, left } = pageConfig.margins;

    // Sidebar band offsets
    const hasSidebar = pageConfig.showSidebar;
    const sidebarWidthMm = hasSidebar ? (pageConfig.sidebarWidth ?? 8) : 0;
    const sidebarPos = pageConfig.sidebarPosition ?? 'left';
    const effectiveLeft = sidebarPos === 'left' ? left + sidebarWidthMm : left;
    const effectiveRight = sidebarPos === 'right' ? right + sidebarWidthMm : right;

    const contentWidth     = pageWidth - (effectiveLeft + effectiveRight) * PX_PER_MM;
    const contentAreaHeight = pageHeight - (top + bottom) * PX_PER_MM;

    const wmText    = pageConfig.watermark ?? '';
    const wmColor   = pageConfig.watermarkColor ?? '#000000';
    const wmOpacity = pageConfig.watermarkOpacity ?? WATERMARK_DEFAULT_OPACITY;

    const contentRows = useMemo(() => rows, [rows]);

    // Measurement refs
    const rowMeasureRef = useRef<HTMLDivElement>(null);
    const headerMeasureRef = useRef<HTMLDivElement>(null);
    const footerMeasureRef = useRef<HTMLDivElement>(null);

    const [rowHeights, setRowHeights] = useState<number[]>([]);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);

    // Shared measurement function
    const measure = () => {
        const container = rowMeasureRef.current;
        if ( container ) {
            const heights: number[] = [];
            for (let i = 0; i < container.children.length; i++) {
                heights.push((container.children[i] as HTMLElement).offsetHeight);
            }
            setRowHeights(prev => arrEq(prev, heights) ? prev : heights);
        } else {
            setRowHeights(prev => prev.length === 0 ? prev : []);
        }

        const hh = headerMeasureRef.current?.offsetHeight ?? 0;
        setHeaderHeight(prev => prev === hh ? prev : hh);

        const fh = footerMeasureRef.current?.offsetHeight ?? 0;
        setFooterHeight(prev => prev === fh ? prev : fh);
    };

    // Measure everything synchronously before browser paints.
    useLayoutEffect(() => {
        measure();
    }, [contentRows, pageConfig]);

    // Re-measure after fonts load (initial measurement can be wrong with custom fonts)
    useEffect(() => {
        document.fonts.ready.then(() => measure());
    }, [contentRows]);

    // Available height for content rows on each page
    const availableHeight = contentAreaHeight - headerHeight - footerHeight;

    // Paginate rows based on measured heights + explicit page breaks.
    // Oversized rows (taller than a single page) produce continuation slices.
    const pages: PageSlice[] = useMemo(() => {
        if ( rows.length === 0 ) return [{ rows: [], yOffset: 0 }];

        const heights = rowHeights;
        const result: PageSlice[] = [{ rows: [], yOffset: 0 }];
        let currentHeight = 0;
        let contentIdx = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const rowH = heights[contentIdx] || 40;
            const gap  = result[result.length - 1].rows.length > 0 ? ROW_GAP_PX : 0;

            // If this row doesn't fit and the page isn't empty, push to next page
            if ( availableHeight > 0 && currentHeight + gap + rowH > availableHeight && result[result.length - 1].rows.length > 0 ) {
                result.push({ rows: [], yOffset: 0 });
                currentHeight = 0;
            }

            // Oversized row: spans multiple pages via continuation slices
            if ( availableHeight > 0 && rowH > availableHeight ) {
                result[result.length - 1].rows.push(row);

                let remaining = rowH - availableHeight;
                let offset = availableHeight;
                while (remaining > 0) {
                    result.push({ rows: [row], yOffset: offset });
                    offset += availableHeight;
                    remaining -= availableHeight;
                }

                // Next rows start on a fresh page
                result.push({ rows: [], yOffset: 0 });
                currentHeight = 0;
            } else {
                result[result.length - 1].rows.push(row);
                currentHeight += (result[result.length - 1].rows.length === 1 ? 0 : ROW_GAP_PX) + rowH;
            }

            contentIdx++;
        }

        // Remove trailing empty page
        if ( result.length > 1 && result[result.length - 1].rows.length === 0 ) {
            result.pop();
        }

        return result;
    }, [rows, availableHeight, rowHeights]);

    // Publish pagination result so the forPrint instance can reuse it
    useEffect(() => {
        if (!forPrint) {
            paginatedPagesRef.current = pages;
        }
    }, [forPrint, pages, paginatedPagesRef]);

    // For the print instance: prefer the shared pagination from the visible preview
    const resolvedPages = forPrint && paginatedPagesRef.current ? paginatedPagesRef.current : pages;
    const totalPages = resolvedPages.length;

    // Check if any block has conditional visibility set
    const hasConditionalBlocks = rows.some(r => r.cells.some(c => !!c.block.conditionalFieldId));

    /** Shared paper page renderer used by both screen and print modes. */
    const renderPage = (page: PageSlice, pageIdx: number) => (
        <div key={pageIdx}
            className={`export-page-paper bg-white relative ${forPrint ? '' : 'overflow-hidden'}`}
            style={{
                width: pageWidth,
                height: pageHeight,
                padding: `${top}mm ${effectiveRight}mm ${bottom}mm ${effectiveLeft}mm`,
                boxShadow: forPrint ? 'none' : '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
                // Page break hints (both modern + legacy for browser compat)
                breakAfter: forPrint && pageIdx < totalPages - 1 ? 'page' : 'auto',
                pageBreakAfter: forPrint && pageIdx < totalPages - 1 ? 'always' : 'auto',
            }}
        >
            <SidebarBand pageHeight={pageHeight} />
            <Watermark text={wmText} pageWidth={pageWidth} color={wmColor} opacity={wmOpacity} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="shrink-0">
                    <HeaderBand />
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-hidden" style={{ minHeight: 0 }}>
                    { page.rows.length === 0 ?
                        <div className="py-8">
                            <EmptyState icon={<FileText className="w-4 h-4" />} label="Empty page" />
                        </div>
                    : page.yOffset > 0 ? (
                        /* Continuation slice: render same rows shifted up by yOffset */
                        <div style={{ marginTop: -page.yOffset }}>
                            { page.rows.map(row =>
                                <RowPreview key={row.id} row={row} showConditional={showConditional} forPrint={forPrint} />
                            )}
                        </div>
                    ) :
                        page.rows.map(row =>
                            <RowPreview key={row.id} row={row} showConditional={showConditional} forPrint={forPrint} />
                        )
                    }
                </div>

                <div className="shrink-0">
                    <FooterBand pageNum={pageIdx + 1} totalPages={totalPages} />
                </div>
            </div>
        </div>
    );

    // Shared measurement area — rendered in both screen and print modes so
    // forPrint paginates with real heights, not a 40px fallback.
    const measurementArea = (
        <div aria-hidden="true" className="export-measure-area"
            style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: -9999, top: 0 }}>
            <div ref={headerMeasureRef} style={{ width: contentWidth }}>
                <HeaderBand />
            </div>
            <div ref={footerMeasureRef} style={{ width: contentWidth }}>
                <FooterBand pageNum={1} totalPages={1} />
            </div>
            <div ref={rowMeasureRef} style={{ width: contentWidth }}>
                { contentRows.map(row => (
                    <div key={row.id}>
                        <RowPreview row={row} showConditional={showConditional} />
                    </div>
                ))}
            </div>
        </div>
    );

    // Print mode: block layout (flex breaks CSS page-break behaviour)
    if ( forPrint ) {
        return (
            <div style={{ position: 'relative', display: 'block' }}>
                { measurementArea }
                { resolvedPages.map((page, pageIdx) => renderPage(page, pageIdx)) }
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-[#EBEBEB] flex flex-col items-center py-10 gap-8 px-4">
            {/* Conditional visibility toggle */}
            { hasConditionalBlocks &&
                <div className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-2 shadow-sm">
                    <button onClick={() => setShowConditional(v => !v)}
                        className={`flex items-center gap-1.5 text-xs font-[Lato-Regular] transition-colors ${
                            showConditional ? 'text-amber-600' : 'text-black/40'
                        }`}
                    >
                        { showConditional ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" /> }
                        { showConditional ? 'Showing conditional blocks' : 'Hiding conditional blocks' }
                    </button>
                </div>
            }

            { measurementArea }

            {/* Rendered pages */}
            { resolvedPages.map((page, pageIdx) => (
                <div key={pageIdx} className="flex flex-col">
                    <div className="text-xs text-black/30 text-center mb-2 font-[Lato-Regular] select-none">
                        Page { pageIdx + 1 } of { totalPages }
                    </div>
                    { renderPage(page, pageIdx) }
                </div>
            ))}

            { rows.length === 0 &&
                <div className="text-sm text-black/25 italic text-center py-20 select-none">
                    No content yet — add blocks in the editor.
                </div>
            }
        </div>
    );
}

export default PreviewMode;