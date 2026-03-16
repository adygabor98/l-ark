import { type ReactElement, useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from './avatar';
import usePermissions from '../hooks/usePermissions';
import { AtSign, Bold, Italic, LinkIcon, List } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useForm } from 'react-hook-form';
import { useTask } from '../../server/hooks/useTask';
import { useToast } from '../hooks/useToast';
import type { FetchResult } from '@apollo/client';
import type { ApiResponse } from '@m-ark/types';

interface CommentFormData {
    comment: string;
}

interface PropTypes {
    taskId: string;
}

const Comment = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { taskId } = props;
    /** Permissions utilities */
    const { user } = usePermissions();
    /** State to track active formats for button highlighting */
    const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, bulletList: false });
    /** Form definition - stores comment as HTML string */
    const { setValue, handleSubmit, reset } = useForm<CommentFormData>({
        mode: 'onChange',
        defaultValues: {
            comment: ''
        }
    });
    /** Task api utilities */
    const { createTaskComment } = useTask();
    /** Toast utilities */
    const { onToast } = useToast();

    /** Update active formats based on current editor state */
    const updateActiveFormats = (editorInstance: ReturnType<typeof useEditor>) => {
        if (!editorInstance) return;
        setActiveFormats({
            bold: editorInstance.isActive('bold'),
            italic: editorInstance.isActive('italic'),
            bulletList: editorInstance.isActive('bulletList')
        });
    };

    /** Tiptap editor instance */
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false
                }
            }),
            Placeholder.configure({
                placeholder: 'Add a comment. Use @ to mention someone.'
            })
        ],
        editorProps: {
            attributes: {
                class: 'w-full bg-background min-h-20 resize-y text-sm p-2 rounded-md border border-border/50 focus:outline-none focus:border-primary/50 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4'
            }
        },
        onUpdate: ({ editor: ed }) => {
            updateActiveFormats(ed);
            // Sync editor content to form - store as HTML
            setValue('comment', ed.getHTML());
        },
        onSelectionUpdate: ({ editor: ed }) => updateActiveFormats(ed)
    });

    /** Sync form value to editor when editor is ready */
    useEffect(() => {
        if (editor && !editor.isDestroyed) {
            const currentContent = editor.getHTML();
            if (currentContent === '<p></p>') {
                setValue('comment', '');
            }
        }
    }, [editor, setValue]);

    /** Handle form submission */
    const onSubmit = handleSubmit(async (data) => {
        if (!data.comment || data.comment === '<p></p>') return;

        const response: FetchResult<{ data: ApiResponse<number> }> = await createTaskComment({ taskId: taskId, text: data.comment });
        if( response.data?.data.success ) {
            onToast({ message: response.data.data.message, type: 'success' });
            // Clear editor after submit
            editor?.commands.clearContent();
            reset();
        }
    });

    /** Handle Bold button click */
    const handleBold = () => {
        editor?.chain().focus().toggleBold().run();
        updateActiveFormats(editor);
    };

    /** Handle Italic button click */
    const handleItalic = () => {
        editor?.chain().focus().toggleItalic().run();
        updateActiveFormats(editor);
    };

    /** Handle List button click */
    const handleList = () => {
        editor?.chain().focus().toggleBulletList().run();
        updateActiveFormats(editor);
    };

    return (
        <div className="p-4 bg-muted/30 border-b border-border/50">
            <div className="flex gap-4">
                <Avatar className="h-8 w-8 mt-5">
                    <AvatarFallback className="bg-primary text-primary-foreground font-[Lato-Bold] text-xs">
                        {`${user?.firstName} ${user?.lastName}`.split(' ').map((split: string) => split[0].toUpperCase()).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <EditorContent editor={editor} />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleBold}
                                className={`h-7 w-7 rounded cursor-pointer flex items-center justify-center ${activeFormats.bold ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Bold className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleItalic}
                                className={`h-7 w-7 rounded cursor-pointer flex items-center justify-center ${activeFormats.italic ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Italic className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleList}
                                className={`h-7 w-7 rounded cursor-pointer flex items-center justify-center ${activeFormats.bulletList ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                            <button className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center"><LinkIcon className="w-3.5 h-3.5" /></button>
                            <button className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center"><AtSign className="w-3.5 h-3.5" /></button>
                        </div>
                        <button
                            type="button"
                            onClick={onSubmit}
                            className="h-8 px-4 bg-secondary rounded-[5px] shadow-sm text-sm font-[Lato-Light] cursor-pointer hover:font-[Lato-Regular]"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Comment;
