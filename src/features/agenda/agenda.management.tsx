import {
    useState,
    type ReactElement
} from 'react';
import {
    WeekView
} from './components/week-view';
import {
    MonthView
} from './components/month-view';
import './agenda.styles.scss';
import { AgendaViewMode } from '../../constants';
import AgendaHeader from './components/agenda-heaader';
import { AppointmentModal } from './components/appointment-modal';

const AgendaManagement = (): ReactElement => {
    /** State to manage the agenda mode */
    const [viewMode, setViewMode] = useState<AgendaViewMode>(AgendaViewMode.WEEK);
    /** State to manage the current date selected */
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    /** State to manage the displayment of the appointment modal */
    const [showAppointment, setShowAppointment] = useState<boolean>(false);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            <AgendaHeader viewMode={viewMode} currentDate={currentDate} setViewMode={setViewMode} setCurrentDate={setCurrentDate} setShowAppointment={setShowAppointment} />
            <main className="calendar-container">
                { viewMode === 'week' ? <WeekView /> : <MonthView /> }
            </main>
            { showAppointment && <AppointmentModal /> }
        </div>
    );
};

export default AgendaManagement;
