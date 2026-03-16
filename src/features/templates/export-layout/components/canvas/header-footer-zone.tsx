import {
    useCallback,
    useRef,
    type ReactElement,
    type ChangeEvent
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
import type {
    Editor
} from '@tiptap/react';
import {
    Upload,
    X,
    Hash,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight
} from 'lucide-react';
import {
    useExportLayout
} from '../../export-layout.context';
import {
    FieldTokenNode,
    buildFieldTokenSuggestionExtension,
} from '../../tiptap/extensions/field-token.extension';
import type {
    AvailableToken
} from '../../export-layout.models';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';

// Mini toolbar for header/footer
const MiniToolbar = ({ editor }: { editor: Editor }): ReactElement => {
    const btn = ( onClick: () => void, isActive: boolean, title: string, icon: ReactElement ) => (
        <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            title={title}
            className={`p-1 rounded transition-colors ${ isActive ? 'bg-amber-100 text-amber-700' : 'text-black/40 hover:text-black/70 hover:bg-black/4' }`}
        >
            { icon }
        </button>
    );

    return (
        <div className="flex items-center gap-0.5 mb-1">
            { btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'Bold', <Bold className="w-3 h-3" /> )}
            { btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'Italic', <Italic className="w-3 h-3" /> )}
            { btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'Underline', <UnderlineIcon className="w-3 h-3" /> )}
            <div className="w-px h-3 bg-black/10 mx-0.5" />

            { btn(() => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }), 'Align left', <AlignLeft className="w-3 h-3" /> )}
            { btn(() => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }), 'Align center', <AlignCenter className="w-3 h-3" /> )}
            { btn(() => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }), 'Align right', <AlignRight className="w-3 h-3" /> )}
        </div>
    );
}

// Inline TipTap editor for header/footer
const ZoneEditor = ({ content, placeholder, tokens, onUpdate }: { content?: Record<string, unknown>; placeholder: string; tokens: AvailableToken[]; onUpdate: (content: Record<string, unknown>) => void; }): ReactElement | null => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Placeholder.configure({ placeholder }),
            TextAlign.configure({ types: ['paragraph'] }),
            Color,
            TextStyle,
            Highlight.configure({ multicolor: true }),
            Underline,
            FieldTokenNode,
            buildFieldTokenSuggestionExtension(() => tokens),
        ],
        content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
        onUpdate({ editor }) {
            onUpdate(editor.getJSON() as Record<string, unknown>);
        },
    });

    if (!editor) return null;

    return (
        <div className="flex-1 min-w-0">
            <MiniToolbar editor={editor} />
            <EditorContent
                editor={editor}
                className={`
                    text-xs prose prose-sm max-w-none
                    [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-5
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-black/25
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
                    [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
                `}
            />
            <p className="text-[9px] text-black/25 mt-1"> Type @ to insert a field token </p>
        </div>
    );
}

// Logo upload widget
const LogoUpload = ({ logoUrl, logoWidth }: { logoUrl?: string; logoWidth: number }): ReactElement => {
    const { dispatch } = useExportLayout();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => {
            dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: { logoUrl: reader.result as string } });
        };
        reader.readAsDataURL(file);

        // Reset so the same file can be selected again
        e.target.value = '';
    }, [dispatch]);

    const handleRemove = useCallback(() => {
        dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: { logoUrl: undefined } });
    }, [dispatch]);

    if (logoUrl) {
        return (
            <div className="relative shrink-0 group" style={{ width: logoWidth, height: logoWidth }}>
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded" />
                <button onClick={handleRemove} title="Remove logo"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X className="w-2.5 h-2.5" />
                </button>
            </div>
        );
    }

    return (
        <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 bg-black/5 hover:bg-black/8 rounded flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer border border-dashed border-black/15 hover:border-black/25"
                style={{ width: logoWidth, height: logoWidth }}
                title="Upload logo"
            >
                <Upload className="w-3.5 h-3.5 text-black/30" />
                <span className="text-[8px] text-black/30 leading-tight">Logo</span>
            </button>
        </>
    );
}

// Header/Footer zone
interface HeaderFooterZoneProps {
    zone: 'header' | 'footer';
}

const HeaderFooterZone = ({ zone }: HeaderFooterZoneProps): ReactElement | null => {
    const { state, dispatch } = useExportLayout();
    const { pageConfig, tokens } = state;
    const isHeader = zone === 'header';

    const isVisible = isHeader ? pageConfig.showHeader : pageConfig.showFooter;
    if (!isVisible) return null;

    const pos = pageConfig.pageNumberPosition;
    const showPageNum = !isHeader && pos !== 'none';
    const logoWidth = pageConfig.logoWidth ?? 40;

    const handleContentUpdate = useCallback((content: Record<string, unknown>) => {
            if (isHeader) {
                dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: { headerContent: content } });
            } else {
                dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: { footerContent: content } });
            }
        },
        [dispatch, isHeader]
    );

    const pageNumStyle: React.CSSProperties = {
        textAlign: pos === 'center' ? 'center' : pos === 'right' ? 'right' : 'left',
    };

    return (
        <div className={`px-3 py-2 rounded-lg border text-xs ${ isHeader ? 'border-black/10 bg-black/2 mb-1' : 'border-black/10 bg-black/2 mt-1' }`}>
            { isHeader ?
                <div className="flex items-start gap-3">
                    { pageConfig.showLogo && <LogoUpload logoUrl={pageConfig.logoUrl} logoWidth={logoWidth} /> }
                    <ZoneEditor content={pageConfig.headerContent} onUpdate={handleContentUpdate} placeholder="Type header text here... use @ to insert fields" tokens={tokens} />
                </div>
            :
                <div className="flex flex-col gap-1">
                    <ZoneEditor content={pageConfig.footerContent} onUpdate={handleContentUpdate} placeholder="Type footer text here... use @ to insert fields" tokens={tokens} />
                    { showPageNum &&
                        <div style={pageNumStyle} className="w-full">
                            <span className="inline-flex items-center gap-1 text-black/40">
                                <Hash className="w-3 h-3" />
                                Page 1 of N
                            </span>
                        </div>
                    }
                </div>
            }
        </div>
    );
}

export default HeaderFooterZone;