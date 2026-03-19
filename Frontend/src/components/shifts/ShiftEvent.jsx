import { format } from 'date-fns';

export default function ShiftEvent({ event }) {
  const staffName = event.resource?.userId?.name || 'Staff';
  const role = event.resource?.role || '';
  const shiftType = event.resource?.shiftType || '';
  const start = event.start ? format(event.start, 'p') : '';
  const end = event.end ? format(event.end, 'p') : '';
  const tooltip = `${staffName}${role ? ` (${role})` : ''} • ${shiftType} • ${start} - ${end}`;

  return (
    <div className="flex flex-col gap-0.5" title={tooltip}>
      <span className="text-xs font-semibold text-foreground">{staffName}</span>
      <span className="text-[11px] text-muted-foreground">
        {shiftType} • {start} - {end}
      </span>
    </div>
  );
}
