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

export type BlockType = 'RICH_TEXT' | 'TABLE' | 'IMAGE' | 'SIGNATURE' | 'DIVIDER' | 'PAGE_BREAK' | 'FIELD_GRID' | 'BLANK' | 'FORM_GRID' | 'CHECKBOX_GRID';
export type PageNumberPosition = 'none' | 'left' | 'center' | 'right';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Entry type in a FIELD_GRID block */
export type FieldGridEntryType = 'field' | 'custom' | 'checkbox' | 'radio' | 'spacer';

/** Entry in a FIELD_GRID block */
export interface FieldGridEntry {
    id: string;
    type: FieldGridEntryType;
    /** For type='field'|'checkbox'|'radio': the template field id */
    fieldId?: string;
    /** For type='custom': user-entered label */
    customLabel?: string;
    /** For type='custom': user-entered value */
    customValue?: string;
    /** Override label alignment for this entry */
    labelAlign?: 'left' | 'center' | 'right';
    /** Override value alignment for this entry */
    valueAlign?: 'left' | 'center' | 'right';
    /** Bold the label */
    labelBold?: boolean;
    /** Span multiple grid columns (default 1) */
    colSpan?: number;
}

/** A single item in a CHECKBOX_GRID block */
export interface CheckboxGridItem {
    id: string;
    /** Bound template field ID (BOOLEAN or CHECKBOX type) */
    fieldId?: string;
    /** Custom label override (used when no field is bound) */
    customLabel?: string;
    /** Render as radio instead of checkbox */
    isRadio?: boolean;
}

/** Content type for a cell in a FORM_GRID block */
export type FormGridCellContent = 'label' | 'field' | 'checkbox' | 'empty';

/** A single cell within a FORM_GRID */
export interface FormGridCell {
    id: string;
    contentType: FormGridCellContent;
    /** Static text (for 'label') */
    label?: string;
    /** Template field ID (for 'field' or 'checkbox') */
    fieldId?: string;
    /** Column span (default 1) */
    colspan?: number;
    /** Row span (default 1) */
    rowspan?: number;
    backgroundColor?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: number;
    /** Vertical text rotation (for brand sidebars) */
    verticalText?: boolean;
}

/** A single row within a FORM_GRID */
export interface FormGridRow {
    id: string;
    cells: FormGridCell[];
    /** Optional fixed row height in px */
    height?: number;
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

/**
 * A single pre-defined row in a TABLE block.
 * `cells` maps column id → static text value.
 * An empty string or missing key means the cell is left blank (rendered as a
 * fill underline in the preview / PDF export).
 */
export interface StaticTableRow {
    id: string;
    cells: Record<string, string>;
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
    /** Show the printed-name slot below the signing line (default true) */
    signatureShowPrintedName?: boolean;
    /** Show the date slot next to the signing line (default true) */
    signatureShowDate?: boolean;
    /** Show the DNI / NIF identity line (default true) */
    signatureShowDni?: boolean;
    /** Role heading above the signing line (e.g. "L'Agència", "El Client").
     *  Empty string renders no heading. */
    signatureRole?: string;
    // DIVIDER
    lineWeight?: number;
    lineColor?: string;
    // FIELD_GRID
    gridColumns?: number;
    gridEntries?: FieldGridEntry[];
    gridLabelWidth?: number;
    gridShowBorders?: boolean;
    gridBorderColor?: string;
    gridLayout?: 'label-value' | 'value-only' | 'stacked';
    gridLabelAlign?: 'left' | 'center' | 'right';
    gridValueAlign?: 'left' | 'center' | 'right';
    gridValueStyle?: 'underline' | 'box' | 'plain';
    gridCompact?: boolean;
    // FORM_GRID
    formGridRows?: FormGridRow[];
    formGridColumns?: number;
    formGridColumnWidths?: number[];
    formGridBorderColor?: string;
    formGridBorderWidth?: number;
    formGridCellPadding?: number;
    formGridOuterBorder?: boolean;
    // CHECKBOX_GRID
    checkboxItems?: CheckboxGridItem[];
    checkboxColumns?: number;
    checkboxShowBorders?: boolean;
    checkboxBorderColor?: string;
    checkboxCompact?: boolean;
    checkboxStyle?: 'checkbox' | 'radio' | 'mixed';
    checkboxTitle?: string;
    checkboxShowTitle?: boolean;
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

/** A horizontal row of 1–8 cells rendered side-by-side. */
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
    /** Text displayed below the logo (e.g. organization name) */
    logoOrganizationText?: string;
    /** Sidebar brand band (vertical strip on left or right edge) */
    showSidebar: boolean;
    /** Which side the sidebar appears on */
    sidebarPosition?: 'left' | 'right';
    /** Sidebar width in mm */
    sidebarWidth?: number;
    /** Sidebar background color */
    sidebarColor?: string;
    /** Sidebar text (rendered vertically) */
    sidebarText?: string;
    /** Sidebar text color */
    sidebarTextColor?: string;
    /** Sidebar text size in px */
    sidebarFontSize?: number;
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
    FIELD_GRID: 'Field Grid',
    BLANK:      'Blank Block',
    FORM_GRID:  'Form Grid',
    CHECKBOX_GRID: 'Checkbox Grid',
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

export const LAYOUTS: { cols: number; icon: string; title: string }[] = [
    { cols: 1, icon: '▮',        title: 'Full width'  },
    { cols: 2, icon: '▮▮',      title: '2 columns'   },
    { cols: 3, icon: '▮▮▮',     title: '3 columns'   },
    { cols: 4, icon: '▮▮▮▮',    title: '4 columns'   },
    { cols: 5, icon: '▮▮▮▮▮',   title: '5 columns'   },
    { cols: 6, icon: '▮▮▮▮▮▮',  title: '6 columns'   },
    { cols: 7, icon: '▮▮▮▮▮▮▮', title: '7 columns'   },
    { cols: 8, icon: '▮▮▮▮▮▮▮▮',title: '8 columns'   },
];