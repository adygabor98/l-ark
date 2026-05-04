import {
    Checkbox
} from 'antd';

interface PropTypes {
    label?: string;
    field: any;
    disabled?: boolean;
}

const CheckboxInput = (props: PropTypes) => {
    /** Retrieve component properties */
    const { label, field, disabled } = props;

    const handleChange = (e: boolean): void => {
        field.onChange(e);
    };

    return (
        <div className='flex justify-center items-center' onClick={() => handleChange(!field.value)}>
            <Checkbox
                checked={field.value ?? false}
                disabled={disabled}
                className="custom-checkbox"
            >
                <span className="text-[14px] font-[Lato-Light]">{label}</span>
            </Checkbox>
        </div>
    )
}

export default CheckboxInput;