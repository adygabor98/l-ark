import {
    Radio
} from 'antd'
import { useTranslation } from 'react-i18next';

interface PropTypes {
    label?: string | null;
    field: any;
    disabled?: boolean;
}

const RadioField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { label, field, disabled } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    
    return (
        <div className='w-full grid grid-cols-[auto_2fr] gap-5 items-center'>
            <label className='text-muted-foreground font-[Lato-Light] text-sm'> { label } </label>
            <Radio.Group buttonStyle="solid" {...field} value={field.value ?? false} style={{ pointerEvents: disabled ? 'none' : 'all' }}>
                <Radio.Button value={true}> { t('labels.yes') } </Radio.Button>
                <Radio.Button value={false}> { t('labels.no') } </Radio.Button>
            </Radio.Group>
        </div>
    )
}

export default RadioField