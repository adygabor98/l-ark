import {
    useEffect,
    useRef,
    useState,
    type ReactElement
} from 'react';
import type {
    BlockType
} from '../../export-layout.models';
import {
    SLASH_MENU_ITEMS
} from './slash-command.types';

interface SlashCommandMenuProps {
    onInsert: (type: BlockType) => void;
    onClose: () => void;
}

const SlashCommandMenu = ({ onInsert, onClose }: SlashCommandMenuProps): ReactElement => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = SLASH_MENU_ITEMS.filter(
        item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => (i + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                onInsert(filtered[selectedIndex].type);
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="bg-white border border-black/10 rounded-xl shadow-xl overflow-hidden w-64">
            <div className="p-2 border-b border-black/6">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Filter block types…"
                    className="w-full text-sm outline-none px-2 py-1 placeholder:text-black/30"
                />
            </div>
            <div className="p-1.5 max-h-64 overflow-y-auto">
                { filtered.length === 0 ?
                    <div className="px-3 py-2 text-sm text-black/40">No blocks found</div>
                :
                    filtered.map((item, i) => (
                        <button key={item.type}
                            onClick={() => {
                                onInsert(item.type);
                                onClose();
                            }}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg transition-colors ${
                                i === selectedIndex ? 'bg-amber-50' : 'hover:bg-black/4'
                            }`}
                        >
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-base shrink-0 ${
                                i === selectedIndex ? 'bg-amber-100 text-amber-700' : 'bg-black/6 text-black/60'
                            }`}>
                                {item.icon}
                            </span>
                            <span>
                                <span className="block text-sm font-medium text-black/80">{item.title}</span>
                                <span className="block text-xs text-black/40">{item.description}</span>
                            </span>
                        </button>
                    ))
                }
            </div>
        </div>
    );
}

export default SlashCommandMenu;