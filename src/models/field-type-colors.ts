import {
    TemplateComponents
} from "./template.models";

export interface FieldTypeColor {
    hex: string;
    bg: string;
    text: string;
    border: string;
    ring: string;
    dot: string;
}

const FIELD_TYPE_COLORS: Record<TemplateComponents, FieldTypeColor> = {
    // Text fields
    [TemplateComponents.TEXT]:        { hex: '#3B82F6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    ring: 'ring-blue-400/30',    dot: 'bg-blue-500' },
    [TemplateComponents.TEXTAREA]:    { hex: '#3B82F6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    ring: 'ring-blue-400/30',    dot: 'bg-blue-500' },
    [TemplateComponents.DESCRIPTION]: { hex: '#3B82F6', bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    ring: 'ring-blue-400/30',    dot: 'bg-blue-500' },

    // Number fields
    [TemplateComponents.NUMBER]:      { hex: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-400/30', dot: 'bg-emerald-500' },
    [TemplateComponents.CURRENCY]:    { hex: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-400/30', dot: 'bg-emerald-500' },
    [TemplateComponents.PERCENTAGE]:  { hex: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-400/30', dot: 'bg-emerald-500' },

    // Date fields
    [TemplateComponents.DATE]:        { hex: '#8B5CF6', bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  ring: 'ring-violet-400/30',  dot: 'bg-violet-500' },
    [TemplateComponents.DATE_TIME]:    { hex: '#8B5CF6', bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  ring: 'ring-violet-400/30',  dot: 'bg-violet-500' },

    // Selection fields
    [TemplateComponents.SELECT]:          { hex: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   ring: 'ring-amber-400/30',   dot: 'bg-amber-500' },
    [TemplateComponents.RADIO_GROUP]:     { hex: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   ring: 'ring-amber-400/30',   dot: 'bg-amber-500' },
    [TemplateComponents.CHECKBOX]:        { hex: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   ring: 'ring-amber-400/30',   dot: 'bg-amber-500' },

    // Boolean
    [TemplateComponents.BOOLEAN]:     { hex: '#14B8A6', bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200',    ring: 'ring-teal-400/30',    dot: 'bg-teal-500' },

    // File / Signature
    [TemplateComponents.FILE]:        { hex: '#F43F5E', bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    ring: 'ring-rose-400/30',    dot: 'bg-rose-500' },
    [TemplateComponents.SIGNATURE]:   { hex: '#F43F5E', bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    ring: 'ring-rose-400/30',    dot: 'bg-rose-500' },

    // Contact fields
    [TemplateComponents.EMAIL]:       { hex: '#6366F1', bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  ring: 'ring-indigo-400/30',  dot: 'bg-indigo-500' },
    [TemplateComponents.PHONE]:       { hex: '#6366F1', bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  ring: 'ring-indigo-400/30',  dot: 'bg-indigo-500' },
    [TemplateComponents.ADDRESS]:     { hex: '#6366F1', bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  ring: 'ring-indigo-400/30',  dot: 'bg-indigo-500' },

    // Table
    [TemplateComponents.TABLE]:       { hex: '#64748B', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   ring: 'ring-slate-400/30',   dot: 'bg-slate-500' },
};

export const getFieldTypeColor = (fieldType: TemplateComponents): FieldTypeColor => {
    return FIELD_TYPE_COLORS[fieldType] ?? FIELD_TYPE_COLORS[TemplateComponents.TABLE];
};

export default FIELD_TYPE_COLORS;
