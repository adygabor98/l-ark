import { Switch } from 'antd';
import {
    type ReactElement
} from 'react';

interface PropTypes {
    field: any;
}

const SwitchInput = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { field } = props;

    return (
        <Switch
            checked={field.value}
            {...field}
            className='border-none! shadow-none! focus:outline-none! focus:ring-0! focus:shadow-none! bg-transparent!'
            style={{ width: '100%', backgroundColor: 'transparent' }}
        />
    );
}

export default SwitchInput;