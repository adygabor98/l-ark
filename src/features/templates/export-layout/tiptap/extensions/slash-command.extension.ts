import {
    Extension
} from '@tiptap/core';
import {
    PluginKey
} from '@tiptap/pm/state';
import type {
    BlockType
} from '../../export-layout.models';
import Suggestion from '@tiptap/suggestion';

const SLASH_COMMAND_PLUGIN_KEY = new PluginKey('slashCommand');

export interface SlashCommandItem {
    title: string;
    type: BlockType;
    description: string;
    icon: string;
}

export const SLASH_ITEMS: SlashCommandItem[] = [
    { type: 'RICH_TEXT', title: 'Text', description: 'Rich text with formatting', icon: 'T' },
    { type: 'TABLE', title: 'Table', description: 'Link to a TABLE field', icon: '⊞' },
    { type: 'IMAGE', title: 'Image', description: 'Static image or logo', icon: '⬚' },
    { type: 'SIGNATURE', title: 'Signature', description: 'Link to a SIGNATURE field', icon: '✦' },
    { type: 'DIVIDER', title: 'Divider', description: 'Horizontal separator line', icon: '—' },
    { type: 'PAGE_BREAK', title: 'Page Break', description: 'Force a new page', icon: '⌧' },
];

const buildSlashCommandExtension = (onInsertBlock: (type: BlockType) => void) => {
    return Extension.create({
        name: 'slashCommand',

        addOptions() {
            return { suggestion: {} };
        },

        addProseMirrorPlugins() {
            return [
                Suggestion({
                    editor: this.editor,
                    pluginKey: SLASH_COMMAND_PLUGIN_KEY,
                    char: '/',
                    allowSpaces: false,
                    startOfLine: false,

                    items({ query }: { query: string }) {
                        const q = query.toLowerCase();
                        return SLASH_ITEMS.filter(
                            item =>
                                item.title.toLowerCase().includes(q) ||
                                item.description.toLowerCase().includes(q)
                        );
                    },

                    render() {
                        let popup: HTMLElement | null = null;
                        let selectedIndex = 0;
                        let currentItems: SlashCommandItem[] = [];
                        let currentRange: { from: number; to: number } | null = null;
                        let currentEditor: ReturnType<typeof this.editor.commands.focus> | null = null;

                        function renderItems(props: { items: SlashCommandItem[]; range: { from: number; to: number }; editor: any }) {
                            currentItems = props.items;
                            currentRange = props.range;
                            currentEditor = props.editor;

                            if (!popup) return;
                            popup.innerHTML = '';

                            if (props.items.length === 0) {
                                const empty = document.createElement('div');
                                empty.className = 'px-3 py-2 text-sm text-black/40';
                                empty.textContent = 'No block types found';
                                popup.appendChild(empty);
                                return;
                            }

                            props.items.forEach((item, i) => {
                                const btn = document.createElement('button');
                                btn.className = `flex items-center gap-3 w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                                    i === selectedIndex ? 'bg-amber-50 text-amber-700' : 'text-black/70 hover:bg-black/4'
                                }`;
                                btn.innerHTML = `
                                    <span class="w-7 h-7 flex items-center justify-center rounded-md bg-black/6 text-base shrink-0">${item.icon}</span>
                                    <span>
                                        <span class="block font-medium text-sm">${item.title}</span>
                                        <span class="block text-xs text-black/40">${item.description}</span>
                                    </span>
                                `;
                                btn.onclick = () => selectItem(i, props);
                                popup!.appendChild(btn);
                            });
                        }

                        function selectItem(index: number, props: any) {
                            const item = props.items[index];
                            if (!item) return;
                            props.editor
                                .chain()
                                .focus()
                                .deleteRange(props.range)
                                .run();
                            onInsertBlock(item.type);
                            closePopup();
                        }

                        function closePopup() {
                            popup?.remove();
                            popup = null;
                        }

                        function positionPopup(clientRectFn: (() => DOMRect | null) | null | undefined) {
                            if (!popup || !clientRectFn) return;
                            const rect = clientRectFn();
                            if (!rect) return;
                            popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
                            popup.style.left = `${rect.left + window.scrollX}px`;
                        }

                        return {
                            onStart(props: any) {
                                selectedIndex = 0;
                                popup = document.createElement('div');
                                popup.className =
                                    'bg-white border border-black/10 rounded-xl shadow-xl p-1.5 w-64 max-h-72 overflow-y-auto';
                                popup.style.position = 'absolute';
                                popup.style.zIndex = '9999';
                                document.body.appendChild(popup);
                                renderItems(props);
                                positionPopup(props.clientRect);
                            },
                            onUpdate(props: any) {
                                selectedIndex = 0;
                                renderItems(props);
                                positionPopup(props.clientRect);
                            },
                            onKeyDown(props: any) {
                                const { event } = props;
                                if (event.key === 'ArrowDown') {
                                    selectedIndex = (selectedIndex + 1) % currentItems.length;
                                    renderItems({ items: currentItems, range: currentRange!, editor: currentEditor });
                                    return true;
                                }
                                if (event.key === 'ArrowUp') {
                                    selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
                                    renderItems({ items: currentItems, range: currentRange!, editor: currentEditor });
                                    return true;
                                }
                                if (event.key === 'Enter') {
                                    selectItem(selectedIndex, { items: currentItems, range: currentRange, editor: currentEditor });
                                    return true;
                                }
                                if (event.key === 'Escape') {
                                    closePopup();
                                    return true;
                                }
                                return false;
                            },
                            onExit() {
                                closePopup();
                            },
                        };
                    }
                })
            ];
        }
    });
}

export default buildSlashCommandExtension;