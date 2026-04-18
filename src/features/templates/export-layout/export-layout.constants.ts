// ─── Export Layout Designer — Named Constants ─────────────────────────────────
// Centralized to avoid scattered magic numbers throughout the codebase.

/** CSS pixels per millimetre at 96 dpi (standard browser resolution). */
export const PX_PER_MM = 3.7795;

/** Multiplier used to estimate watermark character width when computing font size. */
export const WATERMARK_CHAR_FACTOR = 0.6;

/** Minimum watermark font size (px). */
export const WATERMARK_MIN_FONT_PX = 18;

/** Maximum watermark font size (px). */
export const WATERMARK_MAX_FONT_PX = 80;

/** Minimum cell width as a percentage of the row (prevents cells from disappearing). */
export const CELL_MIN_WIDTH_PCT = 10;

/** Fallback row height used when measurement hasn't happened yet (px). */
export const EMPTY_ROW_HEIGHT_FALLBACK_PX = 40;

/** Gap between rows used for pagination height calculation (matches gap-3 = 0.75rem ≈ 12px). */
export const ROW_GAP_PX = 12;

/** Canvas horizontal padding used when computing the available width for zoom. */
export const CANVAS_HORIZONTAL_PADDING_PX = 64;

/** A4 page dimensions at 96 dpi. */
export const PAGE_DIMS_A4 = { width: 794, height: 1123 } as const;

/** Page dimensions map keyed by page size identifier. */
export const PAGE_DIMS = {
    A4:     PAGE_DIMS_A4,
} as const;

/** Default watermark opacity. */
export const WATERMARK_DEFAULT_OPACITY = 0.12;

// ─── Preview design tokens ─────────────────────────────────────────────────────
// Centralized so block previews stay visually consistent.

/** Subtle structural border (replaces /6, /8, /10). */
export const PREVIEW_BORDER_SUBTLE = 'rgba(0,0,0,0.08)';

/** Stronger emphasis border (replaces /15, /20, /30). */
export const PREVIEW_BORDER_STRONG = 'rgba(0,0,0,0.15)';

/** Accent color (matches l-Ark amber/gold). */
export const PREVIEW_ACCENT = '#FFBF00';

/** Tailwind class shortcuts for preview text tones. */
export const PREVIEW_TEXT_LABEL = 'text-black/60';
export const PREVIEW_TEXT_VALUE = 'text-black/55';
export const PREVIEW_TEXT_PLACEHOLDER = 'text-black/40';
