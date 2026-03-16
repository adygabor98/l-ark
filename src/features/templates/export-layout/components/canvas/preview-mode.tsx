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
    EyeOff
} from 'lucide-react';
import {
    generateHTML
} from '@tiptap/html';
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
    PageSlice
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
import ProfessionalSignature from './professional-signature';



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

const renderRichText = (content: Record<string, unknown>): string => {
    try {
        const html = generateHTML(content as never, PREVIEW_EXTENSIONS);

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
        return <p className="text-black/30 italic text-sm"> Empty text block </p>;

    const html = renderRichText(content);
    return (
        <div
            className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

// Signature pad (preview/fill mode only)
const SignaturePadPreview = ({ block }: { block: ExportBlock }): ReactElement => {
    /** Export layout api utilities */
    const { state } = useExportLayout();
    /** Link with the token associated */
    const field = state.tokens.find(t => t.fieldId === block.sourceFieldId);
    const width = block.settings.signatureWidth ?? 280;

    return (
        <div style={{ width }} className="flex flex-col gap-1">
            <div className="relative rounded-lg overflow-hidden bg-white">
                <div >
                    <ProfessionalSignature label={field?.fieldLabel ?? 'Signature' } />
                </div>
            </div>
        </div>
    );
}

// Individual block previews
const BlockPreview = ({ block }: { block: ExportBlock }): ReactElement | null => {
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
                        return { id: tc.colId, name: raw?.name ?? tc.label, widthPct: tc.widthPct };
                    })
                : rawCols.map(c => ({ id: c.id, name: c.name, widthPct: undefined }));
            const hasColumns = displayCols.length > 0;

            return (
                <div className={`border rounded-lg overflow-hidden text-xs ${ block.settings.borderStyle === 'none' ? 'border-transparent' : 'border-black/15'}`}>
                    { block.settings.hasHeaderRow !== false && hasColumns &&
                        <div className={`flex font-[Lato-Regular] bg-black/5 ${ block.settings.borderStyle !== 'none' ? 'border-b border-black/10' : '' }`}>
                            { displayCols.map(col => (
                                <div key={col.id} className="px-3 py-1.5" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
                                    {col.name}
                                </div>
                            ))}
                        </div>
                    }
                    { block.settings.hasHeaderRow !== false && !hasColumns &&
                        <div className="px-3 py-1.5 font-[Lato-Regular] bg-black/5 border-b border-black/10">
                            { field?.fieldLabel ?? 'Unbound Table' }
                        </div>
                    }
                    { [1, 2].map(i => (
                        <div key={i}
                            className={`flex text-black/30 italic ${ block.settings.borderStyle !== 'none' ? 'border-b border-black/6 last:border-0' : ''}
                                ${block.settings.alternatingRows && i % 2 === 0 ? 'bg-black/2' : ''}
                            `}
                        >
                            { hasColumns ?
                                displayCols.map(col => (
                                    <div key={col.id} className="px-3 py-2" style={{ flex: col.widthPct ? `0 0 ${col.widthPct}%` : 1 }}>
                                        { col.name } { i }
                                    </div>
                                ))
                            :
                                <div className="px-3 py-2 w-full">
                                    Row { i } data…
                                </div>
                            }
                        </div>
                    ))}
                </div>
            );
        }
        case 'IMAGE':
            return block.imageUrl ?
                <div style={{ textAlign: block.settings.imageAlignment ?? 'left' }}>
                    <img src={block.imageUrl} alt="Document image" style={{ width: block.settings.imageWidth ?? 200, display: 'inline-block' }} className="max-w-full" />
                </div>
            :
                <div className="border border-dashed border-black/15 rounded-lg h-16 flex items-center justify-center text-xs text-black/30">
                    Image placeholder
                </div>
            ;
        case 'SIGNATURE':
            return <SignaturePadPreview block={block} />;
        case 'DIVIDER':
            return <hr style={{ borderTopWidth: block.settings.lineWeight ?? 1, borderColor: block.settings.lineColor ?? '#e5e7eb', borderStyle: 'solid' }} />;
        case 'PAGE_BREAK':
            return null;
        case 'BLANK':
            return <div />;
        default:
            return null;
    }
}

// Row preview (renders cells side-by-side)
const RowPreview = ({ row, showConditional }: { row: ExportRow; showConditional?: boolean }): ReactElement => {
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
                        <BlockPreview block={cell.block} />
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

    return (
        <div className="flex items-start gap-3 pb-2 mb-3 text-xs text-black/50">
            { pageConfig.showLogo && pageConfig.logoUrl ?
                <img src={pageConfig.logoUrl} alt="Logo" className="shrink-0 object-contain rounded" style={{ width: logoWidth, height: logoWidth }} />
            :
                <div className="bg-black/8 rounded flex items-center justify-center text-black/30 text-[10px] shrink-0" style={{ width: logoWidth, height: logoWidth }}>
                    LOGO
                </div>
            }

            { headerHtml &&
                <div className="flex-1 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: headerHtml }} />
            }

            { !headerHtml && !pageConfig.showLogo && <span className="text-black/30 italic"> Header </span> }
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

    return (
        <div className="pt-2 mt-3 border-t border-black/10 text-xs text-black/50">
            { footerHtml &&
                <div className="mb-1 prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: footerHtml }} />
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

    const contentWidth     = pageWidth - (left + right) * PX_PER_MM;
    const contentAreaHeight = pageHeight - (top + bottom) * PX_PER_MM;

    const wmText    = pageConfig.watermark ?? '';
    const wmColor   = pageConfig.watermarkColor ?? '#000000';
    const wmOpacity = pageConfig.watermarkOpacity ?? WATERMARK_DEFAULT_OPACITY;

    // Filter out PAGE_BREAK rows for measurement
    const contentRows = useMemo(() => rows.filter(r => !r.cells.some(c => c.block.type === 'PAGE_BREAK')), [rows]);

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

            // Explicit page break → start a new page
            if ( row.cells.some(c => c.block.type === 'PAGE_BREAK') ) {
                result.push({ rows: [], yOffset: 0 });
                currentHeight = 0;
                continue;
            }

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
                padding: `${top}mm ${right}mm ${bottom}mm ${left}mm`,
                boxShadow: forPrint ? 'none' : '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
                // Page break hints (both modern + legacy for browser compat)
                breakAfter: forPrint && pageIdx < totalPages - 1 ? 'page' : 'auto',
                pageBreakAfter: forPrint && pageIdx < totalPages - 1 ? 'always' : 'auto',
            }}
        >
            <Watermark text={wmText} pageWidth={pageWidth} color={wmColor} opacity={wmOpacity} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="shrink-0">
                    <HeaderBand />
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-hidden" style={{ minHeight: 0 }}>
                    { page.rows.length === 0 ?
                        <p className="text-center text-sm text-black/20 italic py-8"> Empty page </p>
                    : page.yOffset > 0 ? (
                        /* Continuation slice: render same rows shifted up by yOffset */
                        <div style={{ marginTop: -page.yOffset }}>
                            { page.rows.map(row =>
                                <RowPreview key={row.id} row={row} showConditional={showConditional} />
                            )}
                        </div>
                    ) :
                        page.rows.map(row =>
                            <RowPreview key={row.id} row={row} showConditional={showConditional} />
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