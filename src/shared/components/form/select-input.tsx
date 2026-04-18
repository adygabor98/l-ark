import {
    useEffect,
    useState
} from "react";
import {
    type DocumentNode,
    gql,
    useLazyQuery
} from "@apollo/client";
import {
    Select
} from "antd";
import {
    RETRIEVE_ALL_ROLES
} from "../../../server/api/roles/role";
import {
    RETRIEVE_OFFICES
} from "../../../server/api/office";
import {
    RETRIEVE_USERS
} from "../../../server/api/users/user";
import {
    RETRIEVE_DIVISIONS
} from "../../../server/api/division";
import {
    RETRIEVE_FILE_TEMPLATES
} from "../../../server/api/template/file-template";
import { RETRIEVE_BLUEPRINTS } from "../../../server/api/operation/operation.queries";
import {
    ConditionalVisibility,
    StepType
} from '@l-ark/types';

const { Option } = Select;

interface PropTypes {
    placeholder?: string | null;
    field: any;
    disabled?: boolean;
    'data-type'?: string;
    params?: Object;
    multiple?: boolean;
    disableIds?: string[];

    onSelectChange?: (value: string, label: string) => void;
}

interface Element {
    value: string | null;
    label: string;
}

/** Return the endpoint depending on the type of elements the user wants */
const getRequestQuery = (type: string | undefined): DocumentNode => {
    switch(type) {
        case 'roles': return RETRIEVE_ALL_ROLES;
        case 'users': return RETRIEVE_USERS;
        case 'offices': return RETRIEVE_OFFICES;
        case 'divisions': return RETRIEVE_DIVISIONS;
        case 'file-templates': return RETRIEVE_FILE_TEMPLATES;
        case 'blueprints': return RETRIEVE_BLUEPRINTS;
        default: return gql`query empty { __emtpy }`
    }
}

const SelectInput = (props: PropTypes) => {
    /** Retrieve component properties */
    const { disabled, disableIds, placeholder, field, 'data-type': type, params, multiple, onSelectChange } = props;
    /** State to manage the elements displayed in the dropdown */
    const [elements, setElements] = useState<Array<Element>>([]);
    /** Api query */
    const [ retrieveElements] = useLazyQuery(getRequestQuery(type), { fetchPolicy: 'network-only', variables: params ?? {} });

    useEffect(() => {
        const initialize = async () => {
            const response = await retrieveElements({ variables: params ?? {} });

            if( response?.data?.data ) {
                const loadedElements = response.data.data.map((element: { id: number, firstName: string, lastName: string, name: string, title: string }) => ({
                    value: element.id.toString(),
                    label: ['file-templates', 'blueprints'].includes(type ?? '') ? element.title : element.name || `${element.firstName} ${element.lastName}`
                }));
                setElements(loadedElements);

                // Clear the form value if it no longer matches any available option
                if ( !multiple && field.value && !loadedElements.some((el: Element) => el.value === field.value) ) {
                    field.onChange(undefined);
                }
            }
        }
        if( type === 'blueprint-step-types' ) {
            setElements([
                { value: StepType.STANDARD, label: 'Standard' },
                { value: StepType.NOTIFICATION, label: 'Notification' },
                { value: StepType.OPEN_OPERATION, label: 'Open Operation' },
                { value: StepType.WAIT_FOR_LINKED, label: 'Wait for Opened Operation' },
                { value: StepType.CLOSURE, label: 'Closure' },
            ])
        } else if( type === 'blueprint-conditional-visibility') {
            setElements([
                { value: 'always', label: 'Always' },
                { value: ConditionalVisibility.LINKED_ONLY, label: 'Only when launched by another operation' },
                { value: ConditionalVisibility.STANDALONE_ONLY, label: ' Only when opened standalone' }
            ]);
        } else {
            initialize();
        }
    }, [type, params]);
    
    return (
        <div className={`w-full gap-5 items-center`}>
            <Select
                {...field}
                value={multiple
                    ? (field.value?.length ? field.value : undefined)
                    : (field.value && elements.some(el => el.value === field.value) ? field.value : undefined)
                }
                style={{ width: '100%', minHeight: '40px', border: 'none', fontSize: 16, backgroundColor: 'transparent!important', paddingInlineStart: '12px' }}
                placeholder={placeholder}
                mode={multiple ? "multiple" : undefined}
                disabled={disabled}
                showSearch={false}
                maxTagCount={1}
                virtual={false}
                tagRender={(tagProps) => (
                    <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                        {tagProps.label}
                    </span>
                )}
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
                onChange={(value) => {
                    field.onChange(value);
                    if (onSelectChange) {
                        const selectedElement = elements.find(el => el.value === value);
                        onSelectChange(value, selectedElement?.label || '');
                    }
                }}
            >
                { elements.map((element: Element) => <Option key={element.value} value={element.value} disabled={disableIds?.includes(element.value ?? '')}> { element.label } </Option> ) }
            </Select>
        </div>
    );
}

export default SelectInput;