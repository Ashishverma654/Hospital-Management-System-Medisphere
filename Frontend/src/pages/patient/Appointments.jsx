import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { appointmentApi } from '../../services/apiServices.js';
import VideoCall from '../../components/VideoCall.jsx';
import { connectSocket } from '../../services/socket.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Video } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

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
  const [searchParams] = useSearchParams();
  const preselectId = searchParams.get('appointmentId');
  const autoJoin = searchParams.get('autoJoin') === '1';
  const user = useSelector((state) => state.auth.user);
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoAppointment, setVideoAppointment] = useState(null);
  const [videoStatus, setVideoStatus] = useState('');
  const [waitingCountdown, setWaitingCountdown] = useState(null);
  const graceMinutes = Number(import.meta.env.VITE_VIDEO_CALL_GRACE_MINUTES ?? import.meta.env.VITE_NO_SHOW_GRACE_MINUTES ?? 5);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentApi.getAll({
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setAppointments(list);
      if (preselectId && list.find((item) => (item._id || item.id) === preselectId)) {
        setSelectedId(preselectId);
      } else if (list.length && !selectedId) {
        setSelectedId(list[0]._id || list[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [filters.endDate, filters.startDate, filters.status, selectedId, preselectId]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 20000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  useEffect(() => {
    const patientId = user?.id || user?._id;
    if (!patientId) return undefined;
    const socket = connectSocket({ patientId });
    const handleUpdate = () => loadAppointments();
    const handleConsultationStarted = (payload) => {
      loadAppointments();
      const appointmentId = payload?.appointmentId;
      const match = appointments.find((item) => (item._id || item.id) === appointmentId);
      if (match?.consultationMode === 'video') {
        toast.success('Doctor has started the video consultation. Tap Join to connect.');
      }
    };

    socket.on('queue:update', handleUpdate);
    socket.on('token:generated', handleUpdate);
    socket.on('consultation:started', handleConsultationStarted);
    socket.on('consultation:completed', handleUpdate);

    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('token:generated', handleUpdate);
      socket.off('consultation:started', handleConsultationStarted);
      socket.off('consultation:completed', handleUpdate);
    };
  }, [appointments, loadAppointments, user?.id, user?._id]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const upcoming = appointments.filter((item) => isUpcoming(item, today));
  const past = appointments.filter((item) => !isUpcoming(item, today));
  const selected = appointments.find((item) => (item._id || item.id) === selectedId);
  const canJoinVideo = selected?.consultationMode === 'video' && ['arrived', 'checked-in', 'inConsultation'].includes(selected?.status);
  const waitingRoomVisible = videoOpen && videoStatus === 'Waiting for participant...';

  useEffect(() => {
    if (!autoJoin || !selected || !canJoinVideo) return;
    setVideoAppointment(selected);
    setVideoOpen(true);
  }, [autoJoin, canJoinVideo, selected]);

  useEffect(() => {
    if (!waitingRoomVisible) {
      setWaitingCountdown(null);
      return undefined;
    }

    setWaitingCountdown(graceMinutes * 60);
    const handle = setInterval(() => {
      setWaitingCountdown((current) => {
        if (current === null) return graceMinutes * 60;
        if (current <= 0) {
          clearInterval(handle);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(handle);
  }, [waitingRoomVisible, graceMinutes]);

  const formatCountdown = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60)
      .toString()
      .padStart(2, '0');
    const secs = (safe % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

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
                  <div className="flex flex-wrap items-center gap-2">
                    {appointment.consultationMode === 'video' && appointment.status === 'inConsultation' && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(appointment._id);
                          setVideoAppointment(appointment);
                          setVideoOpen(true);
                        }}
                        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                      >
                        Join now
                      </button>
                    )}
                    <StatusBadge status={appointment.status}>{appointment.status}</StatusBadge>
                  </div>
                </div>
                {appointment.consultationMode === 'video' && appointment.status === 'inConsultation' && (
                  <p className="mt-2 text-xs font-semibold text-primary">Doctor is waiting.</p>
                )}
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
                  {selected.queuePosition ? (
                    <StatusBadge status="queue">Queue #{selected.queuePosition}</StatusBadge>
                  ) : null}
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
                {selected.tokenNumber ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span>Token</span>
                    <span>{selected.tokenNumber}</span>
                  </div>
                ) : null}
                {selected.estimatedWaitTime != null ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span>Estimated wait</span>
                    <span>{selected.estimatedWaitTime} min</span>
                  </div>
                ) : null}
                {selected.arrivalTime || selected.checkInAt ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span>Arrived</span>
                    <span>{new Date(selected.arrivalTime || selected.checkInAt).toLocaleTimeString()}</span>
                  </div>
                ) : null}
              </article>

              {selected.reasonForVisit && (
                <article className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Reason for visit</p>
                  <p className="mt-2">{selected.reasonForVisit}</p>
                </article>
              )}

              {selected.consultationMode === 'video' && (
                <article className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">Video consultation</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selected.status === 'inConsultation'
                      ? 'Doctor is waiting for you to join.'
                      : 'Join when the doctor starts the consultation.'}
                  </p>
                  <button
                    type="button"
                    disabled={!canJoinVideo}
                    onClick={() => { setVideoAppointment(selected); setVideoOpen(true); }}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <Video className="h-3 w-3" /> Join video call
                  </button>
                  {!canJoinVideo && (
                    <p className="mt-2 text-xs text-muted-foreground">Waiting for arrival or doctor start.</p>
                  )}
                  {waitingRoomVisible && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Doctor has {formatCountdown(waitingCountdown ?? graceMinutes * 60)} before the system auto-marks this appointment as no-show (grace period {graceMinutes} min).
                    </p>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      </div>

      {videoOpen && videoAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Video consultation</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{videoAppointment.doctorId?.userId?.name || 'Doctor'}</h3>
              </div>
              <button type="button" onClick={() => setVideoOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-4 relative">
              {waitingRoomVisible && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/80 p-6 text-center text-sm text-foreground">
                  <p className="text-lg font-semibold">Waiting room</p>
                  <p className="text-xs text-muted-foreground mt-2">Doctor is connecting to the video consultation.</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    This session will be auto-marked no-show in {formatCountdown(waitingCountdown ?? graceMinutes * 60)} if the doctor does not join.
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">You can stay here or cancel the call.</p>
                </div>
              )}
              <VideoCall
                appointmentId={videoAppointment._id}
                role="patient"
                onEnd={() => setVideoOpen(false)}
                onStatusChange={setVideoStatus}
              />
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
