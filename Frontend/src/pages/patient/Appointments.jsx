import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'booked', label: 'Booked' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'checked-in', label: 'Checked-in' },
  { value: 'inConsultation', label: 'In consultation' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const isUpcoming = (appointment, today) => appointment.date >= today && appointment.status !== 'cancelled';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentApi.getAll({
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setAppointments(list);
      if (list.length && !selectedId) {
        setSelectedId(list[0]._id || list[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filters.status, filters.startDate, filters.endDate]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const upcoming = appointments.filter((item) => isUpcoming(item, today));
  const past = appointments.filter((item) => !isUpcoming(item, today));
  const selected = appointments.find((item) => (item._id || item.id) === selectedId);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Appointments</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Appointments and visit history</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Track upcoming appointments, visit status, and doctor details across all departments.
          </p>
        </div>
        <Link
          to="/patient/book-appointment"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Book appointment
        </Link>
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Upcoming</p>
          <div className="mt-4 space-y-3">
            {upcoming.map((appointment) => (
              <button
                key={appointment._id}
                type="button"
                onClick={() => setSelectedId(appointment._id)}
                className={`w-full rounded-xl border p-4 text-left ${selectedId === appointment._id ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.doctorId?.userId?.name || 'Doctor'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.doctorId?.departmentId?.name || 'Department'} • {appointment.date} • {appointment.slot}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status}>{appointment.status}</StatusBadge>
                </div>
              </button>
            ))}
            {upcoming.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <p>No upcoming appointments.</p>
                <Link to="/patient/book-appointment" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
                  Book an appointment
                </Link>
              </div>
            )}
          </div>

          <p className="mt-6 text-sm uppercase tracking-[0.15em] text-muted-foreground">Past</p>
          <div className="mt-4 space-y-3">
            {past.map((appointment) => (
              <button
                key={appointment._id}
                type="button"
                onClick={() => setSelectedId(appointment._id)}
                className={`w-full rounded-xl border p-4 text-left ${selectedId === appointment._id ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.doctorId?.userId?.name || 'Doctor'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.doctorId?.departmentId?.name || 'Department'} • {appointment.date} • {appointment.slot}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status}>{appointment.status}</StatusBadge>
                </div>
              </button>
            ))}
            {past.length === 0 && !loading && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No past appointments.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          {!selected && (
            <div className="py-24 text-center text-muted-foreground">Select an appointment to view details.</div>
          )}
          {selected && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Appointment Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{selected.doctorId?.userId?.name || 'Doctor'}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selected.doctorId?.departmentId?.name || 'Department'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={selected.status}>{selected.status}</StatusBadge>
                  <StatusBadge status={selected.visitType}>{selected.visitType || 'visit'}</StatusBadge>
                </div>
              </div>

              <article className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  <span>{selected.date}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Time</span>
                  <span>{selected.slot}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Consultation mode</span>
                  <span className="capitalize">{selected.consultationMode || 'in-person'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Booking source</span>
                  <span className="capitalize">{selected.bookingSource || 'patient portal'}</span>
                </div>
              </article>

              {selected.reasonForVisit && (
                <article className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Reason for visit</p>
                  <p className="mt-2">{selected.reasonForVisit}</p>
                </article>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.section>
  );
}
