import {
    DatePicker
} from "antd";
import dayjs from "dayjs";
import es from 'antd/es/date-picker/locale/es_ES';

interface PropTypes {
    placeholder?: string | null;
    field: any;
}

const DateField = (props: PropTypes) => {
    /** Retrieve component properties */
    const { placeholder, field } = props;

    return (
        <div className={`w-full grid grid-cols-[auto] gap-5 items-center`}>
            <DatePicker
                {...field}
                placeholder={placeholder ?? ''}
                value={field.value ? dayjs(field.value) : null}
                style={{ height: 40 }}
                onChange={(date) => field.onChange(date ? date.toISOString() : null)}
                format="DD-MM-YYYY"
                locale={es}
                styles={{ backgroundColor: 'transparent' }}
            />
        </div>
    );
};

export default DateField;