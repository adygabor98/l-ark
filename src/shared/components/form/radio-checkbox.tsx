

interface PropTypes {
    label?: string;
    field: any;
    disabled?: boolean;
}

const RadioCheckbox = (props: PropTypes) => {
    /** Retrieve component properties */
    const { label, field } = props;

    const handleChange = (e: boolean): void => {
        field.onChange(e);
    };

    return (
        <div className='flex justify-center items-center' onClick={() => handleChange(!field.value)}>
            <div
                className={`
                    shrink-0 flex-1 min-w-40 max-w-55 min-h-10 flex gap-2 items-center border-[0.5px] px-3 py-1.5 rounded-lg cursor-pointer select-none
                    ${field.value ? 'border-neutral-600 bg-secondary' : 'border-neutral-400'}
                }`}
            >
                <div className={`w-2.5 h-2.5 rounded-full ${field.value ? 'bg-neutral-700' : 'border border-neutral-600'}`}>
                    { label }
                </div>
            </div>
        </div>
    )
}

export default RadioCheckbox;