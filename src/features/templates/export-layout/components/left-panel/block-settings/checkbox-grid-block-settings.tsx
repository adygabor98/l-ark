import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import type {
    ExportBlock
} from '../../../export-layout.models';

interface CheckboxGridBlockSettingsProps {
    block: ExportBlock;
}

const STYLE_OPTIONS = [
    { value: 'checkbox', label: 'All checkboxes' },
    { value: 'radio', label: 'All radios' },
    { value: 'mixed', label: 'Mixed (per item)' },
] as const;

const CheckboxGridBlockSettings = ({ block }: CheckboxGridBlockSettingsProps): ReactElement => {
    const { dispatch } = useExportLayout();

    const columns = block.settings.checkboxColumns ?? 4;
    const showBorders = block.settings.checkboxShowBorders ?? true;
    const borderColor = block.settings.checkboxBorderColor ?? '#e5e7eb';
    const compact = block.settings.checkboxCompact ?? false;
    const style = block.settings.checkboxStyle ?? 'checkbox';
    const showTitle = block.settings.checkboxShowTitle ?? false;
    const title = block.settings.checkboxTitle ?? '';
    const itemCount = block.settings.checkboxItems?.length ?? 0;

    const update = (settings: Partial<ExportBlock['settings']>) => {
        dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings } });
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Info */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-1 uppercase tracking-wide">
                    Grid Info
                </label>
                <p className="text-sm text-black/60">
                    {itemCount} items in {columns} columns
                </p>
            </div>

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
                        onChange={e => update({ checkboxColumns: parseInt(e.target.value) })}
                        className="flex-1 accent-amber-500"
                    />
                    <span className="text-sm text-black/60 w-4 text-center">{columns}</span>
                </div>
            </div>

            {/* Style */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Indicator Style
                </label>
                <div className="flex flex-col gap-1.5">
                    { STYLE_OPTIONS.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`style-${block.id}`}
                                checked={style === value}
                                onChange={() => update({ checkboxStyle: value })}
                                className="accent-amber-500"
                            />
                            <span className="text-sm text-black/60">{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                        type="checkbox"
                        checked={showTitle}
                        onChange={e => update({ checkboxShowTitle: e.target.checked })}
                        className="accent-amber-500"
                    />
                    <span className="text-sm text-black/60">Show title row</span>
                </label>
                { showTitle &&
                    <input
                        value={title}
                        onChange={e => update({ checkboxTitle: e.target.value })}
                        placeholder="Grid title…"
                        className="w-full text-xs border border-black/10 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400"
                    />
                }
            </div>

            {/* Borders */}
            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showBorders}
                        onChange={e => update({ checkboxShowBorders: e.target.checked })}
                        className="accent-amber-500"
                    />
                    <span className="text-sm text-black/60">Show cell borders</span>
                </label>
                { showBorders &&
                    <div className="flex items-center gap-2 mt-2 ml-6">
                        <input
                            type="color"
                            value={borderColor}
                            onChange={e => update({ checkboxBorderColor: e.target.value })}
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
                    onChange={e => update({ checkboxCompact: e.target.checked })}
                    className="accent-amber-500"
                />
                <span className="text-sm text-black/60">Compact spacing</span>
            </label>
        </div>
    );
};

export default CheckboxGridBlockSettings;
