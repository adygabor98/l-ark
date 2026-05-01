import {
    useState,
    useEffect,
    useRef,
    type ReactElement
} from 'react';
import {
    NodeViewWrapper,
    type NodeViewProps
} from '@tiptap/react';
import type {
    FieldTokenAttrs,
    FieldOption
} from '../../export-layout.models';
import {
    getFieldTypeIcon
} from '../../utils/field-token.utils';
const OPTION_FIELD_TYPES = ['CHECKBOX', 'RADIO_GROUP', 'SELECT'];

const parseOptions = (raw?: string | null): FieldOption[] => {
    if (!raw) return [];
    try {
        return JSON.parse(raw) as FieldOption[];
    } catch {
        return [];
    }
}
const FieldTokenNodeView = ({ node, selected }: NodeViewProps): ReactElement => {
    const [isNew, setIsNew] = useState(true);
    const badgeRef = useRef<HTMLSpanElement>(null);
    const attrs = node.attrs as FieldTokenAttrs;
    const icon = getFieldTypeIcon(attrs.fieldType);

    const isOptionField = OPTION_FIELD_TYPES.includes(attrs.fieldType);
    const options = isOptionField ? parseOptions(attrs.options) : [];
    const hasOptions = options.length > 0;

    const isCheckbox = attrs.fieldType === 'CHECKBOX';
    const isRadio = attrs.fieldType === 'RADIO_GROUP';

    // Brief highlight animation on first render (token just inserted)
    useEffect(() => {
        const t = setTimeout(() => setIsNew(false), 1200);
        return () => clearTimeout(t);
    }, []);

    return (
        <NodeViewWrapper as="span" className="not-prose relative inline align-baseline mx-0.5">
            <span
                ref={badgeRef}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    lineHeight: '1.4',
                    backgroundColor: '#fef3c7',
                    border: '2px solid',
                    borderColor: selected ? '#f59e0b' : '#fbbf24',
                    color: '#78350f',
                    boxShadow: selected ? '0 0 0 3px rgba(251,191,36,0.4), 0 2px 8px rgba(0,0,0,0.1)' :
                               isNew    ? '0 0 0 3px rgba(251,191,36,0.4), 0 2px 8px rgba(0,0,0,0.1)' :
                                          '0 1px 3px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'baseline',
                    transform: isNew ? 'scale(1.05)' : undefined,
                    transition: 'all 150ms ease',
                }}
                title={`Field token: ${attrs.fieldLabel} — click to configure`}
            >
                <span style={{ color: '#d97706', fontSize: '12px', flexShrink: 0 }}> { icon } </span>
                <span style={{
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: attrs.bold ? 700 : undefined,
                    fontStyle: attrs.italic ? 'italic' : undefined,
                    textDecoration: attrs.underline ? 'underline' : undefined,
                }}> { attrs.fieldLabel } </span>
            </span>

            {/* Render select options as comma list */}
            { hasOptions && !isCheckbox && !isRadio &&
                <span className="inline text-[10px] text-amber-500 ml-1">
                    ({ options.map(o => o.label).join(', ') })
                </span>
            }
        </NodeViewWrapper>
    );
}

export default FieldTokenNodeView;