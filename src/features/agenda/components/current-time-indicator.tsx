import {
    type ReactElement
} from 'react';
import {
    HOUR_HEIGHT
} from '../utils/agenda.utils';

const CurrentTimeIndicator = (): ReactElement => {
    const now = new Date();
	const minutes = now.getHours() * 60 + now.getMinutes();
	const top = (minutes / 60) * HOUR_HEIGHT;

	return (
		<div className="current-time-line" style={{ top: `${top}px` }}>
			<div className="current-time-dot" />
		</div>
    );
}

export default CurrentTimeIndicator;