import {
    type ReactElement
} from 'react';

interface PropTypes {
    field: any;
    label: string;
    placeholder: string;
}

const ToggleSwitchInput = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { field, label, placeholder } = props;

    return (
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-sm font-[Lato-Bold] text-black/70"> { label } </p>
                <p className="text-[11px] font-[Lato-Regular] text-black/40 mt-0.5"> { placeholder } </p>
            </div>
            <button type="button" role="switch" aria-checked={field.value} onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${ field.value ? 'bg-[#FFBF00]' : 'bg-black/15' }`}
            >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${ field.value ? 'translate-x-4.5 ml-0' : 'translate-x-0.5' }`} />
            </button>
        </div>
    );
}

export default ToggleSwitchInput;