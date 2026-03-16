import {
    type ReactElement,
    useEffect,
    useRef,
    useState
} from "react";
import {
    DeleteOutlined,
    WarningOutlined
} from '@ant-design/icons';
import {
    Empty,
    Pagination
} from "antd";
import {
    useTranslation
} from "react-i18next";
import { format } from "date-fns";

export  const chunks = (elements: any, size: number) => elements.reduce((resultArray: any, item: any, index: number) => { 
    const chunkIndex = Math.floor(index/size)

    if(!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray;
}, [])

interface PropTypes {
    elements: Array<any>;
    headers: Array<HeaderType>;
    sortBy?: string;

    onAdd?: (id: string, item?: any) => void;
    onDelete?: (element: any) => void;
    onChildClicked?: (type: string, item: any) => void;
}

export interface PaginationType {
    page: number;
    limit: number;
    total: number;
}

export interface HeaderType {
    key: string;
    label?: string;
    width?: string;
    link?: boolean;
    align?: string;
    type?: string;
    warning?: string
}

const List = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { elements, headers, sortBy } = props;
    const { onAdd, onDelete, onChildClicked } = props;
    /** State of the chunk elements */
    const [items, setItems] = useState<Array<any>>([]);
    /** State to manage the pagination */
    const [pagination, setPagination] = useState<PaginationType>({ total: 0, limit: 10, page: 1 });
    /** Translation utilities */
    const { t } = useTranslation();
    /** Ref to the scrollable container */
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    /** Manage to create the chunks */
    useEffect(() => {
        setPagination((prevState: any) => ({...prevState, page: 1, total: elements.length }));
        setItems(chunks([...elements].sort(((a: any, b: any) => parseInt(a[sortBy ?? ''] ??a.id) - parseInt(b[sortBy ?? ''] ?? b.id) )), pagination.limit));
    }, [elements]);
    
    /** Change the page of the pagination */
    const onChangePagination = (page: number): void => {
        setPagination((prevState: any) => ({ ...prevState, page: page }));
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /** Change the size of the elements per page */
    const onChangePaginationSize = (_: unknown, size: number): void => {
        setItems(chunks(elements, size))
        setPagination((prevState: any) => ({...prevState, limit: size, page: 1 }));
    }

    /** Manage to trigger the deletion of an element */
    const handleDelete = (evt: any, element: any): void => {
        evt.stopPropagation();
        onDelete && onDelete(element);
    }

    /** Render the cell depending on the type */
    const renderCell = (header: HeaderType, item: any): ReactElement => {
        switch( header.key ) {
            case 'active':
                return (
                    <div key={item.id + header.key} className={header.width ?? 'w-full'}>
                        <span className={`w-2 px-2 py-1 text-[13px] ${item[header.key] ? 'bg-[#F6FFED] text-[#52C41A] border border-[#B7EB8f]' : 'bg-[#FFF2F0] text-[#FF4D4F] border border-[#FFCCC7]'} rounded font-[Lato-Light]`}>
                            { item[header.key] ? t('labels.active') : item.deletedAt ? format(new Date(item.deletedAt), 'dd-MM-yyyy') : t('labels.inactive') }
                        </span>
                    </div>
                );
            case '': // Actions
                return (
                    <div key={item.id + header.key} className={`${header.width ?? 'w-full'} flex gap-3`}>
                        <button className='text-muted-foreground text-[15px] font-[Lato-Light] select-none'>
                            <div onClick={(evt: any) => handleDelete(evt, item)} className="flex gap-2 items-center justify-center h-full w-[100px] py-1 cursor-pointer rounded">
                                <DeleteOutlined style={{ color: 'var(--color-muted-foreground)' }} />
                            </div>
                        </button>
                    </div>
                );
            default:
                const value = getNestedValue(item, header.key);
                return (
                    <div
                        key={item.id + header.key}
                        className={`flex items-center gap-2 ${header.width ?? 'w-full'} text-foreground text-[13px] font-[Lato-Light] select-none ${header.align == 'center' ? 'text-center' : ''}`}
                    >
                        { header.warning && !item[header.warning] && <WarningOutlined style={{ fontSize: 20, color: 'orange' }} /> }
                        <span
                            className={`cursor-pointer ${header.link ? 'hover:underline decoration-1 underline-offset-4 transition' : ''}`}
                            onClick={(evt: any) => {
                                if( header.link && onChildClicked && header.type) {
                                    onChildClicked(header.type, item);
                                    evt.stopPropagation()
                                }
                            }}
                        > 
                            { value }
                        </span>
                    </div>
                )
        }
    }

    /** Helper function to get nested property values */
    const getNestedValue = (obj: any, path: string): any => {
        // Check if path contains multiple space-separated keys for concatenation
        const paths = path.trim().split(/\s+/);

        if (paths.length > 1) {
            // Concatenate multiple nested values with a space
            return paths
                .map(p => resolveNestedPath(obj, p))
                .filter(val => val !== undefined && val !== null && val !== '')
                .join(' ');
        }

        // Single path - use resolveNestedPath
        return resolveNestedPath(obj, path);
    }

    /** Helper function to resolve a single nested path with array notation support */
    const resolveNestedPath = (obj: any, path: string): any => {
        // Replace array bracket notation with dot notation
        // e.g., "manager[0].user.firstName" -> "manager.0.user.firstName"
        const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');

        // Split by dots and traverse the object
        return normalizedPath.split('.').reduce((current, prop) => current?.[prop], obj);
    }

    /** Manage the click of the row */
    const onClickRow = (item: any) => {
        onAdd && onAdd(item.id, item)
    }

    return (
        <div className="w-full h-full bg-white flex flex-col gap-3 overflow-hidden">
            <div className="h-[50px] flex w-full bg-secondary rounded-lg px-4 py-3 shadow-sm border border-border/50">
                { (headers ?? []).map((header: HeaderType) => (
                    <span key={header.key} className={`${header.width ?? 'w-full'} text-muted-foreground text-[13px] font-[Lato-Light] select-none`}> { header.label } </span>
                )) }
            </div>

            <div ref={scrollContainerRef} className={`h-[calc(100%-100px)] flex flex-col gap-2 overflow-auto`}>
                { (items[pagination.page-1] ?? []).map((item: any) => (
                    <div key={item.id} onClick={() => onClickRow(item)} className='flex w-full rounded-lg px-4 py-3 hover:bg-secondary cursor-pointer'>
                        { headers.map((header: HeaderType) => renderCell(header, item) ) }
                    </div>
                )) }
                { items.length == 0 &&
                    <Empty />
                }
            </div>
            <div className="h-[50px] flex items-center justify-end">
                <Pagination
                    showSizeChanger
                    showTotal={(total, range) => `${range[0]}-${range[1]} ${ t('labels.of') } ${total} ${ t('labels.items') }`}
                    current={pagination.page}
                    total={pagination.total}
                    pageSize={pagination.limit}
                    onChange={onChangePagination}
                    onShowSizeChange={onChangePaginationSize}
                />
            </div>
        </div>
    );
}

export default List;