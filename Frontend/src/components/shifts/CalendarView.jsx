import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addDays, addWeeks, addMonths } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import ShiftEvent from './ShiftEvent.jsx';

const ToolbarButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
    }`}
  >
    {children}
  </button>
);

const CalendarToolbar = ({ label, onNavigate, onView, view, views }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <ToolbarButton onClick={() => onNavigate('TODAY')}>Today</ToolbarButton>
      <ToolbarButton onClick={() => onNavigate('PREV')}>Back</ToolbarButton>
      <ToolbarButton onClick={() => onNavigate('NEXT')}>Next</ToolbarButton>
    </div>
    <div className="text-sm font-semibold text-foreground">{label}</div>
    <div className="flex items-center gap-2">
      {views.map((item) => (
        <ToolbarButton
          key={item}
          active={view === item}
          onClick={() => onView(item)}
        >
          {item[0].toUpperCase() + item.slice(1)}
        </ToolbarButton>
      ))}
    </div>
  </div>
);

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

const SHIFT_COLORS = {
  morning: 'var(--shift-morning)',
  evening: 'var(--shift-evening)',
  night: 'var(--shift-night)',
};

export default function CalendarView({
  events = [],
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  onEventResize,
  onRangeChange,
  canEdit,
  view = 'week',
  date = new Date(),
  onViewChange,
  onDateChange,
}) {
  const handleNavigate = (actionOrDate) => {
    if (actionOrDate instanceof Date) {
      onDateChange?.(actionOrDate);
      return;
    }
    const action = actionOrDate;
    if (action === 'TODAY') {
      onDateChange?.(new Date());
      return;
    }
    if (action === 'PREV') {
      if (view === 'month') onDateChange?.(addMonths(date, -1));
      else if (view === 'day') onDateChange?.(addDays(date, -1));
      else onDateChange?.(addWeeks(date, -1));
      return;
    }
    if (action === 'NEXT') {
      if (view === 'month') onDateChange?.(addMonths(date, 1));
      else if (view === 'day') onDateChange?.(addDays(date, 1));
      else onDateChange?.(addWeeks(date, 1));
    }
  };

  const handleView = (nextView) => {
    onViewChange?.(nextView);
  };

  const eventPropGetter = useMemo(
    () =>
      (event) => {
        const shiftType = event.resource?.shiftType || 'morning';
        const backgroundColor = SHIFT_COLORS[shiftType] || SHIFT_COLORS.morning;
        return {
          style: {
            backgroundColor,
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--foreground)',
            padding: '2px 6px',
          },
        };
      },
    []
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <DnDCalendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        defaultView="week"
        views={['month', 'week', 'day']}
        selectable={canEdit}
        resizable={canEdit}
        draggableAccessor={() => canEdit}
        resizableAccessor={() => canEdit}
        onSelectSlot={canEdit ? onSelectSlot : undefined}
        onSelectEvent={onSelectEvent}
        onEventDrop={canEdit ? onEventDrop : undefined}
        onEventResize={canEdit ? onEventResize : undefined}
        onRangeChange={onRangeChange}
        onNavigate={handleNavigate}
        onView={handleView}
        eventPropGetter={eventPropGetter}
        components={{
          event: ShiftEvent,
          toolbar: (props) => (
            <CalendarToolbar
              {...props}
              view={view}
              onView={handleView}
              onNavigate={handleNavigate}
            />
          ),
        }}
        style={{ height: 720 }}
      />
    </div>
  );
}
