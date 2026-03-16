import {
    type ReactElement
} from 'react';
import {
    useEditor,
    EditorContent
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    List,
    ListOrdered
} from 'lucide-react';

interface TiptapEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const TiptapEditor = (props: TiptapEditorProps): ReactElement | null => {
    /** Retrieve component properties */
    const { value, onChange, placeholder } = props;

    /** Initialize the tiptap editor */
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: placeholder || 'Enter description...' }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    /** Toolbar button component */
    const ToolbarButton = ({ onClick, isActive, children }: { onClick: () => void; isActive: boolean; children: React.ReactNode }): ReactElement => (
        <button
            type="button"
            onClick={onClick}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-black/8 text-black' : 'text-black/40 hover:text-black hover:bg-black/4'}`}
        >
            { children }
        </button>
    );

    return (
        <div className="border border-black/8 rounded-xl overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-black/6 bg-[#F8F9FA]">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
                    <Italic className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-4 bg-black/8 mx-1" />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor content */}
            <EditorContent
                editor={editor}
                className="p-3 min-h-30 prose prose-sm max-w-none font-[Lato-Regular] text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-25 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-black/30 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
            />
        </div>
    );
};

export default TiptapEditor;
