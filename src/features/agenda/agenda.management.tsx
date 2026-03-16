import { type ReactElement } from 'react';
import { useAgendaStore } from './store';
import { WeekView } from './components/week-view';
import { MonthView } from './components/month-view';
import { AppointmentModal } from './components/appointment-modal';
import { Toolbar } from './components/toolbar';
import './agenda.styles.scss';

const AgendaManagement = (): ReactElement => {
    const viewMode = useAgendaStore((s) => s.viewMode);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">
            <Toolbar />
            <main className="calendar-container">
                {viewMode === 'week' ? <WeekView /> : <MonthView />}
            </main>
            <AppointmentModal />
        </div>
    );
};

export default AgendaManagement;
