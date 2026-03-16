import {
    type ReactElement
} from 'react';
import {
    PenLine
} from 'lucide-react';
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

    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <PenLine className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-[Lato-Regular] text-emerald-700"> Signature Block </span>
            </div>

            <label className="block text-xs text-emerald-600 mb-1"> Bound SIGNATURE field </label>
            <select
                value={block.sourceFieldId ?? ''}
                onChange={e =>
                    dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { sourceFieldId: e.target.value } } })
                }
                className="w-full text-sm border border-emerald-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-emerald-400"
            >
                <option value=""> — Select a SIGNATURE field — </option>
                { signatureFields.map(f => <option key={f.fieldId} value={f.fieldId}>{f.fieldLabel} ({f.sectionTitle})</option> )}
            </select>

            <div className="mt-3 border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center">
                { boundField ?
                    <>
                        <div className="text-emerald-600 font-[Lato-Regular] text-sm mb-1"> { boundField.fieldLabel } </div>
                        <div className="text-emerald-400 text-xs italic"> Signature image will appear here at export time </div>
                    </>
                :
                    <div className="text-emerald-400 text-xs italic">
                        Select a signature field above to bind this block
                    </div>
                }
            </div>

            { signatureFields.length === 0 &&
                <p className="text-xs text-emerald-500 mt-2">
                    No SIGNATURE fields in this template. Add one in the builder.
                </p>
            }
        </div>
    );
}

export default SignatureBlock;