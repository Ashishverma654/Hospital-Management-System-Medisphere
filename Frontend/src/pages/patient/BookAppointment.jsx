import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, availabilityApi, doctorApi, getDepartments, slotApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { RefreshCw, Info, Sunrise, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';

const initialForm = {
  departmentId: '',
  doctorId: '',
  date: '',
  slot: '',
  hospitalLocationId: '',
  visitType: 'newConsultation',
  consultationMode: 'in-person',
  reasonForVisit: '',
};

const buildWeekDates = (baseDate) => {
  const ref = baseDate ? new Date(baseDate) : new Date();
  const day = ref.getDay(); // 0 Sunday
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diff);
  return Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);
    return date.toISOString().split('T')[0];
  });
};

  const toMinutes = (value = '00:00') => {
    const [h, m] = value.split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  };

export default function PatientBookAppointment() {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true); // eslint-disable-line no-unused-vars
  const [slotLoading, setSlotLoading] = useState(false);
  const [saving, setSaving] = useState(false); // eslint-disable-line no-unused-vars
  const [refreshKey, setRefreshKey] = useState(0); // eslint-disable-line no-unused-vars
  const [dateMode, setDateMode] = useState('quick');
  const [customDate, setCustomDate] = useState('');

  const normalizeSlot = (slot) => {
    if (!slot) return '';
    const [h = '0', m = '0'] = slot.split(':');
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  const [timeFrom, setTimeFrom] = useState(''); // eslint-disable-line no-unused-vars
  const [timeTo, setTimeTo] = useState(''); // eslint-disable-line no-unused-vars
  const [weekStart, setWeekStart] = useState(() => buildWeekDates()[0]);
  const weekDates = useMemo(() => buildWeekDates(weekStart), [weekStart]);
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isPastSlotForDate = useCallback(
    (date, slot) => {
      if (!date || !slot) return false;
      if (date !== todayKey) return false;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const slotMinutes = toMinutes(slot);
      return slotMinutes <= nowMinutes;
    },
    [todayKey]
  );
    if (!date || !slot) return false;
    if (date !== todayKey) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = toMinutes(slot);
    return slotMinutes <= nowMinutes;
  };
  const visibleWeekDates = useMemo(
    () => weekDates.filter((date) => date >= todayKey),
    [weekDates, todayKey]
  );
  const [availability, setAvailability] = useState([]);
  const [slotStatsByDate, setSlotStatsByDate] = useState(new Map());
  const [autoPicked, setAutoPicked] = useState(false);
  const navigate = useNavigate();
  const slotsContainerRef = useRef(null);

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => `${doc._id || doc.id}` === `${form.doctorId}`),
    [doctors, form.doctorId]
  );
  const requiresLocation =
    form.consultationMode === 'in-person' &&
    selectedDoctor?.hospitalLocations?.length > 0 &&
    !form.hospitalLocationId;

  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const deptData = await getDepartments();
        setDepartments(Array.isArray(deptData) ? deptData : []);
      } finally {
        setLoading(false);
      }
    };
    loadMasters();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await doctorApi.getBookingList({
          departmentId: form.departmentId || undefined,
        });
        setDoctors(Array.isArray(response) ? response : []);
      } catch {
        setDoctors([]);
      }
    };
    loadDoctors();
  }, [form.departmentId]);

  useEffect(() => {
    setAutoPicked(false);
  }, [form.doctorId]);

  useEffect(() => {
    if (form.date && form.date < todayKey) {
      setForm((current) => ({ ...current, date: todayKey, slot: '' }));
    }
  }, [form.date, todayKey]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!form.doctorId) {
        setAvailability([]);
        return;
      }
      try {
        const data = await availabilityApi.getByDoctor(form.doctorId);
        setAvailability(Array.isArray(data) ? data : []);
      } catch {
        setAvailability([]);
      }
    };
    loadAvailability();
  }, [form.doctorId]);

  useEffect(() => {
    const loadWeekSlots = async () => {
      if (!form.doctorId || requiresLocation) {
        setSlotStatsByDate(new Map());
        return;
      }
      try {
        const results = await Promise.all(
          weekDates.map(async (date) => {
            try {
              const response = await slotApi.getByDoctor(form.doctorId, date);
              const all = response?.allSlots || response?.availableSlots || [];
              const booked = response?.bookedSlots || [];
              const available = all.filter((slot) => !booked.includes(slot));
              return [date, { total: all.length, available: available.length }];
            } catch {
              return [date, { total: 0, available: 0 }];
            }
          })
        );
        setSlotStatsByDate(new Map(results));
      } catch {
        setSlotStatsByDate(new Map());
      }
    };
    loadWeekSlots();
  }, [form.doctorId, weekDates, requiresLocation]);

  useEffect(() => {
    if (autoPicked || !form.doctorId || requiresLocation) return;
    const firstAvailable = visibleWeekDates.find((date) => (slotStatsByDate.get(date)?.available ?? 0) > 0);
    if (firstAvailable) {
      setForm((current) => ({ ...current, date: firstAvailable, slot: '' }));
      setAutoPicked(true);
      setTimeout(() => slotsContainerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 120);
    }
  }, [autoPicked, form.doctorId, slotStatsByDate, visibleWeekDates, requiresLocation]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!form.doctorId || !form.date || requiresLocation) {
        setAvailableSlots([]);
        setAllSlots([]);
        setBookedSlots([]);
        return;
      }
      setTimeFrom('');
      setTimeTo('');
      setSlotLoading(true);
      try {
        const response = await slotApi.getByDoctor(form.doctorId, form.date);
        const rawAll = response?.allSlots || response?.availableSlots || [];
        const rawBooked = response?.bookedSlots || [];
        const normalizedAll = rawAll.map(normalizeSlot);
        const normalizedBooked = rawBooked.map(normalizeSlot);
        const normalizedAvailable = normalizedAll.filter((slot) => !normalizedBooked.includes(slot));

        setAvailableSlots(normalizedAvailable);
        setAllSlots(normalizedAll);
        setBookedSlots(normalizedBooked);
      } catch {
        setAvailableSlots([]);
        setAllSlots([]);
        setBookedSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };
    loadSlots();
  }, [form.doctorId, form.date, refreshKey, requiresLocation]);

  const resolveFee = () => {
    if (!selectedDoctor) return 0;
    let feeVal = Number(selectedDoctor.consultationFee ?? 0);
    if (form.consultationMode === 'video' && selectedDoctor.consultationFeeVideo != null) {
      feeVal = selectedDoctor.consultationFeeVideo;
    }
    if (form.consultationMode === 'phone' && selectedDoctor.consultationFeePhone != null) {
      feeVal = selectedDoctor.consultationFeePhone;
    }
    if (form.consultationMode === 'in-person' && form.hospitalLocationId) {
      const match = (selectedDoctor.locationFees || []).find(
        (item) =>
          `${item.locationId}` === `${form.hospitalLocationId}` ||
          `${item.locationId?._id}` === `${form.hospitalLocationId}` ||
          `${item.locationId?.id}` === `${form.hospitalLocationId}`
      );
      if (match?.fee != null) feeVal = Number(match.fee) || 0;
    }
    return Number.isFinite(feeVal) ? feeVal : 0;
  };

  const fee = useMemo(() => resolveFee(), [selectedDoctor, form.consultationMode, form.hospitalLocationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const slotsToShow = // eslint-disable-line react-hooks/exhaustive-deps
    form.consultationMode === 'in-person' &&
    selectedDoctor?.hospitalLocations?.length > 0 &&
    !form.hospitalLocationId
      ? []
      : (allSlots.length ? allSlots : availableSlots);

  const filteredSlots = useMemo(() => slotsToShow, [slotsToShow]);

  const dayRanges = useMemo(() => {
    if (!form.date) return [];
    const dayLabel = new Date(`${form.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    return availability
      .filter((item) => item.dayOfWeek === dayLabel)
      .map((item) => `${item.startTime} - ${item.endTime}`);
  }, [availability, form.date]);

  const bookedSlotSet = useMemo(() => new Set((bookedSlots || []).map(normalizeSlot)), [bookedSlots]);

  const nextAvailableSlot = useMemo(
    () =>
      filteredSlots.find(
        (slot) => !bookedSlotSet.has(normalizeSlot(slot)) && !isPastSlotForDate(form.date, normalizeSlot(slot))
      ),
    [filteredSlots, bookedSlotSet, form.date, isPastSlotForDate]
  );

  const slotCountsByDate = useMemo(() => {
    const map = new Map();
    if (!availability.length) return map;
    visibleWeekDates.forEach((date) => {
      const dayLabel = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
      const ranges = availability.filter((item) => item.dayOfWeek === dayLabel);
      const total = ranges.reduce((sum, range) => sum + Math.floor((toMinutes(range.endTime) - toMinutes(range.startTime)) / (range.slotDuration || 15)), 0);
      map.set(date, total);
    });
    return map;
  }, [availability, visibleWeekDates]);

  const dayRangesByDate = useMemo(() => {
    const map = new Map();
    if (!availability.length) return map;
    visibleWeekDates.forEach((date) => {
      const dayLabel = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
      const ranges = availability
        .filter((item) => item.dayOfWeek === dayLabel)
        .map((item) => `${item.startTime} - ${item.endTime}`);
      map.set(date, ranges);
    });
    return map;
  }, [availability, visibleWeekDates]);


  const handleBook = async (event) => {
    event.preventDefault();
    if (!form.doctorId || !form.date || !form.slot) {
      toast.error('Choose a doctor, date, and slot.');
      return;
    }
    setSaving(true);
    try {
      await appointmentApi.book({
        doctorId: form.doctorId,
        date: form.date,
        slot: form.slot,
        visitType: form.visitType,
        consultationMode: form.consultationMode,
        reasonForVisit: form.reasonForVisit,
        hospitalLocationId: form.consultationMode === 'in-person' ? form.hospitalLocationId || undefined : undefined,
      });
      toast.success('Appointment booked successfully.');
      setForm({ ...initialForm, departmentId: form.departmentId, doctorId: form.doctorId });
      setAvailableSlots([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Appointments</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Book a new appointment</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Select a department, doctor, and available slot to confirm a new visit.
        </p>
      </div>

      <form onSubmit={handleBook} className="rounded-2xl bg-card p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Department">
            <select
              value={form.departmentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  departmentId: event.target.value,
                  doctorId: '',
                  slot: '',
                  hospitalLocationId: '',
                }))
              }
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Doctor">
            <select
              value={form.doctorId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  doctorId: event.target.value,
                  slot: '',
                  hospitalLocationId: '',
                }))
              }
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((doctor) => {
                const doctorKey = doctor._id || doctor.id;
                return (
                <option key={doctorKey} value={doctorKey}>
                  {doctor.userId?.name || 'Doctor'} • {doctor.departmentId?.name || 'Department'}
                </option>
                );
              })}
            </select>
          </Field>
          <Field label="Appointment date">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(weekStart);
                  prev.setDate(prev.getDate() - 7);
                  setWeekStart(prev.toISOString().split('T')[0]);
                }}
                disabled={requiresLocation || weekStart <= todayKey}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Previous week
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new Date(weekStart);
                  next.setDate(next.getDate() + 7);
                  setWeekStart(next.toISOString().split('T')[0]);
                }}
                disabled={requiresLocation}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Next week
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleWeekDates.map((date) => {
                const slotCount = slotStatsByDate.get(date)?.available ?? slotCountsByDate.get(date) ?? 0;
                const ranges = dayRangesByDate.get(date) || [];
                const isDisabled = slotCount === 0;
                const tone =
                  slotCount === 0
                    ? 'bg-muted text-muted-foreground border-border'
                    : slotCount < 5
                      ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setDateMode('quick');
                      setCustomDate('');
                      setForm((current) => ({ ...current, date, slot: '' }));
                      setTimeout(() => slotsContainerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 120);
                    }}
                    disabled={isDisabled || requiresLocation}
                    title={ranges.length ? ranges.join(' | ') : 'No availability'}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      form.date === date && dateMode === 'quick'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-foreground hover:bg-muted'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${tone}`}>
                      {slotCount}
                    </span>
                    {ranges.length > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        {ranges[0]}{ranges.length > 1 ? ` +${ranges.length - 1}` : ''}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDateMode('custom')}
                disabled={requiresLocation}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  dateMode === 'custom'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                Custom date
              </button>
            </div>
            {dateMode === 'custom' && (
              <div className="mt-3">
                <input
                  type="date"
                  value={customDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCustomDate(value);
                    if (value) {
                      setForm((current) => ({ ...current, date: value, slot: '' }));
                      setTimeout(() => slotsContainerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 120);
                    }
                  }}
                  min={todayKey}
                  disabled={requiresLocation}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                />
              </div>
            )}
            {requiresLocation && (
              <p className="mt-2 text-sm text-muted-foreground">
                Select a hospital location before choosing the appointment date.
              </p>
            )}
            {dayRanges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dayRanges.map((range) => (
                  <span key={range} className="doccure-chip">{range}</span>
                ))}
              </div>
            )}
          </Field>
          <Field label="Visit type">
            <select
              value={form.visitType}
              onChange={(event) => setForm((current) => ({ ...current, visitType: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            >
              <option value="newConsultation">New consultation</option>
              <option value="followUp">Follow-up</option>
            </select>
          </Field>
          <Field label="Consultation mode">
            <Tabs
              value={form.consultationMode}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  consultationMode: value,
                  hospitalLocationId: '',
                }))
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="in-person" className="flex-1">In-Hospital</TabsTrigger>
                <TabsTrigger value="video" className="flex-1">Video</TabsTrigger>
              </TabsList>
            </Tabs>
          </Field>
        </div>

        {form.consultationMode === 'in-person' && selectedDoctor?.hospitalLocations?.length > 0 && (
          <Field label="Hospital location">
            <select
              value={form.hospitalLocationId}
              onChange={(event) => setForm((current) => ({ ...current, hospitalLocationId: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            >
              <option value="">Select location</option>
              {selectedDoctor.hospitalLocations.map((loc) => {
                const locId = loc._id || loc.id;
                return (
                <option key={locId} value={locId}>
                  {loc.name}{loc.city ? ` • ${loc.city}` : ''}
                </option>
                );
              })}
            </select>
          </Field>
        )}

        <Field label="Available slots">
          <div ref={slotsContainerRef} />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => nextAvailableSlot && setForm((current) => ({ ...current, slot: nextAvailableSlot }))}
              disabled={!nextAvailableSlot}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {nextAvailableSlot ? `Next available: ${nextAvailableSlot}` : 'No available slots'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {slotLoading && <span className="text-sm text-muted-foreground">Loading slots...</span>}
            {!slotLoading &&
              form.consultationMode === 'in-person' &&
              selectedDoctor?.hospitalLocations?.length > 0 &&
              !form.hospitalLocationId && (
                <span className="text-sm text-muted-foreground">Select a hospital location to view slots.</span>
              )}
            {!slotLoading && (
              <>
                <div className="w-full space-y-4">
                  {groupSlots(filteredSlots).map((group) => (
                    <div key={group.label} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {group.icon}
                        <span>{group.label}</span>
                        <span className="text-xs text-muted-foreground">({group.slots.length} slots)</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {group.slots.map((slot) => {
                          const normalized = normalizeSlot(slot);
                          const isBooked = bookedSlotSet.has(normalized);
                          const isPastSlot = isPastSlotForDate(form.date, normalized);
                          const isSelected = normalizeSlot(form.slot) === normalized;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isBooked || isPastSlot}
                              onClick={() => setForm((current) => ({ ...current, slot: normalizeSlot(slot) }))}
                              className={`min-w-[120px] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                isBooked || isPastSlot
                                  ? 'border-red-500/40 bg-red-500/10 text-red-500 cursor-not-allowed'
                                  : isSelected
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {formatSlot(slot)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {form.doctorId &&
                  filteredSlots.length === 0 &&
                  !(form.consultationMode === 'in-person' &&
                    selectedDoctor?.hospitalLocations?.length > 0 &&
                    !form.hospitalLocationId) && (
                  <span className="text-sm text-muted-foreground">No slots found for the selected date/time.</span>
                )}
              </>
            )}
          </div>
        </Field>

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Estimated consultation fee: <span className="font-semibold text-foreground">₹{Number(fee).toLocaleString()}</span>
        </div>

        <Field label="Reason for visit">
          <textarea
            value={form.reasonForVisit}
            onChange={(event) => setForm((current) => ({ ...current, reasonForVisit: event.target.value }))}
            className="min-h-[120px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm(initialForm)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
          <button
            type="button"
            disabled={!form.slot}
            onClick={() => {
              const previewData = {
                doctor: selectedDoctor,
                form,
                fee,
              };
              navigate('/patient/booking-preview', { state: previewData });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            Preview & Pay
          </button>
        </div>
      </form>

    </motion.section>
  );
}

function formatSlot(slot) {
  if (!slot) return '';
  const [h, m] = slot.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function groupSlots(slots) {
  const groups = [
    { label: 'Morning | Till 12 PM', icon: <Sunrise className="h-4 w-4 text-amber-500" />, slots: [] },
    { label: 'Afternoon | 12 PM - 4 PM', icon: <Sun className="h-4 w-4 text-orange-500" />, slots: [] },
    { label: 'Evening | After 4 PM', icon: <Moon className="h-4 w-4 text-indigo-500" />, slots: [] },
  ];
  slots.forEach((slot) => {
    const [h] = slot.split(':').map(Number);
    if (h < 12) groups[0].slots.push(slot);
    else if (h < 16) groups[1].slots.push(slot);
    else groups[2].slots.push(slot);
  });
  return groups.filter((group) => group.slots.length > 0);
}

function Field({ label, children }) {
  return (
    <label className="block text-sm text-muted-foreground">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
