import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAgendaStore } from '../store';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import Button from '../../../shared/components/button';

export const Toolbar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    currentDate,
    navigateWeek,
    navigateMonth,
    goToToday,
    openModal,
  } = useAgendaStore();

  const navigateBack = () =>
    viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1);
  const navigateForward = () =>
    viewMode === 'week' ? navigateWeek(1) : navigateMonth(1);

  const label =
    viewMode === 'week'
      ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
      : format(currentDate, 'MMMM yyyy');

  return (
    <header className="flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="sm" onClick={goToToday}>
          Today
        </Button>
        <div className="flex gap-0.5">
          <Button variant="icon" onClick={navigateBack}>
            <ChevronLeft className="w-[18px] h-[18px]" />
          </Button>
          <Button variant="icon" onClick={navigateForward}>
            <ChevronRight className="w-[18px] h-[18px]" />
          </Button>
        </div>
        <h2 className="text-lg font-[Lato-Bold] ml-1 whitespace-nowrap tracking-tight">
          {label}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex bg-secondary rounded-md p-1 gap-0.5">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-4 py-1 text-xs font-[Lato-Bold] rounded cursor-pointer transition-all duration-150 ${
              viewMode === 'week'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-4 py-1 text-xs font-[Lato-Bold] rounded cursor-pointer transition-all duration-150 ${
              viewMode === 'month'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Month
          </button>
        </div>

        <Button variant="primary" size="sm" onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-1" />
          New Event
        </Button>
      </div>
    </header>
  );
};
