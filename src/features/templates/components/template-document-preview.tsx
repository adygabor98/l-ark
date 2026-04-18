import {
    useState,
    useRef,
    useCallback,
    type ReactElement
} from 'react';
import {
    createPortal
} from 'react-dom';
import {
    useFormContext,
    useWatch
} from 'react-hook-form';
import {
    ArrowLeft,
    Download,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    CalendarDays,
    Plus,
    Loader2
} from 'lucide-react';
import {
    format
} from 'date-fns';
import {
    motion,
    AnimatePresence
} from 'framer-motion';
import {
    FIELD_WIDTH_MAP,
    type FieldWidth,
    TemplateComponents
} from '../../../models/template.models';
import Button from '../../../shared/components/button';

interface PropTypes {
    open: boolean;
    onClose: () => void;
}

const TemplateDocumentPreview = (props: PropTypes): ReactElement | null => {
    /** Retrieve component properties */
    const { open, onClose } = props;
    /** Formulary utilities */
    const { control } = useFormContext();
    /** Reference of the document */
    const documentRef = useRef<HTMLDivElement>(null);
    /** State to manage the zoom of the document */
    const [zoom, setZoom] = useState<number>(1);
    /** State to manage the loading of the exporting template */
    const [isExporting, setIsExporting] = useState<boolean>(false);
    /** Watch all form data reactively */
    const title = useWatch({ control, name: 'title' }) || 'Untitled Template';
    const description = useWatch({ control, name: 'description' }) || '';
    const sections: any[] = useWatch({ control, name: 'sections' }) ?? [];

    /** Export the form preview to PDF using html-to-image + jsPDF.
     *  html-to-image uses the browser's native CSS engine so it handles
     *  Tailwind v4 oklab/oklch colors without issues. */
    const handleExportPdf = useCallback(async () => {
        if (!documentRef.current) return;

        setIsExporting(true);

        try {
            const [{ toPng }, { default: jsPDF }] = await Promise.all([
                import('html-to-image'),
                import('jspdf'),
            ]);

            const el = documentRef.current;
            const scrollParent = el.parentElement;

            // --- Temporarily reset styles for clean measurement & capture ---
            const prevTransform = el.style.transform;
            const prevTransformOrigin = el.style.transformOrigin;
            const prevShadow = el.style.boxShadow;
            const prevMarginBottom = el.style.marginBottom;
            const prevMarginLeft = el.style.marginLeft;
            const prevMarginRight = el.style.marginRight;
            el.style.transform = 'none';
            el.style.transformOrigin = '';
            el.style.boxShadow = 'none';
            el.style.marginBottom = '0';
            el.style.marginLeft = '0';
            el.style.marginRight = '0';

            // Hide the HTML DRAFT watermark during capture (we draw per-page watermarks on canvas)
            const watermarkEl = el.querySelector<HTMLElement>('[data-watermark]');
            if (watermarkEl) watermarkEl.style.display = 'none';

            const prevScrollTop = scrollParent?.scrollTop ?? 0;
            const prevScrollLeft = scrollParent?.scrollLeft ?? 0;
            if (scrollParent) {
                scrollParent.scrollTop = 0;
                scrollParent.scrollLeft = 0;
            }

            await new Promise(r => requestAnimationFrame(r));

            // --- A4 dimensions in px (96 DPI) ---
            const PAGE_W = 794;
            const PAGE_H = 1123;
            const PAD_TOP = 48;
            const PAD_BOTTOM = 56;
            const FOOTER_RESERVE = 80; // extra space so canvas-drawn footer doesn't overlap content
            const CONTENT_H = PAGE_H - PAD_TOP - PAD_BOTTOM - FOOTER_RESERVE; // usable height per page

            // --- Capture the full document as one tall image ---
            const fullDataUrl = await toPng(el, {
                width: PAGE_W,
                pixelRatio: 2,
                backgroundColor: '#FFFFFF',
            });

            // Restore styles immediately
            el.style.transform = prevTransform;
            el.style.transformOrigin = prevTransformOrigin;
            el.style.boxShadow = prevShadow;
            el.style.marginBottom = prevMarginBottom;
            el.style.marginLeft = prevMarginLeft;
            el.style.marginRight = prevMarginRight;
            if (watermarkEl) watermarkEl.style.display = '';
            if (scrollParent) {
                scrollParent.scrollTop = prevScrollTop;
                scrollParent.scrollLeft = prevScrollLeft;
            }

            // Load image to get full dimensions
            const fullImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = fullDataUrl;
            });

            const SCALE = fullImg.naturalWidth / PAGE_W; // pixelRatio-aware scale
            const totalContentPx = fullImg.naturalHeight / SCALE; // total height in CSS px

            // --- Find safe page-break Y positions ---
            // Collect bottom edges of all leaf-level block elements inside the document
            const elRect = el.getBoundingClientRect();
            const breakCandidates: number[] = [];

            // Walk all direct children of sections + fields (the grid items)
            const allBlocks = el.querySelectorAll<HTMLElement>(
                '.document-section, .document-section > div, .document-section .grid > div, [data-document-page] > div'
            );
            allBlocks.forEach(block => {
                const r = block.getBoundingClientRect();
                const bottomRelative = r.bottom - elRect.top;
                breakCandidates.push(bottomRelative);
            });

            // Sort and deduplicate
            breakCandidates.sort((a, b) => a - b);

            // --- Determine page slicing positions ---
            const slices: { yStart: number; yEnd: number }[] = [];
            let cursor = 0;

            while (cursor < totalContentPx) {
                const idealEnd = cursor + (cursor === 0 ? PAGE_H - FOOTER_RESERVE : CONTENT_H + PAD_TOP);
                if (idealEnd >= totalContentPx) {
                    // Last page — take the rest
                    slices.push({ yStart: cursor, yEnd: totalContentPx });
                    break;
                }

                // Find the largest break candidate that fits within idealEnd
                let bestBreak = idealEnd;
                for (let i = breakCandidates.length - 1; i >= 0; i--) {
                    if (breakCandidates[i] <= idealEnd && breakCandidates[i] > cursor + PAD_TOP) {
                        bestBreak = breakCandidates[i];
                        break;
                    }
                }

                slices.push({ yStart: cursor, yEnd: bestBreak });
                cursor = bestBreak;
            }

            // --- Render each slice into a PDF page using canvas cropping ---
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const A4_W_MM = 210;
            const A4_H_MM = 297;

            for (let i = 0; i < slices.length; i++) {
                const { yStart, yEnd } = slices[i];
                const sliceH = yEnd - yStart;

                // Create a canvas for this page slice
                const canvas = document.createElement('canvas');
                canvas.width = PAGE_W * 2;   // match pixelRatio: 2
                canvas.height = PAGE_H * 2;
                const ctx = canvas.getContext('2d')!;

                // White background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Calculate vertical offset to center the content slice on the page
                const yPadding = i === 0 ? 0 : (PAD_TOP * SCALE);
                const srcY = yStart * SCALE;
                const srcH = sliceH * SCALE;

                // Draw the relevant portion of the full image
                ctx.drawImage(
                    fullImg,
                    0, srcY,                          // source x, y
                    fullImg.naturalWidth, srcH,       // source w, h
                    0, yPadding,                      // dest x, y (add top padding on pages after first)
                    canvas.width, sliceH * SCALE,     // dest w, h
                );

                // Draw brand accent strip at top of continuation pages
                if (i > 0) {
                    ctx.fillStyle = '#FFBF00';
                    ctx.fillRect(0, 0, canvas.width, 3 * SCALE);
                }

                // Draw DRAFT watermark centered on each page
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-30 * Math.PI / 180);
                ctx.font = `bold ${120 * SCALE}px Lato, sans-serif`;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.letterSpacing = `${0.3 * 120 * SCALE}px`;
                ctx.fillText('DRAFT', 0, 0);
                ctx.restore();

                // Draw page footer: title | page number | date
                const footerY = canvas.height - (20 * SCALE);
                const footerLineY = footerY - (16 * SCALE);
                const footerPadX = 56 * SCALE;
                ctx.save();
                // Footer separator line
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(footerPadX, footerLineY);
                ctx.lineTo(canvas.width - footerPadX, footerLineY);
                ctx.stroke();
                // Footer text
                ctx.font = `${9 * SCALE}px Lato, sans-serif`;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.letterSpacing = `${0.5 * SCALE}px`;
                // Left: title
                ctx.textAlign = 'left';
                ctx.fillText(title.toUpperCase(), footerPadX, footerY);
                // Center: page number
                ctx.textAlign = 'center';
                ctx.fillText(`Page ${i + 1} of ${slices.length}`, canvas.width / 2, footerY);
                // Right: date
                ctx.textAlign = 'right';
                const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                ctx.fillText(dateStr, canvas.width - footerPadX, footerY);
                ctx.restore();

                const pageDataUrl = canvas.toDataURL('image/png');

                if (i > 0) pdf.addPage();
                pdf.addImage(pageDataUrl, 'PNG', 0, 0, A4_W_MM, A4_H_MM);
            }

            pdf.save(`${title.replace(/\s+/g, '_')}_template.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
            alert(`PDF export failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsExporting(false);
        }
    }, [title]);

    if (!open) return null;
    
    const overlayRoot = document.getElementById('content-overlay-root');
    
    if (!overlayRoot) return null;

    return createPortal(
        <AnimatePresence>
            { open &&
                <motion.div
                    key="document-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-50 flex flex-col bg-[#E8E9ED]"
                    data-document-preview
                >
                    <header className="h-14 bg-white border-b border-black/8 flex items-center px-6 shrink-0 shadow-sm print:hidden">
                        {/* Left */}
                        <div className="flex-1 flex items-center gap-4 min-w-0">
                            <Button variant="ghost" onClick={onClose} className="gap-2 shrink-0">
                                <ArrowLeft className="w-4 h-4" /> Back to Builder
                            </Button>
                            <div className="h-6 w-px bg-black/10 shrink-0" />
                            <span className="text-sm font-[Lato-Regular] text-black/50 truncate"> Document Preview </span>
                        </div>

                        {/* Center: Zoom controls */}
                        <div className="flex items-center gap-1 shrink-0 px-4">
                            <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1)))}
                                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-black/50 hover:text-black transition-colors"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>

                            <span className="text-xs font-[Lato-Regular] text-black/50 min-w-12 text-center select-none">
                                { Math.round(zoom * 100) }%
                            </span>
                            <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
                                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-black/50 hover:text-black transition-colors"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button onClick={() => setZoom(1)}
                                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-black/50 hover:text-black transition-colors ml-1"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                            <Button variant="primary" onClick={handleExportPdf} disabled={isExporting} className="gap-2 shrink-0">
                                { isExporting ? 
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Exporting...
                                    </> 
                                :
                                    <>
                                        <Download className="w-4 h-4" />
                                        Export PDF
                                    </>
                                }
                            </Button>
                        </div>
                    </header>

                    {/* Document Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
                        <div
                            ref={documentRef}
                            data-document-page
                            className="bg-white mx-auto shadow-[0_2px_20px_rgba(0,0,0,0.08)] print:shadow-none relative"
                            style={{
                                width: '794px',
                                minHeight: '1123px',
                                padding: '48px 56px 56px 56px',
                                fontSize: '12px',
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top center',
                                marginBottom: zoom !== 1 ? `${(zoom - 1) * 1123}px` : undefined,
                            }}
                        >
                            {/* Brand accent strip */}
                            <div className="absolute top-0 left-0 right-0 h-0.75 bg-[#FFBF00]" />

                            {/* DRAFT Watermark */}
                            <div data-watermark className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden print:hidden">
                                <span className="text-[120px] font-[Lato-Bold] text-black/3 rotate-[-30deg] select-none uppercase tracking-[0.3em]">
                                    DRAFT
                                </span>
                            </div>

                            {/* Document Header */}
                            <div className="mb-4 relative">
                                <h1 className="text-[15px] font-[Lato-Black] tracking-tight uppercase text-black/90"> { title } </h1>
                                { description &&
                                    <p className="text-[10px] text-black/45 font-[Lato-Regular] mt-0.5 max-w-120"> { description } </p>
                                }
                                <div className="mt-2 h-px bg-black/10" />
                            </div>

                            {/* Document Body: Sections */}
                            <div className="space-y-5">
                                { sections.filter(s => s?.fields).map((section: any, idx: number) => (
                                    <div key={section.id} className="document-section">
                                        { idx > 0 && <div className="page-break-before" /> }

                                        <div className="mb-2.5 flex items-start gap-2">
                                            <div className="w-0.75 self-stretch bg-[#FFBF00] rounded-full shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[9px] font-[Lato-Bold] text-black/30 uppercase tracking-widest">
                                                    Section {idx + 1}
                                                </span>
                                                { section.title &&
                                                    <h2 className="text-[13px] font-[Lato-Black] tracking-tight text-black/85 leading-tight"> { section.title } </h2>
                                                }
                                                { section.description &&
                                                    <p className="text-[10px] text-black/45 font-[Lato-Regular] mt-0.5"> { section.description } </p>
                                                }
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 gap-x-2 gap-y-2">
                                            { section.fields.map((field: any) => {
                                                const isInlineLayout = field.type === TemplateComponents.RADIO_GROUP
                                                    || field.type === TemplateComponents.SIGNATURE
                                                    || field.type === TemplateComponents.CHECKBOX;
                                                return (
                                                <div key={field.id} className={`w-full ${isInlineLayout ? 'flex flex-row items-start gap-3' : 'flex flex-col gap-1'} ${FIELD_WIDTH_MAP[(field.width as FieldWidth)] || 'col-span-12'}`}>
                                                    {/* Field Label + Help + Validation */}
                                                    { field.type !== TemplateComponents.DESCRIPTION &&
                                                        <div className={isInlineLayout ? 'shrink-0 w-35 pt-1' : ''}>
                                                            <label className="flex items-center text-[11px] font-[Lato-Bold] text-black/80 leading-tight">
                                                                { field.label } { field.required && <span className="text-red-500 ml-0.5 text-[10px]"> * </span> }
                                                            </label>
                                                            { field.helpText &&
                                                                <p className="text-[10px] text-black/40 mt-0.5 font-[Lato-Regular] leading-tight"> { field.helpText } </p>
                                                            }
                                                        </div>
                                                    }

                                                    {/* ── Field Widgets ── */}
                                                    { field.type === TemplateComponents.TEXT &&
                                                        <input readOnly placeholder={field.placeholder} className="h-7 w-full bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                    }
                                                    { field.type === TemplateComponents.TEXTAREA &&
                                                        <textarea readOnly placeholder={field.placeholder} className="min-h-50 w-full bg-transparent border-b border-black/15 text-[11px] px-1 pt-1 outline-none resize-none" />
                                                    }
                                                    { field.type === TemplateComponents.NUMBER &&
                                                        <input readOnly type="number" placeholder={field.placeholder} className="h-7 w-full bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                    }
                                                    { field.type === TemplateComponents.CURRENCY &&
                                                        <div className="flex items-center h-7 border-b border-black/15">
                                                            <span className="text-[11px] text-black/40 font-[Lato-Bold] pl-1 pr-1">€</span>
                                                            <input readOnly placeholder={field.placeholder || '0.00'} className="h-full flex-1 bg-transparent text-[11px] px-1 outline-none" />
                                                        </div>
                                                    }
                                                    { field.type === TemplateComponents.PERCENTAGE &&
                                                        <div className="flex items-center h-7 border-b border-black/15">
                                                            <input readOnly placeholder={field.placeholder || '0'} className="h-full flex-1 bg-transparent text-[11px] px-1 outline-none" />
                                                            <span className="text-[11px] text-black/40 font-[Lato-Bold] pr-1 pl-1">%</span>
                                                        </div>
                                                    }
                                                    { field.type === TemplateComponents.EMAIL &&
                                                        <input readOnly placeholder={field.placeholder || 'email@example.com'} className="h-7 w-full bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                    }
                                                    { field.type === TemplateComponents.PHONE &&
                                                        <input readOnly placeholder={field.placeholder || '+34 ...'} className="h-7 w-full bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                    }

                                                    { field.type === TemplateComponents.SELECT &&
                                                        <div className="h-7 flex items-center justify-between w-full border-b border-black/15 px-1 text-black/35 text-[11px]">
                                                            <span>Select...</span>
                                                            <svg className="w-3 h-3 text-black/25" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5l3 3 3-3"/></svg>
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.RADIO_GROUP &&
                                                        <div className="flex-1 flex flex-wrap gap-1">
                                                            { (field.options || []).map((opt: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-1.5 py-1 px-2 border border-black/8 bg-black/1 rounded-sm">
                                                                    <div className="w-3 h-3 rounded-full border border-black/20 bg-white shrink-0" />
                                                                    <label className="text-[11px] font-[Lato-Regular] whitespace-nowrap"> { opt.label ?? opt.value ?? '' } </label>
                                                                </div>
                                                            )) }
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.CHECKBOX &&
                                                        <div className="flex-1 flex flex-wrap gap-1">
                                                            { (field.options || []).map((opt: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-1.5 py-1 px-2 border border-black/8 bg-black/1 rounded-sm">
                                                                    <div className="w-3 h-3 rounded border border-black/20 bg-white shrink-0" />
                                                                    <label className="text-[11px] font-[Lato-Regular] whitespace-nowrap"> { opt.label ?? opt.value ?? '' } </label>
                                                                </div>
                                                            )) }
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.DATE &&
                                                        <div className="h-7 flex items-center w-full border-b border-black/15 px-1 text-black/35 text-[11px]">
                                                            <CalendarDays className="w-3 h-3 mr-1.5 text-black/25" /> dd / mm / yyyy
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.DATE_TIME &&
                                                        <div className="flex items-center w-full h-7 border-b border-black/15 px-1 text-black/35 text-[11px]">
                                                            <CalendarDays className="w-3 h-3 mr-1.5 text-black/25" /> dd / mm / yyyy &nbsp; hh : mm
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.SIGNATURE &&
                                                        <div className="flex-1 h-16 border-2 border-dashed border-black/10 bg-black/2 flex items-center justify-center text-black/30">
                                                            <span className="text-[10px] font-[Lato-Regular]"> Signature area </span>
                                                        </div>
                                                    }


                                                    { field.type === TemplateComponents.FILE &&
                                                        <div className="h-12 w-full border-2 border-dashed border-black/10 bg-black/2 flex items-center justify-center text-black/30">
                                                            <span className="text-[10px] font-[Lato-Regular]"> Click to upload file </span>
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.ADDRESS &&
                                                        <div className="space-y-1">
                                                            <input readOnly placeholder="Street Address" className="h-7 w-full bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <input readOnly placeholder="City" className="h-7 bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                                <input readOnly placeholder="State / Province" className="h-7 bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <input readOnly placeholder="Postal Code" className="h-7 bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                                <input readOnly placeholder="Country" className="h-7 bg-transparent border-b border-black/15 text-[11px] px-1 outline-none" />
                                                            </div>
                                                        </div>
                                                    }

                                                    { field.type === TemplateComponents.TABLE && (() => {
                                                        const cols = field.columns?.length
                                                            ? field.columns
                                                            : [{ id: '1', name: 'Column 1' }, { id: '2', name: 'Column 2' }];
                                                        return (
                                                            <div className="w-full border border-black/10 overflow-hidden bg-white">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-black/3 border-b border-black/10">
                                                                            { cols.map((col: any) =>
                                                                                <th key={col.id} className="py-1.5 px-2 text-[10px] font-[Lato-Bold] text-black/50 uppercase tracking-wider whitespace-nowrap">
                                                                                    { col.name }
                                                                                </th>
                                                                            )}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        { [0, 1].map(rowIdx => (
                                                                            <tr key={rowIdx} className="border-b border-black/5">
                                                                                { cols.map((_: any, i: number) => (
                                                                                    <td key={i} className="py-1 px-2">
                                                                                        <div className="h-6 bg-black/2 rounded-sm border border-black/8" />
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        )) }
                                                                    </tbody>
                                                                </table>
                                                                <div className="py-1 px-2 border-t border-black/8 bg-black/1">
                                                                    <span className="text-[10px] text-black/40 font-[Lato-Regular] flex items-center gap-1">
                                                                        <Plus className="w-2.5 h-2.5" /> Add Row
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    { field.type === TemplateComponents.DESCRIPTION && (() => {
                                                        const content = field.placeholder || 'Descriptive text goes here.';
                                                        const isHtml = field.format === 'HTML' || (content && content.includes('<'));

                                                        return (
                                                            <div className="w-full text-[11px] text-justify text-black/60 leading-relaxed min-h-50">
                                                                { isHtml
                                                                    ? <div dangerouslySetInnerHTML={{ __html: content }} className="rich-text prose max-w-none" />
                                                                    : <span className="whitespace-pre-wrap">{content}</span>
                                                                }
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            );
                                            })}

                                            { section.fields.length === 0 &&
                                                <div className="col-span-12 py-6 text-center rounded-lg border border-dashed border-black/10 text-black/30 text-sm font-[Lato-Regular]">
                                                    No fields in this section
                                                </div>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Document Footer (in-preview only — PDF draws its own per-page footer) */}
                            <div className="mt-10 pt-3 border-t border-black/8 flex items-center justify-between text-[9px] text-black/25 font-[Lato-Regular] uppercase tracking-wider">
                                <span> { title } </span>
                                <span> Generated by l-Ark · { format(new Date(), 'dd/MM/yyyy') } </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            }
        </AnimatePresence>,
        overlayRoot
    );
};

export default TemplateDocumentPreview;
