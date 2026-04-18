import {
    useEffect,
    useState
} from 'react';
import {
    Radio
} from 'antd'
import {
    useTranslation
} from 'react-i18next';
import {
    OperationType
} from '@l-ark/types';

interface PropTypes {
    label?: string | null;
    field: any;
    disabled?: boolean;
    dataType: string;
}

const RadioField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { field, disabled, dataType } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    /** State to manage the options */
    const [options, setOptions] = useState<{ value: any, label: string }[]>([]);

    useEffect(() => {
        if( dataType === 'operation-category' ) {
            setOptions([
                { label: 'Global', value: OperationType.GLOBAL },
                { label: 'Other', value: OperationType.OTHER }
            ]);
        } else {
            setOptions([
                { value: true, label: t('labels.yes') },
                { value: false, label: t('labels.no') }
            ]);
        }
    }, [dataType]);
    
    
    return (
        <div className='w-full grid grid-cols-[auto_2fr] gap-5 items-center px-3 py-1'>
            <Radio.Group buttonStyle="solid" {...field} value={field.value ?? false} style={{ pointerEvents: disabled ? 'none' : 'all' }}>
                { options.map((option: { value: any, label: string }) => (
                    <Radio.Button key={option.value} value={option.value}> { option.label } </Radio.Button>
                )) }
            </Radio.Group>
        </div>
    )
}

export default RadioField