import {
    useRef,
    useCallback,
    type ReactElement
} from 'react';
import {
    ExportEditor,
    type ExportEditorHandle
} from '../../tiptap/export-editor';
import {
    useExportLayout,
    findRowOfBlock
} from '../../export-layout.context';
import {
    ExportErrorBoundary
} from '../export-error-boundary';
import type {
    ExportBlock,
    BlockType
} from '../../export-layout.models';

interface RichTextBlockProps {
    block: ExportBlock;
}

const RichTextBlock = ({ block }: RichTextBlockProps): ReactElement => {
    const { state, dispatch } = useExportLayout();
    const editorRef = useRef<ExportEditorHandle>(null);

    const handleFocus = useCallback(() => {
        dispatch({
            type: 'SET_ACTIVE_INSERT_FN',
            payload: (fieldId, fieldLabel, fieldType, options) => editorRef.current?.insertToken(fieldId, fieldLabel, fieldType, options)
        });
    }, [dispatch]);

    const handleUpdate = useCallback(
        (content: Record<string, unknown>) => dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { content } } }),
        [block.id, dispatch]
    );

    const handleSlashCommand = useCallback((type: BlockType) => {
            const row = findRowOfBlock(state.rows, block.id);

            dispatch({ type: 'ADD_ROW', payload: { blockType: type, afterRowId: row?.id } });
        },
        [block.id, dispatch, state.rows]
    );

    return (
        <ExportErrorBoundary>
            <ExportEditor
                ref={editorRef}
                initialContent={block.content}
                onUpdate={handleUpdate}
                onFocus={handleFocus}
                onSlashCommand={handleSlashCommand}
                tokens={state.tokens}
            />
        </ExportErrorBoundary>
    );
}

export default RichTextBlock;