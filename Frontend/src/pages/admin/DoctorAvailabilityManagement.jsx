import { useEffect, useMemo, useState } from 'react';
import { availabilityApi, doctorApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Calendar, Trash2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const toMinutes = (value = '00:00') => {
  if (!value) return 0;
  const trimmed = `${value}`.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem) {
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const countSlots = (start, end, duration) => {
  if (!duration || duration <= 0) return 0;
  const diff = toMinutes(end) - toMinutes(start);
  if (diff <= 0) return 0;
  return Math.floor(diff / duration);
};

const initialForm = {
  startTime: '09:00',
  endTime: '13:00',
  slotDuration: 15,
};

export default function DoctorAvailabilityManagement() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availabilities, setAvailabilities] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedDays, setSelectedDays] = useState(['Monday']);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breakEnabled, setBreakEnabled] = useState(false);
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await doctorApi.getAdminAll({ isActive: true });
        setDoctors(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length && !selectedDoctorId) {
          setSelectedDoctorId(data[0].id || data[0]._id);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load doctors.');
      }
    };
    loadDoctors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedDoctorId) {
        setAvailabilities([]);
        return;
      }
      try {
        const data = await availabilityApi.getByDoctor(selectedDoctorId);
        setAvailabilities(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load availability.');
        setAvailabilities([]);
      }
    };
    loadAvailability();
  }, [selectedDoctorId]);

  const grouped = useMemo(() => {
    const map = new Map();
    availabilities.forEach((item) => {
      const list = map.get(item.dayOfWeek) || [];
      list.push(item);
      map.set(item.dayOfWeek, list);
    });
    // sort ranges per day
    map.forEach((list, key) => {
      list.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      map.set(key, list);
    });
    return map;
  }, [availabilities]);

  const daySummaries = useMemo(() => {
    const summaries = new Map();
    DAYS_OF_WEEK.forEach((day) => {
      const ranges = grouped.get(day) || [];
      let totalSlots = 0;
      const breaks = [];
      let overlap = false;
      ranges.forEach((range, idx) => {
        totalSlots += countSlots(range.startTime, range.endTime, range.slotDuration);
        const currentEnd = toMinutes(range.endTime);
        const next = ranges[idx + 1];
        if (next) {
          const nextStart = toMinutes(next.startTime);
          if (nextStart < currentEnd) {
            overlap = true;
          }
          if (nextStart > currentEnd) {
            breaks.push({ start: currentEnd, end: nextStart });
          }
        }
      });
      summaries.set(day, { totalSlots, breaks, overlap });
    });
    return summaries;
  }, [grouped]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Select a doctor to manage availability.');
      return;
    }
    if (selectedDays.length === 0) {
      toast.error('Select at least one day.');
      return;
    }
    const startMinutes = toMinutes(form.startTime);
    const endMinutes = toMinutes(form.endTime);
    const breakStartMinutes = toMinutes(breakStart);
    const breakEndMinutes = toMinutes(breakEnd);

    if (breakEnabled) {
      if (!(breakStartMinutes > startMinutes && breakEndMinutes < endMinutes && breakStartMinutes < breakEndMinutes)) {
        toast.error('Break time must fall within the availability range.');
        return;
      }
    }

    setLoading(true);
    try {
      const daysToSave = selectedDays;
      if (editingId) {
        await availabilityApi.remove(editingId);
      }
      const payloads = breakEnabled
        ? [
            { ...form, endTime: breakStart },
            { ...form, startTime: breakEnd },
          ]
        : [form];

      for (const day of daysToSave) {
        for (const payload of payloads) {
          await availabilityApi.create({
            ...payload,
            dayOfWeek: day,
            doctorId: selectedDoctorId,
          });
        }
      }
      toast.success(
        editingId
          ? breakEnabled
            ? 'Availability updated with break.'
            : 'Availability updated.'
          : breakEnabled
            ? 'Availability split with break.'
            : 'Availability added.'
      );
      setForm(initialForm);
      setSelectedDays(['Monday']);
      setEditingId(null);
      setBreakEnabled(false);
      const data = await availabilityApi.getByDoctor(selectedDoctorId);
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      startTime: item.startTime,
      endTime: item.endTime,
      slotDuration: item.slotDuration,
    });
    setSelectedDays([item.dayOfWeek]);
    setBreakEnabled(false);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      await availabilityApi.remove(id);
      toast.success('Availability deleted.');
      const data = await availabilityApi.getByDoctor(selectedDoctorId);
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete availability.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Doctor Availability</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Manage schedules and slot windows</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Configure weekly availability ranges for each doctor. Multiple ranges per day are supported. Existing appointments will remain intact.
        </p>
      </div>

      <Card className="border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Select doctor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            >
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id || doctor._id} value={doctor.id || doctor._id}>
                  {doctor.userId?.name || 'Doctor'} • {doctor.departmentId?.name || 'Department'}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit availability' : 'Add availability range'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedDays((current) =>
                          active ? current.filter((item) => item !== day) : [...current, day]
                        );
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background/60 text-foreground hover:border-primary'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Start time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">End time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Slot duration (min)</label>
              <input
                type="number"
                min="5"
                value={form.slotDuration}
                onChange={(event) => setForm((current) => ({ ...current, slotDuration: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                required
              />
            </div>
            <div className="md:col-span-4 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Lunch / Rest break</p>
                  <p className="text-xs text-muted-foreground">Split the range to exclude a break window.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={breakEnabled}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setBreakEnabled(checked);
                      if (checked) {
                        const startMinutes = toMinutes(form.startTime);
                        const endMinutes = toMinutes(form.endTime);
                        const mid = Math.floor((startMinutes + endMinutes) / 2);
                        const nextHour = Math.min(mid + 60, endMinutes - 15);
                        setBreakStart(formatTime(mid));
                        setBreakEnd(formatTime(nextHour));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Add break
                </label>
              </div>
              {breakEnabled && (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Break start</label>
                    <input
                      type="time"
                      value={breakStart}
                      onChange={(event) => setBreakStart(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Break end</label>
                    <input
                      type="time"
                      value={breakEnd}
                      onChange={(event) => setBreakEnd(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-4 flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || !selectedDoctorId}>
                <Calendar className="mr-2 h-4 w-4" />
                {editingId ? 'Update range' : 'Add range'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {DAYS_OF_WEEK.map((day) => (
          <Card key={day} className="border-border rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{day}</CardTitle>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {daySummaries.get(day)?.totalSlots || 0} slots
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(grouped.get(day) || []).map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.startTime} - {item.endTime}</p>
                    <p className="text-xs text-muted-foreground">Slot: {item.slotDuration} mins</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(daySummaries.get(day)?.breaks || []).length > 0 && (
                <div className="rounded-xl border border-dashed border-border px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Breaks</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {daySummaries.get(day).breaks.map((brk) => (
                      <span
                        key={`${day}-${brk.start}-${brk.end}`}
                        className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600"
                      >
                        {formatTime(brk.start)} - {formatTime(brk.end)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {daySummaries.get(day)?.overlap && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
                  Overlapping ranges detected — please adjust timings.
                </div>
              )}
              {(grouped.get(day) || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No availability set.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
