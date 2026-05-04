import {
    UserOutlined
} from '@ant-design/icons';
import {
    useTranslation
} from 'react-i18next';

interface IPropTypes {
    field: any
}

const UsernameField = (props: IPropTypes) => {
    /** Retrieve component properties */
    const { field } = props;
    /** Translation utilities */
    const { t } = useTranslation();

    return (
        <div className='w-full flex gap-5'>
            <UserOutlined className='text-2xl' />
            <input
                className='w-full h-13 rounded-[1.2vw] pl-3 [box_shadow:rgba(0,0,0,0.24)_0px_.5px_3px]'
                placeholder={ t('placeholders.username-placeholder') }
                {...field}
            />
        </div>
    );
}

export default UsernameField;