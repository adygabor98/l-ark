import {
    InputNumber
} from "antd";
import {
    useTranslation
} from "react-i18next";

interface PropTypes {
    field: any;
}

const TimeEntryInput = (props: PropTypes) => {
    /** Retrieve component properties */
    const { field } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    /** Retrieve the total minutes */
    const totalMinutes = field.value ?? 0;
    /** Calculate the hours depeding from the minutes */
    const hours = Math.floor(totalMinutes / 60);
    /** calculate the minutes depending on the minutes */
    const minutes = totalMinutes % 60;

    /** Manage to update the field value */
    const update = (h: number, m: number): void => {
        const normalizedHours = h + Math.floor(m / 60);
        const normalizedMinutes = m % 60;

        field.onChange(normalizedHours * 60 + normalizedMinutes);
    };

    return (
        <div className={`h-full w-full pl-2 flex gap-3 items-center justify-start`}>
            <InputNumber
                className='border-none! shadow-sm! focus:outline-none! focus:ring-0! focus:shadow-none! bg-white!'
                min={0}
                {...field}
                controls={false}
                value={hours}
                onChange={(value: any) => update(value ?? 0, minutes)}
                style={{ width: '200px', backgroundColor: 'white' }}
                suffix={ t('labels.hours') }
            />
            <InputNumber
                className='border-none! shadow-sm! focus:outline-none! focus:ring-0! focus:shadow-none! bg-white!'
                min={0}
                max={59}
                {...field}
                controls={false}
                value={minutes}
                onChange={(value: any) => update(hours, value ?? 0)}
                style={{ width: '200px', backgroundColor: 'white' }}
                suffix={ t('labels.minutes') }
            />
        </div>
    );
}

export default TimeEntryInput;