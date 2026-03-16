import {
    ReactNodeViewRenderer
} from '@tiptap/react';
import {
    Node,
    Extension
} from '@tiptap/core';
import Suggestion, {
    type SuggestionProps,
    type SuggestionKeyDownProps
} from '@tiptap/suggestion';
import {
    PluginKey
} from '@tiptap/pm/state';
import FieldTokenNodeView from '../nodes/field-token.node';
import type {
    AvailableToken,
    FieldTokenAttrs
} from '../../export-layout.models';

const FIELD_TOKEN_PLUGIN_KEY = new PluginKey('fieldTokenSuggestion');

export const FieldTokenNode = Node.create({
    name: 'fieldToken',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            fieldId: { default: null },
            fieldLabel: { default: null },
            fieldType: { default: null },
            fallbackText: { default: '—' },
            dateFormat: { default: null },
            numberFormat: { default: null },
            options: { default: null }
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-field-token]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', { 'data-field-token': '', ...HTMLAttributes }];
    },

    addNodeView() {
        return ReactNodeViewRenderer(FieldTokenNodeView);
    },
});

const buildPreviewFieldTokenExtension = () => {
    return FieldTokenNode.extend({
        renderHTML({ node }) {
            const { fieldType, fieldLabel } = node.attrs as FieldTokenAttrs;
            const DATE_PLACEHOLDER = 'DD/MM/YYYY'
            const DATETIME_PLACEHOLDER = 'DD/MM/YYYY  HH:mm'

            const lineChar = '.';
            const blankFill = lineChar.repeat(30);
            const blankStyle = 'display: inline-block; min-width: 120px; vertical-align: bottom; letter-spacing: 0.5px; color:#888; font-size: inherit;';

        
            if (fieldType === 'ADDRESS') {
                return [
                    'span',
                    { 'data-field-preview': 'ADDRESS', style: ' display: inline-flex; flex-direction: column; gap: 4px;' },
                    [ 'span', { style: `${blankStyle}; min-width: 120px;` }, blankFill.repeat(2) ]
                ];
            }

            if (fieldType === 'BOOLEAN') {
                return [
                    'span',
                    { 'data-field-preview': 'BOOLEAN', style: 'display:inline-flex;align-items:center;gap:12px;' },
                    ['span', { style: 'display:inline-flex;align-items:center;gap:4px;' },
                        ['span', { style: 'border:1.5px solid #555;display:inline-block;width:13px;height:13px;border-radius:2px;flex-shrink:0;' }],
                        ['span', {}, 'Yes'],
                    ],
                    ['span', { style: 'display:inline-flex;align-items:center;gap:4px;' },
                        ['span', { style: 'border:1.5px solid #555;display:inline-block;width:13px;height:13px;border-radius:2px;flex-shrink:0;' }],
                        ['span', {}, 'No'],
                    ],
                ];
            }

            if (fieldType === 'FILE') {
                return [
                    'span',
                    { 'data-field-preview': 'FILE', style: 'display:inline-flex;align-items:center;gap:4px;' },
                    ['span', { style: 'font-size:12px;flex-shrink:0;' }, '📎'],
                    ['span', { style: `${blankStyle}min-width:160px;` }, blankFill],
                ];
            }

            if ( ['RADIO_GROUP', 'CHECKBOX'].includes(fieldType) ) {
                const options = JSON.parse(node.attrs.options || '[]');

                return [
                    'span',
                    {
                        'data-field-preview': 'CHECKBOX',
                        style: 'display: inline-flex; gap: 20px;'
                    },
                    ...options.map((opt: any) => [
                        'span',
                        { style: 'display: inline-flex; align-items: center; gap: 6px;' },
                        [ 'span', { style: `border: 1.5px solid #555; display: inline-block; width: 13px; height: 13px; border-radius: ${fieldType === 'RADIO_GROUP' ? '50%' : '2px'}; flex-shrink: 0;` } ],
                        ['span', { style: 'font-family: Lato-Bold' }, opt.label]
                    ])
                ];
            }

            if (fieldType === 'DESCRIPTION' || fieldType === 'TEXTAREA') {
                const line = lineChar.repeat(80);
                return [
                    'span',
                    {
                        'data-field-preview': fieldType,
                        style: 'display: block; margin-top: 4px; margin-bottom: 4px; color:#888; letter-spacing: 0.5px; line-height: 2.2;',
                    },
                    line,
                ];
            }

            if( ["DATE", "DATE_TIME"].includes(fieldType) ) {
                return ['span', { 'data-field-preview': fieldType }, "DATE" === fieldType ? DATE_PLACEHOLDER : DATETIME_PLACEHOLDER]
            }

            // Default: underline fill that looks like a classic form blank line
            return [
                'span',
                {
                    'data-field-preview': '',
                    'data-field-label': fieldLabel ?? '',
                    title: fieldLabel ?? '',
                    style: blankStyle,
                },
                blankFill,
            ];
        },
    });
}

/** Separate Extension that adds the @ mention suggestion plugin.
 *  Keeps the Node and the suggestion decoupled. */
export function buildFieldTokenSuggestionExtension(getTokens: () => AvailableToken[]) {
    return Extension.create({
        name: 'fieldTokenSuggestion',

        addProseMirrorPlugins() {
            const editor = this.editor;
            return [
                Suggestion<AvailableToken>({
                    editor,
                    pluginKey: FIELD_TOKEN_PLUGIN_KEY,
                    char: '@',
                    allowSpaces: false,

                    items({ query }: { query: string }) {
                        const q = query.toLowerCase();
                        return getTokens().filter(
                            t =>
                                t.fieldLabel.toLowerCase().includes(q) ||
                                t.fieldType.toLowerCase().includes(q)
                        );
                    },

                    render() {
                        let popup: HTMLElement | null = null;
                        let selectedIndex = 0;

                        function positionPopup(clientRectFn: (() => DOMRect | null) | null | undefined) {
                            if (!popup || !clientRectFn) return;
                            const rect = clientRectFn();
                            if (!rect) return;
                            popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
                            popup.style.left = `${rect.left + window.scrollX}px`;
                        }

                        function renderList(props: SuggestionProps<AvailableToken>) {
                            if (!popup) return;
                            popup.innerHTML = '';

                            if (props.items.length === 0) {
                                const el = document.createElement('div');
                                el.className = 'px-3 py-2 text-sm text-black/40';
                                el.textContent = 'No fields found';
                                popup.appendChild(el);
                                return;
                            }

                            props.items.forEach((item, i) => {
                                const btn = document.createElement('button');
                                btn.className = `flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs rounded-lg transition-colors ${
                                    i === selectedIndex ? 'bg-amber-50 text-amber-700' : 'text-black/70 hover:bg-black/4'
                                }`;
                                btn.innerHTML = `<span class="font-medium">${item.fieldLabel}</span><span class="text-black/30 ml-auto">${item.sectionTitle}</span>`;
                                btn.onclick = () => {
                                    props.command(item);
                                };
                                popup!.appendChild(btn);
                            });
                        }

                        return {
                            onStart(props) {
                                selectedIndex = 0;
                                popup = document.createElement('div');
                                popup.className =
                                    'bg-white border border-black/10 rounded-xl shadow-xl p-1.5 w-56 max-h-52 overflow-y-auto';
                                popup.style.position = 'absolute';
                                popup.style.zIndex = '9999';
                                document.body.appendChild(popup);
                                renderList(props);
                                positionPopup(props.clientRect);
                            },
                            onUpdate(props) {
                                selectedIndex = 0;
                                renderList(props);
                                positionPopup(props.clientRect);
                            },
                            onKeyDown({ event }: SuggestionKeyDownProps) {
                                if (event.key === 'Escape') {
                                    popup?.remove();
                                    popup = null;
                                    return true;
                                }
                                return false;
                            },
                            onExit() {
                                popup?.remove();
                                popup = null;
                            },
                        };
                    },

                    command({ editor, range, props }) {
                        const hasOptions = props.options && props.options.length > 0;
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertContent({
                                type: 'fieldToken',
                                attrs: {
                                    fieldId: props.fieldId,
                                    fieldLabel: props.fieldLabel,
                                    fieldType: props.fieldType,
                                    fallbackText: '—',
                                    options: hasOptions ? JSON.stringify(props.options) : null,
                                },
                            })
                            .insertContent(' ')
                            .run();
                    }
                })
            ];
        }
    });
}

export default buildPreviewFieldTokenExtension;