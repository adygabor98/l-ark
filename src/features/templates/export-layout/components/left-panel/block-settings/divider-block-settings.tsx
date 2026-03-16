import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import type {
    ExportBlock
} from '../../../export-layout.models';

interface DividerBlockSettingsProps {
    block: ExportBlock;
}

const DividerBlockSettings = ({ block }: DividerBlockSettingsProps): ReactElement => {
    /** Export layout api utilities */
    const { dispatch } = useExportLayout();

    return (
        <div className="p-4 flex flex-col gap-4">
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Line Weight (px)
                </label>
                <input
                    type="number"
                    min={1}
                    max={8}
                    value={block.settings.lineWeight ?? 1}
                    onChange={e =>
                        dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { lineWeight: Number(e.target.value) } } })
                    }
                    className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                />
            </div>

            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Line Color
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={block.settings.lineColor ?? '#e5e7eb'}
                        onChange={e =>
                            dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { lineColor: e.target.value } } })
                        }
                        className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer"
                    />
                    <span className="text-sm text-black/40">{block.settings.lineColor ?? '#e5e7eb'}</span>
                </div>
            </div>
        </div>
    );
}

export default DividerBlockSettings;