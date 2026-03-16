import {
	type ReactElement
} from 'react';
import {
	useExportLayout,
	findBlockInRows
} from '../../../export-layout.context';
import {
	BLOCK_TYPE_LABELS
} from '../../../export-layout.models';
import SignatureBlockSettings from './signature-block-settings';
import ImageBlockSettings from './image-block-settings';
import DividerBlockSettings from './divider-block-settings';
import TableBlockSettings from './table-block-settings';

const BlockSettingsPanel = (): ReactElement => {
	/** Export layout api response */
	const { state } = useExportLayout();

	const block = state.selectedBlockId ? findBlockInRows(state.rows, state.selectedBlockId) : undefined;

	if ( !block ) 
		return (
			<div className="p-4 text-xs text-black/30"> No block selected </div>
		);

	const label = BLOCK_TYPE_LABELS[block.type] ?? block.type;

	return (
		<div>
			<div className="flex items-center gap-2 px-4 py-3 border-b border-black/6">
				<span className="text-xs font-[Lato-Regular] text-black/50 uppercase tracking-wide"> { label } Settings </span>
			</div>

			{ block.type === 'TABLE' && <TableBlockSettings block={block} />}
			{ block.type === 'IMAGE' && <ImageBlockSettings block={block} />}
			{ block.type === 'SIGNATURE' && <SignatureBlockSettings block={block} />}
			{ block.type === 'DIVIDER' && <DividerBlockSettings block={block} />}
			{ block.type === 'PAGE_BREAK' &&
				<p className="px-4 py-3 text-xs text-black/40">
					Page breaks have no configurable settings.
				</p>
			}
			{ block.type === 'BLANK' &&
				<p className="px-4 py-3 text-xs text-black/40">
					Blank blocks have no configurable settings.
				</p>
			}
		</div>
	);
}

export default BlockSettingsPanel;