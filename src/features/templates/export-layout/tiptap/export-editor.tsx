import {
    forwardRef,
    useImperativeHandle,
    type ReactElement
} from 'react';
import {
    useEditor,
    EditorContent
} from '@tiptap/react';
import {
    Color
} from '@tiptap/extension-color';
import {
    TextStyle
} from '@tiptap/extension-text-style';
import ExportToolbar from './export-toolbar';
import {
    FieldTokenNode,
    buildFieldTokenSuggestionExtension
} from './extensions/field-token.extension';
import type {
    BlockType,
    AvailableToken
} from '../export-layout.models';
import buildSlashCommandExtension from './extensions/slash-command.extension';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

/** Extends TextStyle with a fontSize attribute (since @tiptap/extension-font-size is prerelease) */
const FontSizeTextStyle = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: el => (el as HTMLElement).style.fontSize || null,
                renderHTML: (attrs: Record<string, unknown>) =>
                    attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
            },
        };
    },
});

export interface ExportEditorHandle {
    insertToken: (fieldId: string, fieldLabel: string, fieldType: string, options?: string) => void;
    getContent: () => Record<string, unknown>;
    setContent: (content: Record<string, unknown>) => void;
}

interface ExportEditorProps {
    initialContent?: Record<string, unknown>;
    onUpdate?: (content: Record<string, unknown>) => void;
    onFocus?: () => void;
    onSlashCommand?: (type: BlockType) => void;
    tokens: AvailableToken[];
    placeholder?: string;
}

export const ExportEditor = forwardRef<ExportEditorHandle, ExportEditorProps>(
    function ExportEditor(
        { initialContent, onUpdate, onFocus, onSlashCommand, tokens, placeholder },
        ref
    ): ReactElement | null {
        const tokensRef = { current: tokens };

        const editor = useEditor({
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: placeholder ?? 'Type "/" for blocks, "@" for field tokens…',
                }),
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                Color,
                FontSizeTextStyle,
                Highlight.configure({ multicolor: true }),
                Underline,
                Subscript,
                Superscript,
                FieldTokenNode,
                buildFieldTokenSuggestionExtension(() => tokensRef.current),
                buildSlashCommandExtension(onSlashCommand ?? (() => {})),
            ],
            content: initialContent ?? { type: 'doc', content: [{ type: 'paragraph' }] },
            onUpdate({ editor }) {
                onUpdate?.(editor.getJSON() as Record<string, unknown>);
            },
            onFocus() {
                onFocus?.();
            },
        });

        useImperativeHandle(ref, () => ({
            insertToken(fieldId, fieldLabel, fieldType, options) {
                editor
                    ?.chain()
                    .focus()
                    .insertContent({
                        type: 'fieldToken',
                        attrs: { fieldId, fieldLabel, fieldType, fallbackText: '—', options: options ?? null },
                    })
                    .insertContent(' ')
                    .run();
            },
            getContent() {
                return (editor?.getJSON() ?? {}) as Record<string, unknown>;
            },
            setContent(content) {
                editor?.commands.setContent(content);
            },
        }), [editor]);

        if (!editor) return null;

        return (
            <div className="border border-black/8 rounded-xl overflow-hidden bg-white">
                <ExportToolbar editor={editor} />
                <EditorContent
                    editor={editor}
                    className={`
                        px-4 py-3 min-h-20 prose prose-sm max-w-none font-[Lato-Regular] text-sm
                        [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-15
                        [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-black/25
                        [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
                        [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
                        [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
                        [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
                        [&_.ProseMirror_[data-node-view-wrapper]]:inline
                        [&_.ProseMirror_[data-node-view-wrapper]]:leading-normal
                        [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:leading-tight [&_.ProseMirror_h1]:mt-3 [&_.ProseMirror_h1]:mb-1
                        [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:leading-tight [&_.ProseMirror_h2]:mt-2 [&_.ProseMirror_h2]:mb-1
                        [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:leading-snug [&_.ProseMirror_h3]:mt-2 [&_.ProseMirror_h3]:mb-0.5
                        [&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:leading-snug [&_.ProseMirror_h4]:mt-1.5 [&_.ProseMirror_h4]:mb-0.5
                    `}
                />
            </div>
        );
    }
);
