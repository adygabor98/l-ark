import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../../export-layout.context';
import type {
    ExportBlock
} from '../../../export-layout.models';

interface SignatureBlockSettingsProps {
    block: ExportBlock;
}

const SignatureBlockSettings = ({ block }: SignatureBlockSettingsProps): ReactElement => {
    /** Export layout api utilities */
    const { dispatch } = useExportLayout();

    const role = block.settings.signatureRole ?? '';

    const update = (settings: Partial<ExportBlock['settings']>): void => {
        dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings } });
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Role (e.g. L'Agència, El Client)
                </label>
                <input
                    type="text"
                    value={role}
                    placeholder="Empty = no heading"
                    onChange={e => update({ signatureRole: e.target.value })}
                    className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                />
            </div>

            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide">
                    Signature Width (px)
                </label>
                <input
                    type="number"
                    min={80}
                    max={600}
                    value={block.settings.signatureWidth ?? 320}
                    onChange={e => update({ signatureWidth: Number(e.target.value) })}
                    className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                />
            </div>

        </div>
    );
}

export default SignatureBlockSettings;