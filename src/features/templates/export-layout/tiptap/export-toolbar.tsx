import {
    type ReactElement
} from 'react';
import type {
    Editor
} from '@tiptap/react';
import {
    useTranslation
} from 'react-i18next';
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered
} from 'lucide-react';

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    title?: string;
    children: React.ReactNode;
}

const ToolbarButton = ({ onClick, isActive, title, children }: ToolbarButtonProps): ReactElement => {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center
                ${isActive ? 'bg-amber-100 text-amber-700' : 'text-black/40 hover:text-black hover:bg-black/4'}`}
        >
            {children}
        </button>
    );
}

const Divider = (): ReactElement => {
    return <div className="w-px h-4 bg-black/8 mx-0.5" />;
}

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32'];

interface ExportToolbarProps {
    editor: Editor;
}

const ExportToolbar = ({ editor }: ExportToolbarProps): ReactElement => {
    const { t } = useTranslation();
    const currentSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') ?? '14';

    return (
        <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-black/6 bg-[#F8F9FA] rounded-t-xl">
            {/* Font size */}
            <select
                value={currentSize}
                onChange={e => {
                    editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}px` }).run();
                }}
                className="text-xs border border-black/10 rounded-md px-1 py-1 bg-white text-black/60 cursor-pointer h-7 outline-none focus:border-amber-400"
                title={ t('toolbar.font-size') }
            >
                { FONT_SIZES.map(s => <option key={s} value={s}> { s } px </option>) }
            </select>

            <Divider />

            {/* Text formatting */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title={ t('toolbar.bold') }
            >
                <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title={ t('toolbar.italic') }
            >
                <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title={ t('toolbar.underline') }
            >
                <Underline className="w-3.5 h-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Alignment */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title={ t('toolbar.align-left') }
            >
                <AlignLeft className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title={ t('toolbar.align-center') }
            >
                <AlignCenter className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title={ t('toolbar.align-right') }
            >
                <AlignRight className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title={ t('toolbar.align-justify') }
            >
                <AlignJustify className="w-3.5 h-3.5" />
            </ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title={ t('toolbar.bullet-list') }
            >
                <List className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title={ t('toolbar.ordered-list') }
            >
                <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarButton>

            <Divider />
        </div>
    );
}

export default ExportToolbar;