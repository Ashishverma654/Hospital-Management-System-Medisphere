import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { staffDutyApi } from '../services/apiServices.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pad2 = (value) => String(value).padStart(2, '0');

const formatMonthKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const buildDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];

  for (let i = 0; i < firstDay; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    days.push({ day, dateKey });
  }

  return days;
};

const STATUS_STYLES = {
  onDuty: 'border-primary/30 bg-primary/10 text-primary',
  offDuty: 'border-border bg-muted text-muted-foreground',
  leave: 'border-destructive/30 bg-destructive/10 text-destructive',
  holiday: 'border-secondary/40 bg-secondary/20 text-secondary-foreground',
};

const STATUS_LABELS = {
  onDuty: 'On Duty',
  offDuty: 'Off Duty',
  leave: 'Leave',
  holiday: 'Holiday',
};

export default function StaffDutyCalendar() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthKey = useMemo(() => formatMonthKey(monthDate), [monthDate]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await staffDutyApi.getHistory({ month: monthKey });
        setRecords(Array.isArray(data?.data) ? data.data : data || []);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [monthKey]);

  const dutyMap = useMemo(() => {
    const map = new Map();
    (records || []).forEach((record) => {
      if (record?.date) {
        map.set(record.date, record);
      }
    });
    return map;
  }, [records]);

  const summary = useMemo(() => {
    return (records || []).reduce(
      (acc, record) => {
        if (['onDuty', 'offDuty'].includes(record.status)) acc.dutyDays += 1;
        if (record.status === 'leave') acc.leaves += 1;
        if (record.status === 'holiday') acc.holidays += 1;
        acc.totalHours += Number(record.totalHours || 0);
        return acc;
      },
      { dutyDays: 0, leaves: 0, holidays: 0, totalHours: 0 }
    );
  }, [records]);

  const days = useMemo(() => buildDays(monthDate), [monthDate]);

  const changeMonth = (delta) => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const resetMonth = () => setMonthDate(new Date());

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Duty Calendar</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">Monthly duty overview</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={resetMonth}>
            This month
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Duty Days</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{summary.dutyDays}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Leaves</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{summary.leaves}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Holidays</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{summary.holidays}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Hours Logged</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{summary.totalHours.toFixed(1)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-xs font-semibold text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="text-center">{label}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-20 rounded-xl border border-dashed border-border/40" />;
          }

          const record = dutyMap.get(day.dateKey);
          const status = record?.status || 'offDuty';
          const badgeClass = STATUS_STYLES[status] || STATUS_STYLES.offDuty;
          const label = STATUS_LABELS[status] || 'Off Duty';
          const title = record
            ? `${label} • ${record.shiftType || 'Shift'} • ${Number(record.totalHours || 0).toFixed(1)} hrs`
            : label;

          return (
            <div
              key={day.dateKey}
              className="flex h-20 flex-col justify-between rounded-xl border border-border bg-card p-2"
              title={title}
            >
              <span className="text-sm font-semibold text-foreground">{day.day}</span>
              <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] ${badgeClass}`}>
                {loading ? '...' : label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">On Duty</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-muted-foreground">Off Duty</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-destructive">Leave</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/20 px-3 py-1 text-secondary-foreground">Holiday</span>
      </div>
    </section>
  );
}
