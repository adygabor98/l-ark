import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import type {
    ExportBlock
} from '../../../export-layout.models';

interface FieldGridBlockSettingsProps {
    block: ExportBlock;
}

const LAYOUT_OPTIONS = [
    { value: 'label-value', label: 'Label : Value' },
    { value: 'value-only', label: 'Value only' },
    { value: 'stacked', label: 'Stacked (label above)' },
] as const;

const VALUE_STYLES = [
    { value: 'underline', label: 'Underline' },
    { value: 'box', label: 'Box' },
    { value: 'plain', label: 'Plain' },
] as const;

const FieldGridBlockSettings = ({ block }: FieldGridBlockSettingsProps): ReactElement => {
    const { dispatch } = useExportLayout();

    const columns = block.settings.gridColumns ?? 2;
    const labelWidth = block.settings.gridLabelWidth ?? 40;
    const showBorders = block.settings.gridShowBorders ?? true;
    const borderColor = block.settings.gridBorderColor ?? '#e5e7eb';
    const layout = block.settings.gridLayout ?? 'label-value';
    const valueStyle = block.settings.gridValueStyle ?? 'underline';
    const compact = block.settings.gridCompact ?? false;
    const labelAlign = block.settings.gridLabelAlign ?? 'left';
    const valueAlign = block.settings.gridValueAlign ?? 'left';

    const update = (settings: Partial<ExportBlock['settings']>) => {
        dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings } });
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Columns */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                    Columns
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={1}
                        max={8}
                        step={1}
                        value={columns}
                        onChange={e => update({ gridColumns: parseInt(e.target.value) })}
                        className="flex-1 accent-amber-500"
                    />
                    <span className="text-sm text-black/60 w-4 text-center">{columns}</span>
                </div>
            </div>

            {/* Layout */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Layout
                </label>
                <div className="flex flex-col gap-1.5">
                    { LAYOUT_OPTIONS.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`layout-${block.id}`}
                                checked={layout === value}
                                onChange={() => update({ gridLayout: value })}
                                className="accent-amber-500"
                            />
                            <span className="text-sm text-black/60">{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Label width (only for label-value layout) */}
            { layout === 'label-value' &&
                <div>
                    <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                        Label Width
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={15}
                            max={70}
                            step={1}
                            value={labelWidth}
                            onChange={e => update({ gridLabelWidth: parseInt(e.target.value) })}
                            className="flex-1 accent-amber-500"
                        />
                        <span className="text-[10px] text-black/40 w-8 text-right">{labelWidth}%</span>
                    </div>
                </div>
            }

            {/* Value style */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Value Style
                </label>
                <div className="flex gap-1.5">
                    { VALUE_STYLES.map(({ value, label }) => (
                        <button key={value}
                            onClick={() => update({ gridValueStyle: value })}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                valueStyle === value
                                    ? 'bg-amber-100 text-amber-700 font-medium'
                                    : 'text-black/50 hover:bg-black/4'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alignment */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                        Label Align
                    </label>
                    <select
                        value={labelAlign}
                        onChange={e => update({ gridLabelAlign: e.target.value as 'left' | 'center' | 'right' })}
                        className="w-full text-xs border border-black/10 rounded-md px-2 py-1.5 outline-none focus:border-amber-400"
                    >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                        Value Align
                    </label>
                    <select
                        value={valueAlign}
                        onChange={e => update({ gridValueAlign: e.target.value as 'left' | 'center' | 'right' })}
                        className="w-full text-xs border border-black/10 rounded-md px-2 py-1.5 outline-none focus:border-amber-400"
                    >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>

            {/* Borders */}
            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showBorders}
                        onChange={e => update({ gridShowBorders: e.target.checked })}
                        className="accent-amber-500"
                    />
                    <span className="text-sm text-black/60">Show cell borders</span>
                </label>
                { showBorders &&
                    <div className="flex items-center gap-2 mt-2 ml-6">
                        <input
                            type="color"
                            value={borderColor}
                            onChange={e => update({ gridBorderColor: e.target.value })}
                            className="w-6 h-6 border border-black/10 rounded cursor-pointer"
                        />
                        <span className="text-[10px] text-black/40 font-mono">{borderColor}</span>
                    </div>
                }
            </div>

            {/* Compact */}
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={compact}
                    onChange={e => update({ gridCompact: e.target.checked })}
                    className="accent-amber-500"
                />
                <span className="text-sm text-black/60">Compact spacing</span>
            </label>
        </div>
    );
};

export default FieldGridBlockSettings;
