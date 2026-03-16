import TextArea from "antd/es/input/TextArea";

interface PropTypes {
    label?: string | null;
    disabled?: boolean;
    placeholder?: string | null;
    field: any;
}

const TextAreaField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { disabled, placeholder, field } = props;

    return (
        <div className={`w-full grid grid-cols-[2fr] gap-5 items-center`}>
            <TextArea
                className={`textarea-input w-full pl-3 text-sm font-[Lato-Light] border-none`}
                placeholder={placeholder}
                autoSize
                {...field}
                style={{ border: 'none', backgroundColor: 'transparent' }}
                value={field.value ?? ""}
                disabled={disabled}
            />
        </div>
    );
}

export default TextAreaField