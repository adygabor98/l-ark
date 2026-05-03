import {
    useEffect,
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
import {
    AgendaViewMode
} from '../../constants';
import {
    AppointmentModal
} from './components/appointment-modal';
import AgendaHeader from './components/agenda-heaader';
import Loading from '../../shared/components/loading';

const AgendaManagement = (): ReactElement => {
    /** State to manage the agenda mode */
    const [viewMode, setViewMode] = useState<AgendaViewMode>(AgendaViewMode.WEEK);
    /** State to manage the current date selected */
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    /** State to manage the displayment of the appointment modal */
    const [showAppointment, setShowAppointment] = useState<number | null | { date: string, startTime: string, endTime: string }>(null);
    /** State to manage the loading of the new appointments */
    const [loading, setLoading] = useState<boolean>(false);
    
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false)
        }, 500);
    }, [currentDate])
    
    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            <AgendaHeader viewMode={viewMode} currentDate={currentDate} setViewMode={setViewMode} setCurrentDate={setCurrentDate} setShowAppointment={setShowAppointment} />
            <main className="calendar-container">
                { loading ?
                    <Loading />
                : viewMode === 'week' ?
                    <WeekView currentDate={currentDate} setOpen={setShowAppointment} />
                :
                    <MonthView currentDate={currentDate} setCurrentDate={setCurrentDate} setOpen={setShowAppointment} setViewMode={setViewMode} />
                }
                
            </main>
            { !!showAppointment && <AppointmentModal open={!!showAppointment} id={showAppointment} setOpen={setShowAppointment} /> }
        </div>
    );
};

export default AgendaManagement;
