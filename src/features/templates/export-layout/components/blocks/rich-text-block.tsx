import {
    useRef,
    useCallback,
    useEffect,
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
    /** True while the editor itself is the source of a content change — prevents
     *  the sync effect below from re-applying the same update back into TipTap. */
    const selfUpdateRef = useRef(false);

    const handleFocus = useCallback(() => {
        dispatch({
            type: 'SET_ACTIVE_INSERT_FN',
            payload: (fieldId, fieldLabel, fieldType, options, suffix) => editorRef.current?.insertToken(fieldId, fieldLabel, fieldType, options, suffix)
        });
    }, [dispatch]);

    const handleUpdate = useCallback(
        (content: Record<string, unknown>) => {
            selfUpdateRef.current = true;
            dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { content } } });
        },
        [block.id, dispatch]
    );

    /** Sync externally-driven content changes (e.g. CLEAN_ORPHANS) back into
     *  the live TipTap editor.  The selfUpdateRef guard skips the round-trip
     *  when the change originated from the editor itself. */
    useEffect(() => {
        if (selfUpdateRef.current) {
            selfUpdateRef.current = false;
            return;
        }
        if (editorRef.current && block.content) {
            editorRef.current.setContent(block.content as Record<string, unknown>);
        }
    }, [block.content]);

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