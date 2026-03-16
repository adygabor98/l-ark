import {
    type ReactElement
} from 'react';
import {
    ArrowLeft
} from 'lucide-react';
import {
    findBlockInRows,
    useExportLayout
} from '../../export-layout.context';
import DocumentSettings from './document-settings';
import BlockSettingsPanel from './block-settings/block-settings-panel';
import Button from '../../../../../shared/components/button';

const LeftPanel = (): ReactElement => {
    /** Export layout api utilities */
    const { state, dispatch } = useExportLayout();
    const block = state.selectedBlockId ? findBlockInRows(state.rows, state.selectedBlockId) : undefined;
    const hasSelection = state.selectedBlockId !== null && block?.type !== 'RICH_TEXT';

    return (
        <div className="w-65 shrink-0 border-r border-black/8 bg-white flex flex-col overflow-hidden rounded-lg shadow-sm">
            { hasSelection &&
                <div className="px-4 py-3 border-b border-black/6">
                    <Button variant='ghost' onClick={() => dispatch({ type: 'SELECT_BLOCK', payload: { id: null } })}>
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Document Settings
                    </Button>
                </div>
            }

            <div className="flex-1 overflow-y-auto">
                { hasSelection ? <BlockSettingsPanel /> : <DocumentSettings /> }
            </div>
        </div>
    );
}

export default LeftPanel;