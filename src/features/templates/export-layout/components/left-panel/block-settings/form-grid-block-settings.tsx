import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import type {
    ExportBlock
} from '../../../export-layout.models';

interface FormGridBlockSettingsProps {
    block: ExportBlock;
}

const FormGridBlockSettings = ({ block }: FormGridBlockSettingsProps): ReactElement => {
    const { dispatch } = useExportLayout();

    const borderColor = block.settings.formGridBorderColor ?? '#d1d5db';
    const borderWidth = block.settings.formGridBorderWidth ?? 1;
    const cellPadding = block.settings.formGridCellPadding ?? 6;
    const outerBorder = block.settings.formGridOuterBorder ?? true;
    const columns = block.settings.formGridColumns ?? 4;
    const rows = block.settings.formGridRows?.length ?? 0;

    const update = (settings: Partial<ExportBlock['settings']>) => {
        dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings } });
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Grid size info */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                    Grid Size
                </label>
                <p className="text-sm text-black/60">
                    {rows} rows × {columns} columns
                </p>
                <p className="text-[10px] text-black/35 mt-1">
                    Use the grid editor on the canvas to add/remove rows and columns.
                </p>
            </div>

            {/* Border width */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                    Border Width
                </label>
                <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.5}
                    value={borderWidth}
                    onChange={e => update({ formGridBorderWidth: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-black/40">{borderWidth}px</span>
            </div>

            {/* Border color */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                    Border Color
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={borderColor}
                        onChange={e => update({ formGridBorderColor: e.target.value })}
                        className="w-8 h-8 border border-black/10 rounded cursor-pointer"
                    />
                    <span className="text-xs text-black/40 font-mono">{borderColor}</span>
                </div>
            </div>

            {/* Cell padding */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                    Cell Padding
                </label>
                <input
                    type="range"
                    min={2}
                    max={16}
                    step={1}
                    value={cellPadding}
                    onChange={e => update({ formGridCellPadding: parseInt(e.target.value) })}
                    className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-black/40">{cellPadding}px</span>
            </div>

            {/* Outer border toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={outerBorder}
                    onChange={e => update({ formGridOuterBorder: e.target.checked })}
                    className="accent-amber-500"
                />
                <span className="text-sm text-black/60">Show outer border</span>
            </label>

            {/* Column widths */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Column Widths
                </label>
                <div className="flex flex-col gap-1.5">
                    { (block.settings.formGridColumnWidths ?? []).map((w, i, arr) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-black/40 w-8">Col {i + 1}</span>
                            <input
                                type="range"
                                min={5}
                                max={100 - (arr.length - 1) * 5}
                                step={1}
                                value={w}
                                onChange={e => {
                                    const original = block.settings.formGridColumnWidths ?? [];
                                    const newVal = parseFloat(e.target.value);
                                    const otherCount = original.length - 1;
                                    if (otherCount <= 0) return;

                                    // Budget remaining for other columns
                                    const minEach = 5;
                                    const maxForThis = 100 - otherCount * minEach;
                                    const clamped = Math.min(newVal, maxForThis);
                                    const remaining = 100 - clamped;

                                    // Distribute remaining proportionally based on original ratios
                                    const othersOrigSum = original.reduce((s, v, j) => j === i ? s : s + v, 0);
                                    const widths = original.map((ov, j) => {
                                        if (j === i) return clamped;
                                        const ratio = othersOrigSum > 0 ? ov / othersOrigSum : 1 / otherCount;
                                        return Math.max(minEach, remaining * ratio);
                                    });

                                    // Normalize to exactly 100%
                                    const total = widths.reduce((s, v) => s + v, 0);
                                    if (total > 0 && Math.abs(total - 100) > 0.01) {
                                        const scale = 100 / total;
                                        for (let j = 0; j < widths.length; j++) widths[j] *= scale;
                                    }

                                    update({ formGridColumnWidths: widths });
                                }}
                                className="flex-1 accent-amber-500"
                            />
                            <span className="text-[10px] text-black/40 w-8 text-right">{Math.round(w)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FormGridBlockSettings;
