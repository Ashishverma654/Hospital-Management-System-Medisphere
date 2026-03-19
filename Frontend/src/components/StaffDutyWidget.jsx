import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { staffDutyApi } from '../services/apiServices.js';
import { toast } from 'sonner';

const STATUS_LABELS = {
  notStarted: 'Not started',
  onDuty: 'On Duty',
  offDuty: 'Off Duty',
  leave: 'On Leave',
  holiday: 'Holiday',
};

const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

export default function StaffDutyWidget() {
  const role = useSelector((state) => state.auth.user?.role);
  const canSelectShift = ['superadmin', 'admin', 'subadmin'].includes(role);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shiftType, setShiftType] = useState('');

  const currentStatus = stats?.currentStatus || 'notStarted';
  const currentDuty = stats?.currentDuty || null;

  const canStart = currentStatus === 'notStarted';
  const canEnd = currentStatus === 'onDuty';
  const canMarkLeave = currentStatus === 'notStarted';

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await staffDutyApi.getStats();
      setStats(data?.data || data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load duty stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const startDuty = async () => {
    try {
      await staffDutyApi.start({ shiftType: canSelectShift ? shiftType || undefined : undefined });
      toast.success('Duty started.');
      await loadStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to start duty.');
    }
  };

  const endDuty = async () => {
    try {
      await staffDutyApi.end();
      toast.success('Duty ended.');
      await loadStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to end duty.');
    }
  };

  const markLeave = async (type) => {
    try {
      await staffDutyApi.markLeave({ type, shiftType: canSelectShift ? shiftType || undefined : undefined });
      toast.success(type === 'leave' ? 'Leave marked.' : 'Holiday marked.');
      await loadStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to mark leave/holiday.');
    }
  };

  const formattedStart = useMemo(() => {
    if (!currentDuty?.startTime) return null;
    return new Date(currentDuty.startTime).toLocaleString();
  }, [currentDuty?.startTime]);

  const formattedEnd = useMemo(() => {
    if (!currentDuty?.endTime) return null;
    return new Date(currentDuty.endTime).toLocaleString();
  }, [currentDuty?.endTime]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-xl text-foreground">Duty Status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your shift attendance and leave status.
          </p>
        </div>
        {canSelectShift && (
          <div className="w-full md:w-48">
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Shift type" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Current</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {STATUS_LABELS[currentStatus] || 'Not started'}
            </p>
            {formattedStart && (
              <p className="text-xs text-muted-foreground">Start: {formattedStart}</p>
            )}
            {formattedEnd && (
              <p className="text-xs text-muted-foreground">End: {formattedEnd}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={startDuty} disabled={!canStart || loading}>
              Start Duty
            </Button>
            <Button variant="outline" onClick={endDuty} disabled={!canEnd || loading}>
              End Duty
            </Button>
            <Button variant="outline" onClick={() => markLeave('leave')} disabled={!canMarkLeave || loading}>
              Mark Leave
            </Button>
            <Button variant="outline" onClick={() => markLeave('holiday')} disabled={!canMarkLeave || loading}>
              Mark Holiday
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Working days</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {stats?.totalWorkingDays ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leaves</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {stats?.totalLeaves ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hours worked</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {stats?.totalHours ?? 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
