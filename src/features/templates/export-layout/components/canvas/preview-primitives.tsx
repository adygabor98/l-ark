import type { ReactElement, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { PREVIEW_BORDER_STRONG, PREVIEW_ACCENT } from '../../export-layout.constants';

/**
 * Flex-filling underline used in preview mode as a placeholder for field
 * values. Replaces hard-coded `'________________'` strings so the line
 * always scales with its container width.
 */
export const FieldUnderline = ({ compact = false }: { compact?: boolean }): ReactElement => (
    <span
        className="inline-block flex-1 align-middle"
        style={{
            borderBottom: `1px solid ${PREVIEW_BORDER_STRONG}`,
            height: compact ? 12 : 14,
            minWidth: 40,
        }}
    />
);

/**
 * Unified empty/placeholder state for preview blocks.
 * Replaces scattered italic gray text with a consistent icon + label treatment.
 */
export const EmptyState = ({
    icon,
    label,
    dense = false,
}: {
    icon?: ReactNode;
    label: string;
    dense?: boolean;
}): ReactElement => (
    <div
        className={`flex items-center justify-center gap-2 text-black/40 ${
            dense ? 'py-1' : 'py-3'
        }`}
    >
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span className="text-xs font-[Lato-Regular]">{label}</span>
    </div>
);

/**
 * Preview checkbox marker. Unified size + border so every block using a
 * checkbox looks identical. When `checked`, fills with the l-Ark amber accent
 * and shows a white lucide Check glyph.
 */
export const PreviewCheckbox = ({ checked = false }: { checked?: boolean }): ReactElement => (
    <span
        className="inline-flex items-center justify-center shrink-0 rounded-[2px]"
        style={{
            width: 14,
            height: 14,
            border: `1px solid ${checked ? PREVIEW_ACCENT : PREVIEW_BORDER_STRONG}`,
            backgroundColor: checked ? PREVIEW_ACCENT : 'transparent',
        }}
    >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
);

/**
 * Preview radio marker. Same sizing scale as PreviewCheckbox for visual
 * consistency across field grids, checkbox grids, and form grids.
 */
export const PreviewRadio = ({ checked = false }: { checked?: boolean }): ReactElement => (
    <span
        className="inline-flex items-center justify-center shrink-0 rounded-full"
        style={{
            width: 14,
            height: 14,
            border: `1.5px solid ${checked ? PREVIEW_ACCENT : PREVIEW_BORDER_STRONG}`,
        }}
    >
        {checked && (
            <span
                className="rounded-full"
                style={{ width: 6, height: 6, backgroundColor: PREVIEW_ACCENT }}
            />
        )}
    </span>
);
