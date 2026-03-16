
interface PropTypes {
    disabled?: boolean;
    small?: boolean;
    placeholder?: string | null;
    field: any;
    isRegister?: boolean;
    mode?: string;
}

const TextField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { disabled, placeholder, field } = props;

    return (
        <input
            className='w-full py-2.5 rounded-[0.7vw] pl-3 text-[16px] font-[Lato-Light] text-foreground'
            placeholder={ placeholder }
            {...field}
            value={field.value ?? ""}
            disabled={disabled}
        />
);
}

export default TextField;