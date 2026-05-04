
interface PropTypes {
    field: any;
    small?: boolean;
}

const TimeField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { field, small } = props;

    return (
        <input
            type="time"
            {...field}
            className={`w-full rounded-[0.7vw] text-[14px] font-[Lato-Light] pl-3 bg-transparent text-neutral-700 ${small ? 'h-10' : 'h-13'} `}
        />
    );
}

export default TimeField;