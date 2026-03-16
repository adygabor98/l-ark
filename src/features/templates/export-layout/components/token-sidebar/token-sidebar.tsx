import {
    useState,
    type ReactElement
} from 'react';
import {
    Search,
    AtSign,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import {
    useExportLayout
} from '../../export-layout.context';
import TokenItem from './token-item';

interface TokenSidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

const TokenSidebar = ({ collapsed = false, onToggle }: TokenSidebarProps): ReactElement => {
    const { state } = useExportLayout();
    const [query, setQuery] = useState('');

    const filtered = state.tokens.filter(t =>
        t.fieldLabel.toLowerCase().includes(query.toLowerCase()) ||
        t.sectionTitle.toLowerCase().includes(query.toLowerCase())
    );

    // Group by section
    const groups = filtered.reduce<Record<string, typeof filtered>>((acc, token) => {
        const key = token.sectionTitle;
        if (!acc[key]) acc[key] = [];

        acc[key].push(token);
        return acc;
    }, {});

    // Collapsed state: thin strip with icon
    if (collapsed) {
        return (
            <div className="w-10 shrink-0 border-l border-black/8 bg-white flex flex-col items-center rounded-lg shadow-sm">
                <button
                    onClick={onToggle}
                    title="Expand field tokens"
                    className="p-2 mt-3 rounded-lg text-black/30 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="mt-2 p-2 text-amber-500">
                    <AtSign className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-black/30 font-[Lato-Regular] [writing-mode:vertical-lr] mt-2 tracking-wider">
                    TOKENS
                </span>
            </div>
        );
    }

    return (
        <div className="w-65 shrink-0 border-l border-black/8 bg-white flex flex-col overflow-hidden rounded-lg shadow-sm transition-all duration-300">
            {/* Header */}
            <div className="px-4 py-4 border-b border-black/6">
                <div className="flex items-center gap-2 mb-3">
                    <AtSign className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-[Lato-Regular] text-black/70 flex-1"> Field Tokens </span>
                    <button
                        onClick={onToggle}
                        title="Collapse panel"
                        className="p-1 rounded-md text-black/30 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search fields…"
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-black/10 rounded-lg outline-none focus:border-amber-400 bg-white"
                    />
                </div>
            </div>

            {/* Hint */}
            <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-600">
                { state.activeEditorInsertFn ? 'Click a token to insert it at cursor' : 'Focus a text block to enable insert' }
            </div>

            {/* Token list */}
            <div className="flex-1 overflow-y-auto py-2">
                { Object.keys(groups).length === 0 ?
                    <div className="px-4 py-6 text-center text-xs text-black/30">
                        { state.tokens.length === 0 ? 'No fields in this template yet.' : 'No fields match your search.' }
                    </div>
                :
                    Object.entries(groups).map(([sectionTitle, tokens]) => (
                        <div key={sectionTitle} className="mb-3">
                            <div className="px-4 py-1 text-xs font-[Lato-Regular] text-black/30 uppercase tracking-wider">
                                { sectionTitle }
                            </div>
                            <div className="px-2">
                                { tokens.map(t => <TokenItem key={t.fieldId} token={t} />) }
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

export default TokenSidebar;
