import {
    type ReactElement,
    createElement
} from 'react';
import {
    Type,
    Hash,
    DollarSign,
    Percent,
    Calendar,
    ToggleLeft,
    ChevronDown,
    Mail,
    Phone,
    MapPin,
    Table,
    Paperclip,
    PenTool,
    FileText
} from 'lucide-react';

const ICON_CLASS = 'w-3 h-3';

/** Returns a Lucide icon element for a given TemplateComponents field type */
export const getFieldTypeIcon = (fieldType: string): ReactElement => {
    switch (fieldType) {
        case 'TEXT':
        case 'TEXTAREA':
        case 'DESCRIPTION':
            return createElement(Type, { className: ICON_CLASS });
        case 'NUMBER':
            return createElement(Hash, { className: ICON_CLASS });
        case 'CURRENCY':
            return createElement(DollarSign, { className: ICON_CLASS });
        case 'PERCENTAGE':
            return createElement(Percent, { className: ICON_CLASS });
        case 'DATE':
        case 'DATE_TIME':
            return createElement(Calendar, { className: ICON_CLASS });
        case 'BOOLEAN':
        case 'CHECKBOX':
        case 'RADIO_GROUP':
            return createElement(ToggleLeft, { className: ICON_CLASS });
        case 'SELECT':
            return createElement(ChevronDown, { className: ICON_CLASS });
        case 'EMAIL':
            return createElement(Mail, { className: ICON_CLASS });
        case 'PHONE':
            return createElement(Phone, { className: ICON_CLASS });
        case 'ADDRESS':
            return createElement(MapPin, { className: ICON_CLASS });
        case 'TABLE':
            return createElement(Table, { className: ICON_CLASS });
        case 'FILE':
            return createElement(Paperclip, { className: ICON_CLASS });
        case 'SIGNATURE':
            return createElement(PenTool, { className: ICON_CLASS });
        default:
            return createElement(FileText, { className: ICON_CLASS });
    }
}
