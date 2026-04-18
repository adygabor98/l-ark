import {
    type ReactElement
} from 'react';
import {
    Controller
} from "react-hook-form";
import {
    useTranslation
} from 'react-i18next';
import SelectInput from '../../shared/components/form/select-input';
import TextAreaField from '../../shared/components/form/textarea-input';
import DateInput from '../../shared/components/form/date-input';
import CheckboxInput from './form/checkbox-input';
import PasswordField from './form/password-input';
import UsernameField from './form/username-input';
import TimeField from './form/time-input';
import NumberField from './form/number-input';
import RadioField from './form/radio-input';
import FileInput from './form/file-input';
import TextField from './form/text-input';
import RadioCheckbox from './form/radio-checkbox';
import TimeEntryInput from './form/time-entry-input';
import SwitchInput from './form/switch-input';
import ToggleSwitchInput from './form/toggle-switch-input';

interface IPropTypes {
    disabled?: boolean;
    mode?: string;
    small?: boolean;
    name: any;
    type: string;
    dataType?: string;
    control?: any;
    required?: boolean;
    label?: string | null;
    placeholder?: string | null;
    validators?: Object;
    pattern?: {
        value: RegExp;
        message: string;
    };
    className?: string;
    suffix?: string;
    params?: Object;
    variables?: Object;
    multiple?: boolean;
    disableIds?: string[];
    simple?: boolean;
    onSelectChange?: (value: string, label: string) => void;
}

const Field = (props: IPropTypes) => {
    /** Retrieve component properties */
    const { simple, small, disabled, name, type, dataType, control, disableIds, suffix, required, label, placeholder, validators, pattern, className, multiple, mode, onSelectChange } = props;
    const { params } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    
    const renderType = (field: any): ReactElement => {
        switch( type ) {
            case 'password': 
                return <PasswordField field={field} label={label} placeholder={placeholder} />;
            case 'username':
                return <UsernameField field={field} />;
            case 'date':
                return <DateInput field={field} placeholder={placeholder} />
            case 'time':
                return <TimeField field={field} small={small} />;
            case 'number':
                return <NumberField field={field} suffix={suffix} />;
            case 'radio':
                return <RadioField field={field} label={label} disabled={disabled} dataType={dataType as string} />;
            case 'image':
                return <FileInput field={field} />;
            case 'switch':
                return <SwitchInput field={field} />
            case 'toggle-switch':
                return <ToggleSwitchInput field={field} label={label || ''} placeholder={placeholder || ''} />
            case 'select':
                return <SelectInput
                    field={field}
                    data-type={dataType}
                    params={params}
                    placeholder={placeholder}
                    multiple={multiple}
                    disabled={disabled}
                    disableIds={disableIds}
                    onSelectChange={onSelectChange}
                />
            case 'radio-checkbox':
                return <RadioCheckbox field={field} />;
            case 'checkbox':
                return <CheckboxInput field={field} disabled={disabled} />
            case 'textarea':
                return <TextAreaField field={field} label={label} placeholder={placeholder} disabled={disabled} />;
            case 'time-entry':
                return <TimeEntryInput field={field} />
            default:
                return <TextField field={field} placeholder={placeholder} small={small} disabled={disabled}  mode={mode} />;
        }
    };

    return (
        <Controller
            name={name}
            control={control}
            shouldUnregister={false}
            rules={{
                required: required ? (typeof required === 'string' ? required : t('messages.required')) : false,
                ...(pattern ? { pattern } : {}),
                ...(validators ?? {})
            }}
            render={({ field, fieldState }) =>
                type === 'toggle-switch' ?
                    renderType(field)
                : simple && label ?
                    <div className='flex flex-col gap-2'>
                        <label className="text-[11px] font-[Lato-Bold] text-black/40 uppercase tracking-widest"> { label } </label>
                        <div className={`w-full flex flex-col border-[0.5px] ${fieldState.invalid ? 'h-auto border-red-400' : type === 'textarea' ? 'min-h-25 h-auto border-gray-300' : type === 'checkbox' ? 'min-h-15' : 'h-auto border-gray-300'} rounded-md ${className} bg-secondary/50 border-border/50 focus:bg-background focus:border-primary/30 transition-all shadow-sm`}>
                            { renderType(field) }
                        </div>
                        { fieldState.invalid && <p className='text-red-400 text-[14px] pl-3 pb-1'> { fieldState.error?.message ? fieldState.error?.message : t('messages.required') } </p> }
                    </div>
                :
                    <fieldset className={`w-full flex flex-col border-[0.5px] ${fieldState.invalid ? 'h-auto border-red-400' : type === 'textarea' ? 'min-h-25 h-auto border-gray-300' : type === 'checkbox' ? 'min-h-15' : 'h-auto border-gray-300'} rounded-md ${className} bg-secondary/50 border-border/50 focus:bg-background focus:border-primary/30 transition-all shadow-sm`}>
                        { label && <legend className={`h-fit w-fit ml-2 px-2 text-sm font-[Lato-Bold]! select-none ${fieldState.invalid ? 'text-red-600' : 'text-tertiary'}`}> { label } </legend> }
                        { renderType(field) }
                        { fieldState.invalid && <p className='text-red-400 text-[14px] pl-3 pb-1'> { fieldState.error?.message ? fieldState.error?.message : t('messages.required') } </p> }
                    </fieldset>
            }
        />
    )
}

export default Field;