import {
    AlignLeft,
    AtSign,
    CalendarClock,
    CalendarDays,
    CheckSquare,
    CircleDot,
    Euro,
    FileUp,
    Hash,
    ListChecks,
    ListIndentIncrease,
    MapPinHouse,
    PenTool,
    Percent,
    Phone,
    TableIcon,
    Type
} from "lucide-react";

export enum TemplateComponents {
    TEXT = 'TEXT',
    TEXTAREA = 'TEXTAREA',
    DESCRIPTION = 'DESCRIPTION',

    NUMBER = 'NUMBER',
    CURRENCY = 'CURRENCY',
    PERCENTAGE = 'PERCENTAGE',

    DATE = 'DATE',
    DATE_TIME = 'DATE_TIME',

    BOOLEAN = 'BOOLEAN',
    CHECKBOX = 'CHECKBOX',
    RADIO_GROUP = 'RADIO_GROUP',

    SELECT = 'SELECT',

    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    ADDRESS = 'ADDRESS',

    TABLE = 'TABLE',

    FILE = 'FILE',
    SIGNATURE = 'SIGNATURE'
}

export interface OptionItem {
    value: string;
    label: string;
    isDefault?: boolean;
}

export type FieldWidth = 'FULL' | 'HALF' | 'THIRD' | 'QUARTER';

export type FieldDisplayMode = 'CHECKBOX_SINGLE' | 'TOGGLE' | 'YES_NO';

export type FieldVariant = 'INFO' | 'LEGAL' | 'WARNING' | 'HEADER' | 'DIVIDER';

export const FIELD_WIDTH_MAP: Record<FieldWidth, string> = {
    FULL: 'col-span-12',
    HALF: 'col-span-6',
    THIRD: 'col-span-4',
    QUARTER: 'col-span-3'
};

export const FIELD_TYPES = [
    { id: TemplateComponents.TEXT, label: "Short Text", icon: Type },
    { id: TemplateComponents.TEXTAREA, label: "Long Text", icon: AlignLeft },
    { id: TemplateComponents.DESCRIPTION, label: "Description Text", icon: AlignLeft },

    { id: TemplateComponents.NUMBER, label: "Number", icon: Hash },
    { id: TemplateComponents.CURRENCY, label: "Currency", icon: Euro },
    { id: TemplateComponents.PERCENTAGE, label: "Percentage", icon: Percent },

    { id: TemplateComponents.DATE, label: "Date", icon: CalendarDays },
    { id: TemplateComponents.DATE_TIME, label: "Date & Time", icon: CalendarClock },

    { id: TemplateComponents.BOOLEAN, label: "Boolean (Toggle)", icon: CheckSquare },
    { id: TemplateComponents.CHECKBOX, label: "Checkbox Group", icon: ListChecks },
    { id: TemplateComponents.RADIO_GROUP, label: "Radio Group", icon: CircleDot },

    { id: TemplateComponents.SELECT, label: "Select", icon: ListIndentIncrease },

    { id: TemplateComponents.EMAIL, label: "Email", icon: AtSign },
    { id: TemplateComponents.PHONE, label: "Phone", icon: Phone },

    { id: TemplateComponents.ADDRESS, label: "Address", icon: MapPinHouse },

    { id: TemplateComponents.TABLE, label: "Table", icon: TableIcon },

    { id: TemplateComponents.FILE, label: "File Upload", icon: FileUp },
    { id: TemplateComponents.SIGNATURE, label: "Signature", icon: PenTool }
];

export const FIELD_COLUMN_TYPES = [
    { id: TemplateComponents.TEXT, label: "Short Text", icon: Type },
    { id: TemplateComponents.TEXTAREA, label: "Long Text", icon: AlignLeft },
    { id: TemplateComponents.NUMBER, label: "Number", icon: Hash },
    { id: TemplateComponents.CURRENCY, label: "Currency", icon: Euro },
    { id: TemplateComponents.PERCENTAGE, label: "Percentage", icon: Percent },
    { id: TemplateComponents.DATE, label: "Date", icon: CalendarDays },
    { id: TemplateComponents.DATE_TIME, label: "Date & Time", icon: CalendarClock },
    { id: TemplateComponents.BOOLEAN, label: "Boolean (Toggle)", icon: CheckSquare },
    { id: TemplateComponents.EMAIL, label: "Email", icon: AtSign },
    { id: TemplateComponents.PHONE, label: "Phone", icon: Phone },
    { id: TemplateComponents.SIGNATURE, label: "Signature", icon: PenTool }
];

export const FIELD_GROUPS = [
    {
        label: 'Texts',
        types: [TemplateComponents.TEXT, TemplateComponents.TEXTAREA, TemplateComponents.DESCRIPTION],
    },
    {
        label: 'Numbers',
        types: [TemplateComponents.NUMBER, TemplateComponents.CURRENCY, TemplateComponents.PERCENTAGE],
    },
    {
        label: 'Dates',
        types: [TemplateComponents.DATE, TemplateComponents.DATE_TIME],
    },
    {
        label: 'Booleans',
        types: [TemplateComponents.BOOLEAN, TemplateComponents.CHECKBOX, TemplateComponents.RADIO_GROUP],
    },
    {
        label: 'Selection',
        types: [TemplateComponents.SELECT],
    },
    {
        label: 'Contact',
        types: [TemplateComponents.EMAIL, TemplateComponents.PHONE],
    },
    {
        label: 'Address',
        types: [TemplateComponents.ADDRESS],
    },
    {
        label: 'Tables',
        types: [TemplateComponents.TABLE],
    },
    {
        label: 'Others',
        types: [TemplateComponents.FILE, TemplateComponents.SIGNATURE],
    },
];

export interface FieldOptions {
    label: string;
    value: string;
    isDefault: boolean;     
}

export interface FieldTableColumns {
    id: string;
    name: string;
    type: string;
}

/**
 * A pre-defined row in a TABLE field.
 * `cells` maps column id → static text; empty string = blank fill line.
 */
export interface FieldStaticRow {
    id: string;
    cells: Record<string, string>;
}

export interface TemplateFormSectionFieldStructure {
    /** Client-side id used only for React keys / local editing. Prefixed `f…` for new rows, numeric string for persisted rows. Never reaches export-layout tokens. */
    id: string;
    /**
     * Cross-version UUID. Generated by the client at field creation; preserved
     * verbatim by the backend through DRAFT saves and version bumps. Every
     * export-layout token resolves to a field via this id.
     */
    stableId: string;

    label: string;
    placeholder?: string | null;
    helpText?: string | null;

    required: boolean;
    type: TemplateComponents;
    width: FieldWidth;
    multiple: boolean;
    suffix?: string | null;

    format?: string; // always HTML for NOW

    options: FieldOptions[];
    columns: FieldTableColumns[];
    requiredDocuments: string[];
}

export interface TemplateFormSectionStructure {
    id: string;
    /** Cross-version UUID. See `TemplateFormSectionFieldStructure.stableId`. */
    stableId: string;
    title: string;
    description?: string;
    fields: TemplateFormSectionFieldStructure[];
}

export interface TemplateFormStructure {
    title: string;
    description: string;
    divisions: string[];
    operations: string[];
    sections: TemplateFormSectionStructure[];
}