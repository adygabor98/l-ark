import {
    type ReactElement
} from 'react';
import type {
    AvailableToken
} from '../../export-layout.models';
import {
    getFieldTypeIcon
} from '../../utils/field-token.utils';
import {
    useExportLayout
} from '../../export-layout.context';
import toast from 'react-hot-toast';

interface TokenItemProps {
    token: AvailableToken;
}

const TokenItem = ({ token }: TokenItemProps): ReactElement => {
    const { state } = useExportLayout();
    const icon = getFieldTypeIcon(token.fieldType);

    const handleClick = () => {
        if (!state.activeEditorInsertFn) {
            toast('Focus a text block first', { icon: '📝', duration: 2000 });
            return;
        }
        const opts = token.options && token.options.length > 0 ? JSON.stringify(token.options) : undefined;
        state.activeEditorInsertFn(token.fieldId, token.fieldLabel, token.fieldType, opts);
    };

    return (
        <button
            onMouseDown={e => {
                if (state.activeEditorInsertFn){
                    e.preventDefault();
                }
            }}
            onClick={handleClick}
            title={ state.activeEditorInsertFn ? `Insert "${token.fieldLabel}" token` : 'Focus a text block first' }
            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-colors text-xs group
                ${state.activeEditorInsertFn
                    ? 'hover:bg-amber-50 hover:text-amber-700 cursor-pointer'
                    : 'cursor-default opacity-60'
                }`}
        >
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-medium shrink-0 group-hover:border-amber-400 transition-colors">
                <span> { icon } </span>
                <span className='text-xs font-[Lato-Regular]'> { token.fieldLabel } </span>
            </span>
            <span className="text-black/30 truncate font-[Lato-Regular]">{ token.fieldType.toLowerCase() }</span>
        </button>
    );
}

export default TokenItem;