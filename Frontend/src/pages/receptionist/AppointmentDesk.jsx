import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { appointmentApi, billingApi, receptionistApi, slotApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Calendar, RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialBooking = {
  patientId: '',
  doctorId: '',
  departmentId: '',
  specializationId: '',
  date: new Date().toISOString().split('T')[0],
  slot: '',
  visitType: 'newConsultation',
  consultationMode: 'in-person',
  reasonForVisit: '',
};

export default function AppointmentDesk() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';
  const [patients, setPatients] = useState([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [booking, setBooking] = useState({ ...initialBooking, patientId: preselectedPatientId });
  const [options, setOptions] = useState({ departments: [], specializations: [], doctors: [] });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueSummary, setQueueSummary] = useState(null);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [queueDate, setQueueDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', slot: '' });

  const loadPatients = async (query = '') => {
    try {
      const response = await receptionistApi.searchPatients(query);
      setPatients(response.patients || []);
    } catch {
      setPatients([]);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await receptionistApi.getBookingOptions({
        departmentId: booking.departmentId || undefined,
        specializationId: booking.specializationId || undefined,
      });
      setOptions(response);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load booking options.');
    }
  };

  const loadQueue = async () => {
    try {
      const response = await appointmentApi.getQueueToday({
        date: queueDate,
        doctorId: filterDoctor || undefined,
        status: filterStatus || undefined,
      });
      setQueue(response.appointments || []);
      setQueueSummary(response.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load today queue.');
    }
  };

  useEffect(() => {
    loadPatients(preselectedPatientId || patientQuery);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (preselectedPatientId && !patientQuery.trim()) {
        return;
      }
      loadPatients(patientQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [patientQuery, preselectedPatientId]);

  useEffect(() => {
    loadOptions();
  }, [booking.departmentId, booking.specializationId]);

  useEffect(() => {
    loadQueue();
  }, [queueDate, filterDoctor, filterStatus]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!booking.doctorId || !booking.date) {
        setAvailableSlots([]);
        return;
      }

      try {
        const response = await slotApi.getByDoctor(booking.doctorId, booking.date);
        setAvailableSlots(response.availableSlots || []);
      } catch {
        setAvailableSlots([]);
      }
    };

    loadSlots();
  }, [booking.doctorId, booking.date]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === booking.patientId),
    [patients, booking.patientId]
  );

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await appointmentApi.book(booking);
      toast.success('Appointment booked successfully.');
      setBooking({ ...initialBooking, patientId: booking.patientId, date: booking.date });
      setAvailableSlots([]);
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  const handleArrive = async (appointmentId) => {
    try {
      await appointmentApi.arrive(appointmentId);
      toast.success('Patient marked as arrived.');
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update appointment.');
    }
  };

  const handleCancel = async (appointmentId) => {
    const reason = window.prompt('Cancellation reason (optional):', '');
    try {
      await appointmentApi.cancel(appointmentId, { reason });
      toast.success('Appointment cancelled.');
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  const openReschedule = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleForm({ date: appointment.date, slot: appointment.slot });
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    try {
      await appointmentApi.reschedule(rescheduleTarget._id, rescheduleForm);
      toast.success('Appointment rescheduled.');
      setRescheduleTarget(null);
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment.');
    }
  };

  const handleInitiateBilling = async (appointmentId) => {
    try {
      await billingApi.initiateForAppointment(appointmentId);
      toast.success('Consultation billing initiated.');
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to initiate billing.');
    }
  };

  const queueDoctors = useMemo(() => {
    const seen = new Map();
    queue.forEach((appointment) => {
      if (appointment.doctorId?._id && !seen.has(appointment.doctorId._id)) {
        seen.set(appointment.doctorId._id, appointment.doctorId.userId?.name || 'Doctor');
      }
    });
    return Array.from(seen.entries());
  }, [queue]);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Reception Desk</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Appointment Desk</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Search existing patients, book new consultations or walk-ins, monitor today&apos;s queue, mark arrivals, reschedule visits, and initiate billing when needed.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <form onSubmit={handleBookAppointment} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Book Appointment</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Patient-first booking flow</h3>
            </div>
            <Button type="button" variant="outline" onClick={loadOptions}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={patientQuery}
                onChange={(event) => setPatientQuery(event.target.value)}
                placeholder="Search patient by name, patient ID, phone, or email"
                className="w-full rounded-2xl border border-border py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <Field label="Patient">
              <select value={booking.patientId} onChange={(event) => setBooking((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name} • {patient.patientId}</option>
                ))}
              </select>
            </Field>

            {selectedPatient && (
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="font-semibold text-foreground">{selectedPatient.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedPatient.patientId} • {selectedPatient.phone} • {selectedPatient.email}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Department">
                <select value={booking.departmentId} onChange={(event) => setBooking((current) => ({ ...current, departmentId: event.target.value, specializationId: '', doctorId: '', slot: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select department</option>
                  {(options.departments || []).map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Specialization">
                <select value={booking.specializationId} onChange={(event) => setBooking((current) => ({ ...current, specializationId: event.target.value, doctorId: '', slot: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select specialization</option>
                  {(options.specializations || []).map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Doctor">
                <select value={booking.doctorId} onChange={(event) => setBooking((current) => ({ ...current, doctorId: event.target.value, slot: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select doctor</option>
                  {(options.doctors || []).map((item) => (
                    <option key={item._id} value={item._id}>{item.userId?.name} • {item.departmentId?.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" value={booking.date} onChange={(event) => setBooking((current) => ({ ...current, date: event.target.value, slot: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
              </Field>
              <Field label="Visit Type">
                <select value={booking.visitType} onChange={(event) => setBooking((current) => ({ ...current, visitType: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="newConsultation">New Consultation</option>
                  <option value="followUp">Follow-up</option>
                  <option value="walkIn">Walk-in</option>
                </select>
              </Field>
              <Field label="Consultation Mode">
                <select value={booking.consultationMode} onChange={(event) => setBooking((current) => ({ ...current, consultationMode: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="in-person">In-Person</option>
                  <option value="video">Video</option>
                  <option value="phone">Phone</option>
                </select>
              </Field>
            </div>

            <Field label="Reason for Visit">
              <textarea value={booking.reasonForVisit} onChange={(event) => setBooking((current) => ({ ...current, reasonForVisit: event.target.value }))} className="min-h-[100px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
            </Field>

            <Field label="Available Slots">
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBooking((current) => ({ ...current, slot }))}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      booking.slot === slot
                        ? 'bg-slate-900 text-white'
                        : 'border border-border bg-card text-foreground'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
                {booking.doctorId && availableSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground">No available slots for the selected date.</p>
                )}
              </div>
            </Field>

            <Button type="submit" disabled={saving}>
              {saving ? 'Booking...' : booking.visitType === 'walkIn' ? 'Create Walk-In' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Today&apos;s Queue</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Check-in and queue management</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <input type="date" value={queueDate} onChange={(event) => setQueueDate(event.target.value)} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <select value={filterDoctor} onChange={(event) => setFilterDoctor(event.target.value)} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
                <option value="">All doctors</option>
                {queueDoctors.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
                <option value="">All statuses</option>
                <option value="booked">Booked</option>
                <option value="arrived">Arrived</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ['Total', queueSummary?.total ?? 0],
              ['Booked', queueSummary?.booked ?? 0],
              ['Arrived', queueSummary?.arrived ?? 0],
              ['Cancelled', queueSummary?.cancelled ?? 0],
            ].map(([label, value]) => (
              <article key={label} className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {queue.map((appointment) => (
              <article key={appointment._id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.patientId?.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.patientId?.patientId} • {appointment.doctorId?.userId?.name || 'Doctor'} • {appointment.slot}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{appointment.visitType}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                      {appointment.status}
                    </span>
                    {appointment.status === 'booked' && (
                      <Button size="sm" onClick={() => handleArrive(appointment._id)}>Mark Arrived</Button>
                    )}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openReschedule(appointment)}>Reschedule</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(appointment._id)}>Cancel</Button>
                      </>
                    )}
                    {['arrived', 'waiting', 'inConsultation', 'completed'].includes(appointment.status) && (
                      <Button size="sm" variant="outline" onClick={() => handleInitiateBilling(appointment._id)}>Initiate Bill</Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {queue.length === 0 && <p className="text-sm text-muted-foreground">No appointments found for the selected filters.</p>}
          </div>
        </article>
      </div>

      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleReschedule} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Reschedule Appointment</h3>
              <button type="button" onClick={() => setRescheduleTarget(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-5 grid gap-4">
              <Field label="New date">
                <input type="date" value={rescheduleForm.date} onChange={(event) => setRescheduleForm((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
              </Field>
              <Field label="New slot">
                <input type="text" value={rescheduleForm.slot} onChange={(event) => setRescheduleForm((current) => ({ ...current, slot: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" placeholder="Enter exact slot e.g. 10:00 AM" required />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
              <Button type="submit" className="flex-1">Save Reschedule</Button>
            </div>
          </form>
        </div>
      )}
    </motion.section>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
