import {
	type Dispatch,
	type ReactElement,
	type SetStateAction
} from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Plus
} from 'lucide-react';
import {
	startOfWeek,
	endOfWeek,
	format
} from 'date-fns';
import {
	AgendaViewMode
} from '../../../constants';
import Button from '../../../shared/components/button';

interface PropTypes {
	viewMode: AgendaViewMode;
	currentDate: Date;

	setViewMode: Dispatch<SetStateAction<AgendaViewMode>>;
	setCurrentDate: Dispatch<SetStateAction<Date>>;
	setShowAppointment: Dispatch<SetStateAction<boolean>>;
}

const AgendaHeader = (props: PropTypes): ReactElement => {
	/** Retrieve component properties */
	const { viewMode, currentDate, setViewMode, setCurrentDate, setShowAppointment } = props;

	/** Manage to change the week */
	const onChangeWeek = (dir: number): void => {
		const d = new Date(currentDate);
		d.setDate(d.getDate() + dir * 7);

		setCurrentDate(d);
	}

	/** Manage to change the month */
	const onChangeMonth = (dir: number): void => {
		const d = new Date(currentDate);
		d.setMonth(d.getMonth() + dir);
		setCurrentDate(d);
	}

	/** Manage to set the current date as today */
	const goToToday = (): void => {
		setCurrentDate(new Date());
	}

	/** Manage to navigate back */
	const navigateBack = () => viewMode === AgendaViewMode.WEEK ? onChangeWeek(-1) : onChangeMonth(-1);

	/** Manage to navigate forward */
	const navigateForward = () => viewMode === AgendaViewMode.WEEK ? onChangeWeek(1) : onChangeMonth(1);

	const label = viewMode === AgendaViewMode.WEEK
		? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
		: format(currentDate, 'MMMM yyyy');

	return (
		<header className="flex items-center justify-between gap-4 shrink-0 px-2">
			<div className="flex items-center gap-1.5">
				<Button variant="secondary" size="sm" onClick={goToToday}>
					Today
				</Button>
				<div className="flex items-center gap-2">
					<Button variant="icon" onClick={navigateBack}>
						<ChevronLeft className="w-4.5 h-4.5" />
					</Button>
					<h2 className="text-lg font-[Lato-Bold] ml-1 whitespace-nowrap tracking-tight"> { label } </h2>
					<Button variant="icon" onClick={navigateForward}>
						<ChevronRight className="w-4.5 h-4.5" />
					</Button>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{/* View toggle */}
				<div className="flex bg-secondary rounded-md p-1 gap-2">
					<Button variant='secondary' size='sm' onClick={() => setViewMode(AgendaViewMode.WEEK)}
						className={`${ viewMode === AgendaViewMode.WEEK ? 'bg-primary! text-primary-foreground! shadow-sm' : 'text-muted-foreground hover:text-foreground' }`}
					>
						Week
					</Button>
					<Button variant='secondary' size='sm' onClick={() => setViewMode(AgendaViewMode.MONTH)}
						className={`${ viewMode === AgendaViewMode.MONTH ? 'bg-primary! text-primary-foreground! shadow-sm' : 'text-muted-foreground hover:text-foreground' }`}
					>
						Month
					</Button>
				</div>

				<Button variant="primary" size="md" onClick={() => setShowAppointment(true)}>
					<Plus className="w-4 h-4 mr-1" />
					New Event
				</Button>
			</div>
		</header>
	);
};

export default AgendaHeader;