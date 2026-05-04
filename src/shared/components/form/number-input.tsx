import {
    InputNumber
} from "antd";
import {
    Infinity
} from "lucide-react";

interface PropTypes {
    field: any;
    suffix?: string;
    hideInfinity?: boolean;
}

const NumberField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { field, suffix, hideInfinity } = props;

    return (
        <div className="grid grid-cols-[1fr_36px] gap-2 items-center">
            <div className={`grid grid-cols-[auto] gap-5 items-center`}>
                { field.value === null && !hideInfinity ?
                    <div className="h-10 lex-1 flex items-center justify-center">
                        <Infinity className="h-4 w-4 text-muted-foreground" />
                        <span className="ml-1.5 text-sm font-[Lato-Regular] text-muted-foreground"> Unlimited </span>
                    </div>
                :
                    <InputNumber
                        className='border-none! shadow-none! focus:outline-none! focus:ring-0! focus:shadow-none! bg-transparent!'
                        {...field}
                        controls={false}
                        value={field.value ?? 0}
                        style={{ width: '100%', minHeight: '40px', display: 'flex', alignItems: 'center', backgroundColor: 'transparent' }}
                        suffix={suffix}
                    />
                }
            </div>
            { !hideInfinity &&
                <button
                    type="button"
                    title={field.value === null ? 'Set a number' : 'Set unlimited'}
                    onClick={() => field.onChange(field.value === null ? 1 : null )}
                    className="w-fit! px-2 h-full border-l border-gray-200 text-muted-foreground hover:text-[#FFBF00] hover:bg-amber-50 transition-colors cursor-pointer"
                >
                    <Infinity className="h-3.5 w-3.5" />
                </button>
            }
        </div>
    );
}

export default NumberField;