import {
    type ReactElement
} from 'react';

interface PropTypes {
    children: ReactElement;
}

const Layout = (props: PropTypes) => {
    /** Retrieve component properties */
    const { children } = props;

    return (
        <div className='h-full w-full'>
            { children }
        </div>
    );
}

export default Layout;