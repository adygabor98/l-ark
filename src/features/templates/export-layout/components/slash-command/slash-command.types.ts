import type {
    BlockType
} from '../../export-layout.models';

export interface SlashMenuItem {
    type: BlockType;
    title: string;
    description: string;
    icon: string;
}

export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
    { type: 'RICH_TEXT', title: 'Text', description: 'Rich text with formatting and field tokens', icon: 'T' },
    { type: 'TABLE', title: 'Table', description: 'Dynamic table linked to a TABLE field', icon: '⊞' },
    { type: 'IMAGE', title: 'Image', description: 'Static image, logo or stamp', icon: '⬚' },
    { type: 'SIGNATURE', title: 'Signature', description: 'Signature capture linked to a SIGNATURE field', icon: '✦' },
    { type: 'DIVIDER', title: 'Divider', description: 'Horizontal separator line', icon: '—' },
    { type: 'PAGE_BREAK', title: 'Page Break', description: 'Force a new page in the document', icon: '⌧' },
    { type: 'CHECKBOX_GRID', title: 'Checkbox Grid', description: 'Grid of checkboxes or radios with labels', icon: '☑' },
    { type: 'FIELD_GRID', title: 'Field Grid', description: 'Label–value pairs in a grid layout (1–8 columns)', icon: '⊟' },
    { type: 'FORM_GRID', title: 'Form Grid', description: 'Table-like grid with labels, fields, colspan & rowspan', icon: '⊞' },
    { type: 'BLANK', title: 'Blank', description: 'Empty space for column alignment', icon: '□' },
];
