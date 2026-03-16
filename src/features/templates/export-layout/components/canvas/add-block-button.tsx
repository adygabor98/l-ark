import {
    useState,
    useEffect,
    useId,
    type ReactElement
} from 'react';
import {
    createPortal
} from 'react-dom';
import {
    Plus
} from 'lucide-react';
import SlashCommandMenu from '../slash-command/slash-command-menu';
import type {
    BlockType
} from '../../export-layout.models';

const SLASH_MENU_EVENT = 'slash-menu-open';
const MENU_HEIGHT = 320; // conservative max height of SlashCommandMenu
const MENU_WIDTH  = 256; // w-64

const getMenuPos = (clientX: number, clientY: number) => ({
    top:  clientY + 8 + MENU_HEIGHT > window.innerHeight ? clientY - MENU_HEIGHT - 8 : clientY + 8,
    left: Math.max(8, Math.min(window.innerWidth - MENU_WIDTH - 8, clientX - MENU_WIDTH / 2)),
});

interface AddBlockButtonProps {
    onInsert: (type: BlockType) => void;
    label?: string;
}

const AddBlockButton = ({ onInsert, label = 'Add block' }: AddBlockButtonProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const id = useId();

    useEffect(() => {
        const handleOtherOpen = (e: Event) => {
            if ((e as CustomEvent<{ id: string }>).detail.id !== id) setOpen(false);
        };
        document.addEventListener(SLASH_MENU_EVENT, handleOtherOpen);
        return () => document.removeEventListener(SLASH_MENU_EVENT, handleOtherOpen);
    }, [id]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (open) { setOpen(false); return; }
        document.dispatchEvent(new CustomEvent(SLASH_MENU_EVENT, { detail: { id } }));
        setMenuPos(getMenuPos(e.clientX, e.clientY));
        setOpen(true);
    };

    return (
        <div className="relative flex justify-center">
            <button onClick={handleClick}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-black/15 rounded-xl text-sm text-black/35 hover:text-black/60 hover:border-black/25 transition-all bg-white hover:bg-black/2"
            >
                <Plus className="w-4 h-4" />
                { label }
            </button>

            { open && createPortal(
                <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}>
                    <SlashCommandMenu
                        onInsert={type => {
                            onInsert(type);
                            setOpen(false);
                        }}
                        onClose={() => setOpen(false)}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}

export default AddBlockButton;
