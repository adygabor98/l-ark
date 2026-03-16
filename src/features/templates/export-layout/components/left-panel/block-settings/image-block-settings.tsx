import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import {
    ALIGNMENTS,
    type ExportBlock
} from '../../../export-layout.models';

interface ImageBlockSettingsProps {
    block: ExportBlock;
}

const ImageBlockSettings = ({ block }: ImageBlockSettingsProps): ReactElement => {
    /** Export layout api utilities */
    const { dispatch } = useExportLayout();

    return (
        <div className="p-4 flex flex-col gap-4">
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Alignment
                </label>
                <div className="flex gap-1">
                    {ALIGNMENTS.map(({ value, Icon }) => (
                        <button
                            key={value}
                            onClick={() => dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { imageAlignment: value } } })}
                            className={`flex-1 flex justify-center p-2 rounded-lg border transition-colors ${ (block.settings.imageAlignment ?? 'left') === value ?
                                'border-amber-400 bg-amber-50 text-amber-700' : 'border-black/10 text-black/40 hover:border-black/20'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Width (px)
                </label>
                <input
                    type="number"
                    min={40}
                    max={750}
                    value={block.settings.imageWidth ?? 200}
                    onChange={e => dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { imageWidth: Number(e.target.value) } } })}
                    className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                />
            </div>
        </div>
    );
}

export default ImageBlockSettings;