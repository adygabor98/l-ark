import {
    type ReactElement
} from 'react';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock
} from '../../export-layout.models';

interface SignatureBlockProps {
    block: ExportBlock;
}

const SignatureBlock = ({ block }: SignatureBlockProps): ReactElement => {
    const { state, dispatch } = useExportLayout();

    const signatureFields = state.tokens.filter(t => t.fieldType === 'SIGNATURE');
    const boundField = state.tokens.find(t => t.fieldId === block.sourceFieldId);
    const role = (block.settings.signatureRole ?? '').trim();
    const label = boundField?.fieldLabel ?? 'Signatura';

    return (
        <div className="flex flex-col gap-2 py-2 w-full">
            {/* Paper-ready preview — matches export output */}
            { role &&
                <div className="text-[10px] uppercase tracking-widest font-[Lato-Bold] text-black/75 mb-1">
                    { role }
                </div>
            }
            <div className="text-[10px] text-black/60 font-[Lato-Regular]">
                { label }
            </div>
            <div style={{ height: 36, borderBottom: '1px solid rgba(0,0,0,0.85)' }} />

            {/* Compact binding control */}
            <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-black/35 font-[Lato-Regular] shrink-0"> Bound field: </span>
                <select
                    value={block.sourceFieldId ?? ''}
                    onChange={e =>
                        dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { sourceFieldId: e.target.value } } })
                    }
                    className="flex-1 text-[11px] border border-black/15 rounded-md px-2 py-1 bg-white outline-none focus:border-amber-400 text-black/60"
                >
                    <option value=""> — select — </option>
                    { signatureFields.map(f => <option key={f.fieldId} value={f.fieldId}>{f.fieldLabel}</option> )}
                </select>
            </div>

            { signatureFields.length === 0 &&
                <p className="text-[10px] text-black/35 italic">
                    No SIGNATURE fields in this template.
                </p>
            }
        </div>
    );
}

export default SignatureBlock;