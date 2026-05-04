import {
    Input
} from 'antd';

interface IPropTypes {
    field: any;
    label?: string | null;
    placeholder?: string | null;
}

const PasswordField = (props: IPropTypes) => {
    /** Retrieve component properties */
    const { field, placeholder } = props;

    return (
        <div className='w-full grid grid-cols-[2fr] gap-5 items-center'>
            <Input.Password
                style={{ borderRadius: 8, backgroundColor: 'transparent', color: 'var(--color-foreground)', border: 'none' }}
                className='w-full h-13 focus:shadow-none rounded'
                placeholder={placeholder}
                {...field }
            />
        </div>
    );
}

export default PasswordField;