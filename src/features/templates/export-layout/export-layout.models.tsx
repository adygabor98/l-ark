import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Ban
} from "lucide-react";
import type {
    ReactElement
} from "react";

export type BlockType = 'RICH_TEXT' | 'TABLE' | 'IMAGE' | 'SIGNATURE' | 'DIVIDER' | 'PAGE_BREAK' | 'FIELD_GRID' | 'BLANK';
export type PageNumberPosition = 'none' | 'left' | 'center' | 'right';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Entry in a FIELD_GRID block */
export interface FieldGridEntry {
    id: string;
    type: 'field' | 'custom';
    /** For type='field': the template field id */
    fieldId?: string;
    /** For type='custom': user-entered label */
    customLabel?: string;
    /** For type='custom': user-entered value */
    customValue?: string;
}

/** Per-column configuration for TABLE blocks */
export interface TableColumnConfig {
    /** Matches FieldColumn.id */
    colId: string;
    label: string;
    visible: boolean;
    /** Width as a percentage of the total table width (all visible columns sum to 100) */
    widthPct: number;
}

export interface ExportBlockSettings {
    // RICH_TEXT
    alignment?: 'left' | 'center' | 'right' | 'justify';
    // TABLE
    borderStyle?: 'grid' | 'horizontal' | 'none';
    hasHeaderRow?: boolean;
    alternatingRows?: boolean;
    /** Column visibility, order and width overrides. When unset, all columns shown equally. */
    tableColumns?: TableColumnConfig[];
    // IMAGE
    imageAlignment?: 'left' | 'center' | 'right' | 'justify';
    imageWidth?: number;
    // SIGNATURE
    signatureWidth?: number;
    // DIVIDER
    lineWeight?: number;
    lineColor?: string;
    // FIELD_GRID
    gridColumns?: 1 | 2 | 3;
    gridEntries?: FieldGridEntry[];
    gridLabelWidth?: number;
    gridShowBorders?: boolean;
    // REPEATER
    repeaterDirection?: 'vertical' | 'horizontal';
    repeaterGap?: number;
    repeaterShowDivider?: boolean;
    // SECTION_HEADER
    sectionHeaderLevel?: 1 | 2 | 3 | 4;
    sectionHeaderShowRule?: boolean;
    sectionHeaderRuleColor?: string;
    sectionHeaderRuleWeight?: number;
    // ALL blocks — spacing below the block (in px)
    marginBottom?: number;

    // ── Cell / block decoration (ALL block types) ──
    backgroundColor?: string;
    padding?: { top: number; right: number; bottom: number; left: number };
    borderWidth?: number;
    borderColor?: string;
    borderStyleDecoration?: 'solid' | 'dashed' | 'dotted';
    borderRadius?: number;
}

export interface ExportBlock {
    id: string;
    type: BlockType;
    /** RICH_TEXT: TipTap JSON doc */
    content?: Record<string, unknown>;
    /** TABLE | SIGNATURE: bound field id */
    sourceFieldId?: string;
    /** IMAGE: data URL or upload URL */
    imageUrl?: string;
    settings: ExportBlockSettings;
    /** Hide block if this field has no value */
    conditionalFieldId?: string;
}

/** A single column within a row. Width is a percentage (all cells in a row sum to 100). */
export interface ExportCell {
    id: string;
    width: number;
    block: ExportBlock;
}

/** A horizontal row of 1–4 cells rendered side-by-side. */
export interface ExportRow {
    id: string;
    cells: ExportCell[];
}

/** A single page (or continuation slice) in the paginated output. */
export interface PageSlice {
    rows: ExportRow[];
    /** Vertical pixel offset for oversized content (0 for normal pages). */
    yOffset: number;
}

export interface ExportPageConfig {
    pageSize: 'A4';
    margins: { top: number; right: number; bottom: number; left: number };
    watermark?: string;
    /** Watermark color (hex). Default '#000000' */
    watermarkColor?: string;
    /** Watermark opacity 0-1. Default 0.08 */
    watermarkOpacity?: number;
    showHeader: boolean;
    /** TipTap JSON for header rich text */
    headerContent?: Record<string, unknown>;
    showFooter: boolean;
    /** TipTap JSON for footer rich text */
    footerContent?: Record<string, unknown>;
    /** Where to render "Page N of M" in the footer. 'none' disables page numbers. */
    pageNumberPosition: PageNumberPosition;
    showLogo: boolean;
    /** Logo display width in px (default 40) */
    logoWidth?: number;
    /** Uploaded logo image (data URL or remote URL) */
    logoUrl?: string;
}

export interface FieldTokenAttrs {
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    fallbackText: string;
    dateFormat?: string;
    numberFormat?: string;
    /** Serialized options for CHECKBOX / RADIO_GROUP / SELECT fields */
    options?: string; // JSON-serialized FieldOption[]
}

/** Option for CHECKBOX / RADIO_GROUP / SELECT fields */
export interface FieldOption {
    label: string;
    value: string;
}

/** Column definition for TABLE fields */
export interface FieldColumn {
    id: string;
    name: string;
}

/** Flat representation of a template field available as a token */
export interface AvailableToken {
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    sectionTitle: string;
    sectionId: string;
    /** Options for CHECKBOX / RADIO_GROUP / SELECT fields */
    options?: FieldOption[];
    /** Column definitions for TABLE fields */
    columns?: FieldColumn[];
}

export interface ExportLayoutRouteState {
    templateId: string;
    templateName?: string;
    versionId?: string;
    sections: Array<{
        id: string;
        title: string;
        fields: Array<{
            id: string;
            label: string;
            type: string;
            options?: Array<{ label: string; value: string }>;
            columns?: Array<{ id: string; name: string }>;
        }>;
    }>;
}

export const BLOCK_TYPE_LABELS: Record<string, string> = {
    RICH_TEXT:  'Text Block',
    TABLE:      'Table Block',
    IMAGE:      'Image Block',
    SIGNATURE:  'Signature Block',
    DIVIDER:    'Divider Block',
    PAGE_BREAK: 'Page Break',
    BLANK:      'Blank Block',
};

export const ALIGNMENTS = [
    { value: 'left', Icon: AlignLeft, label: 'Left' },
    { value: 'center', Icon: AlignCenter, label: 'Center' },
    { value: 'right', Icon: AlignRight, label: 'Right' },
    { value: 'justify', Icon: AlignJustify, label: 'Justify' },
] as const;

export const TABLE_BORDERS = [
    { value: 'grid', label: 'Full grid' },
    { value: 'horizontal', label: 'Horizontal only' },
    { value: 'none', label: 'No borders' },
] as const;

export const BORDER_STYLES: Array<{ value: ExportBlockSettings['borderStyleDecoration']; label: string }> = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];

export const PAGE_NUMBER_OPTIONS: { value: PageNumberPosition; icon: ReactElement; label: string }[] = [
    { value: 'none',   icon: <Ban className="w-3.5 h-3.5" />,        label: 'Off'    },
    { value: 'left',   icon: <AlignLeft className="w-3.5 h-3.5" />,  label: 'Left'   },
    { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />,label: 'Center' },
    { value: 'right',  icon: <AlignRight className="w-3.5 h-3.5" />, label: 'Right'  },
];

export const PAGE_SIZES : ('A4')[] = [ 'A4' ]

export const MARGINS : ('top' | 'right' | 'left' | 'bottom')[] = [ 'top', 'right', 'bottom', 'left' ]

export const LAYOUTS: { cols: 1 | 2 | 3 | 4; icon: string; title: string }[] = [
    { cols: 1, icon: '▮',    title: 'Full width'  },
    { cols: 2, icon: '▮▮',  title: '2 columns'   },
    { cols: 3, icon: '▮▮▮', title: '3 columns'   },
    { cols: 4, icon: '▮▮▮▮',title: '4 columns'   },
];