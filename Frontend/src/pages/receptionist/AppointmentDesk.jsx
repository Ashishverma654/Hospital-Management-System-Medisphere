import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { admissionApi, appointmentApi, billingApi, receptionistApi, slotApi } from '../../services/apiServices.js';
import { connectSocket } from '../../services/socket.js';
import { toast } from 'sonner';
import { Calendar, RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialBooking = {
  patientId: '',
  doctorId: '',
  departmentId: '',
  date: new Date().toISOString().split('T')[0],
  slot: '',
  visitType: 'newConsultation',
  consultationMode: 'in-person',
  reasonForVisit: '',
  priority: 'Normal',
};

const initialWalkIn = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  age: '',
  gender: 'unknown',
  address: '',
  bloodGroup: '',
  allergies: '',
  chronicDiseases: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

export default function AppointmentDesk() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';
  const [patients, setPatients] = useState([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [booking, setBooking] = useState({ ...initialBooking, patientId: preselectedPatientId });
  const [options, setOptions] = useState({ departments: [], doctors: [] });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueSummary, setQueueSummary] = useState(null);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAdmissionOnly, setFilterAdmissionOnly] = useState(false);
  const [queueDate, setQueueDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [bookingMode, setBookingMode] = useState('existing');
  const [walkInForm, setWalkInForm] = useState(initialWalkIn);
  const [walkInCredential, setWalkInCredential] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', slot: '' });
  const [queueDepartments, setQueueDepartments] = useState([]);
  const [admissionTarget, setAdmissionTarget] = useState(null);
  const [admissionForm, setAdmissionForm] = useState({ departmentId: '', doctorId: '', reason: '', notes: '' });
  const [admissionDoctors, setAdmissionDoctors] = useState([]);

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
      });
      setOptions(response);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load booking options.');
    }
  };

  const loadQueue = useCallback(async () => {
    try {
      const response = await appointmentApi.getQueueToday({
        date: queueDate,
        doctorId: filterDoctor || undefined,
        departmentId: filterDepartment || undefined,
        status: filterStatus || undefined,
      });
      setQueue(response.appointments || []);
      setQueueSummary(response.summary || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load today queue.');
    }
  }, [filterDepartment, filterDoctor, filterStatus, queueDate]);

  useEffect(() => {
    loadPatients(preselectedPatientId || patientQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [booking.departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!booking.doctorId || booking.departmentId) return;
    const selected = (options.doctors || []).find((doc) => doc._id === booking.doctorId);
    if (selected?.departmentId?._id) {
      setBooking((current) => ({
        ...current,
        departmentId: selected.departmentId._id,
      }));
    }
  }, [booking.doctorId, booking.departmentId, options.doctors]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const socket = connectSocket({ role: 'receptionist' });
    const handleQueueUpdate = () => loadQueue();

    socket.on('queue:update', handleQueueUpdate);
    socket.on('token:generated', handleQueueUpdate);
    socket.on('consultation:started', handleQueueUpdate);
    socket.on('consultation:completed', handleQueueUpdate);

    return () => {
      socket.off('queue:update', handleQueueUpdate);
      socket.off('token:generated', handleQueueUpdate);
      socket.off('consultation:started', handleQueueUpdate);
      socket.off('consultation:completed', handleQueueUpdate);
    };
  }, [loadQueue]);

  useEffect(() => {
    const loadQueueDepartments = async () => {
      try {
        const response = await receptionistApi.getBookingOptions({});
        setQueueDepartments(response.departments || []);
      } catch {
        setQueueDepartments([]);
      }
    };
    loadQueueDepartments();
  }, []);

  useEffect(() => {
    const loadAdmissionDoctors = async () => {
      if (!admissionTarget) return;
      try {
        const response = await receptionistApi.getBookingOptions({
          departmentId: admissionForm.departmentId || undefined,
        });
        setAdmissionDoctors(response.doctors || []);
      } catch {
        setAdmissionDoctors([]);
      }
    };
    loadAdmissionDoctors();
  }, [admissionTarget, admissionForm.departmentId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!booking.doctorId || !booking.date) {
        setAvailableSlots([]);
        setAllSlots([]);
        setBookedSlots([]);
        return;
      }

      setSlotLoading(true);
      try {
        const response = await slotApi.getByDoctor(booking.doctorId, booking.date);
        setAvailableSlots(response.availableSlots || []);
        setAllSlots(response?.allSlots || response?.availableSlots || []);
        setBookedSlots(response?.bookedSlots || []);
      } catch {
        setAvailableSlots([]);
        setAllSlots([]);
        setBookedSlots([]);
      } finally {
        setSlotLoading(false);
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
      let patientId = booking.patientId;
      if (bookingMode === 'walkIn') {
        if (!walkInForm.dateOfBirth && !walkInForm.age) {
          toast.error('Provide date of birth or age for walk-in patient.');
          setSaving(false);
          return;
        }
        const response = await receptionistApi.registerPatient({
          ...walkInForm,
          age: walkInForm.age ? Number(walkInForm.age) : undefined,
          emergencyContact: {
            name: walkInForm.emergencyContactName,
            phone: walkInForm.emergencyContactPhone,
            relation: walkInForm.emergencyContactRelation,
          },
        });
        patientId = response.patient?.id;
        setWalkInCredential(response.temporaryCredential || null);
      }

      await appointmentApi.book({
        ...booking,
        patientId,
        visitType: bookingMode === 'walkIn' ? 'walkIn' : booking.visitType,
      });
      toast.success('Appointment booked successfully.');
      setBooking({ ...initialBooking, patientId: bookingMode === 'walkIn' ? '' : booking.patientId, date: booking.date });
      setAvailableSlots([]);
      if (bookingMode === 'walkIn') {
        setWalkInForm(initialWalkIn);
      }
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

  const handleNoShow = async (appointmentId) => {
    try {
      await appointmentApi.markNoShow(appointmentId);
      toast.success('Marked as no-show.');
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark no-show.');
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

  const handleComplete = async (appointmentId) => {
    try {
      await appointmentApi.complete(appointmentId);
      toast.success('Appointment marked as completed.');
      loadQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete appointment.');
    }
  };

  const openAdmission = async (appointment) => {
    setAdmissionTarget(appointment);
    setAdmissionForm({
      departmentId: appointment.doctorId?.departmentId?._id || '',
      doctorId: appointment.doctorId?._id || '',
      reason: appointment.reasonForVisit || '',
      notes: '',
    });
    try {
      const response = await receptionistApi.getBookingOptions({
        departmentId: appointment.doctorId?.departmentId?._id || undefined,
      });
      setAdmissionDoctors(response.doctors || []);
    } catch {
      setAdmissionDoctors([]);
    }
  };

  const submitAdmission = async (event) => {
    event.preventDefault();
    if (!admissionTarget?.patientProfileId?._id && !admissionTarget?.patientId?._id) {
      return toast.error('Patient information is missing.');
    }
    try {
      await admissionApi.create({
        patientId: admissionTarget.patientProfileId?._id || admissionTarget.patientId?._id,
        departmentId: admissionForm.departmentId,
        doctorId: admissionForm.doctorId,
        reason: admissionForm.reason,
        notes: admissionForm.notes,
      });
      toast.success('Admission initiated successfully.');
      setAdmissionTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate admission.');
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

  const visibleQueue = useMemo(() => {
    if (!filterAdmissionOnly) return queue;
    return queue.filter((appointment) => appointment.admissionRecommended);
  }, [queue, filterAdmissionOnly]);

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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBookingMode('existing')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  bookingMode === 'existing'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                Existing patient
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('walkIn')}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  bookingMode === 'walkIn'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                Walk-in patient
              </button>
            </div>

            {walkInCredential && bookingMode === 'walkIn' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold text-amber-900">Temporary patient credential generated</p>
                <p className="mt-1">Patient ID: <strong>{walkInCredential.patientId}</strong> | Password: <strong>{walkInCredential.temporaryPassword}</strong></p>
              </div>
            )}

            {bookingMode === 'existing' && (
              <>
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
                  <select value={booking.patientId} onChange={(event) => setBooking((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required={bookingMode === 'existing'}>
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
              </>
            )}

            {bookingMode === 'walkIn' && (
              <div className="rounded-2xl border border-border p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full name">
                    <input type="text" value={walkInForm.name} onChange={(e) => setWalkInForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
                  </Field>
                  <Field label="Email (optional)">
                    <input type="email" value={walkInForm.email} onChange={(e) => setWalkInForm((c) => ({ ...c, email: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                  <Field label="Phone">
                    <input type="text" value={walkInForm.phone} onChange={(e) => setWalkInForm((c) => ({ ...c, phone: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
                  </Field>
                  <Field label="Date of birth (optional)">
                    <input type="date" value={walkInForm.dateOfBirth} onChange={(e) => setWalkInForm((c) => ({ ...c, dateOfBirth: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                  <Field label="Age (optional)">
                    <input type="number" min="0" value={walkInForm.age} onChange={(e) => setWalkInForm((c) => ({ ...c, age: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                </div>
                <Field label="Address">
                  <input type="text" value={walkInForm.address} onChange={(e) => setWalkInForm((c) => ({ ...c, address: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Emergency contact name (optional)">
                    <input type="text" value={walkInForm.emergencyContactName} onChange={(e) => setWalkInForm((c) => ({ ...c, emergencyContactName: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                  <Field label="Emergency contact phone (optional)">
                    <input type="text" value={walkInForm.emergencyContactPhone} onChange={(e) => setWalkInForm((c) => ({ ...c, emergencyContactPhone: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                  <Field label="Relation (optional)">
                    <input type="text" value={walkInForm.emergencyContactRelation} onChange={(e) => setWalkInForm((c) => ({ ...c, emergencyContactRelation: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Department">
                <select value={booking.departmentId} onChange={(event) => setBooking((current) => ({ ...current, departmentId: event.target.value, doctorId: '', slot: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select department</option>
                  {(options.departments || []).map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Doctor">
                <select
                  value={booking.doctorId}
                  onChange={(event) => {
                    const doctorId = event.target.value;
                    const doctor = (options.doctors || []).find((item) => item._id === doctorId);
                    setBooking((current) => ({
                      ...current,
                      doctorId,
                      slot: '',
                      departmentId: doctor?.departmentId?._id || current.departmentId,
                    }));
                  }}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                >
                  <option value="">Select doctor</option>
                  {(options.doctors || []).map((item) => (
                    <option key={item._id} value={item._id}>{item.userId?.name || 'Doctor'} • {item.departmentId?.name || 'Department'}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" value={booking.date} onChange={(event) => setBooking((current) => ({ ...current, date: event.target.value, slot: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
              </Field>
              <Field label="Visit Type">
                <select value={bookingMode === 'walkIn' ? 'walkIn' : booking.visitType} onChange={(event) => setBooking((current) => ({ ...current, visitType: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" disabled={bookingMode === 'walkIn'}>
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
              <Field label="Priority">
                <select value={booking.priority} onChange={(event) => setBooking((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="Normal">Normal</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </Field>
            </div>

            <Field label="Reason for Visit">
              <textarea value={booking.reasonForVisit} onChange={(event) => setBooking((current) => ({ ...current, reasonForVisit: event.target.value }))} className="min-h-[100px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
            </Field>

            <Field label="Available Slots">
              <div className="flex flex-wrap gap-2">
                {slotLoading && <p className="text-sm text-muted-foreground">Loading slots...</p>}
                {!slotLoading && (allSlots.length ? allSlots : availableSlots).map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = booking.slot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setBooking((current) => ({ ...current, slot }))}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isBooked
                          ? 'bg-red-500/15 text-red-500 border border-red-500/30 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
                {!slotLoading && booking.doctorId && (allSlots.length ? allSlots : availableSlots).length === 0 && (
                  <p className="text-sm text-muted-foreground">No slots published for the selected date.</p>
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
            <select value={filterDepartment} onChange={(event) => setFilterDepartment(event.target.value)} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All departments</option>
              {queueDepartments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
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
            <label className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={filterAdmissionOnly}
                onChange={(event) => setFilterAdmissionOnly(event.target.checked)}
                className="h-4 w-4"
              />
              Admission recommended only
            </label>
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
            {visibleQueue.map((appointment) => (
              <article key={appointment._id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.patientId?.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.patientId?.patientId} • {appointment.doctorId?.userId?.name || 'Doctor'} • {appointment.slot}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Token {appointment.tokenNumber || '—'} {appointment.queuePosition ? `• #${appointment.queuePosition}` : ''}
                    </p>
                    {appointment.estimatedWaitTime != null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Est. wait {appointment.estimatedWaitTime} min
                      </p>
                    )}
                    {appointment.arrivalTime || appointment.checkInAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Arrived {new Date(appointment.arrivalTime || appointment.checkInAt).toLocaleTimeString()}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{appointment.visitType}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                      {appointment.status}
                    </span>
                    {appointment.status === 'booked' && (
                      <Button size="sm" onClick={() => handleArrive(appointment._id)}>Mark Arrived</Button>
                    )}
                    {['booked', 'confirmed'].includes(appointment.status) && (
                      <Button size="sm" variant="outline" onClick={() => handleNoShow(appointment._id)}>Mark No‑Show</Button>
                    )}
                    {['inConsultation'].includes(appointment.status) && (
                      <Button size="sm" variant="outline" onClick={() => handleComplete(appointment._id)}>Mark Completed</Button>
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
                    {['arrived', 'waiting', 'inConsultation'].includes(appointment.status) && (
                      <Button size="sm" variant="outline" onClick={() => openAdmission(appointment)}>Initiate Admission</Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {visibleQueue.length === 0 && <p className="text-sm text-muted-foreground">No appointments found for the selected filters.</p>}
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

      {admissionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitAdmission} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Initiate Admission</h3>
              <button type="button" onClick={() => setAdmissionTarget(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-5 grid gap-4">
              <Field label="Patient">
                <input type="text" value={admissionTarget.patientId?.name || admissionTarget.patientProfileId?.name || 'Patient'} readOnly className="w-full rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground" />
              </Field>
              <Field label="Department">
                <select value={admissionForm.departmentId} onChange={(event) => setAdmissionForm((current) => ({ ...current, departmentId: event.target.value, doctorId: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select department</option>
                  {(queueDepartments || []).map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Doctor">
                <select value={admissionForm.doctorId} onChange={(event) => setAdmissionForm((current) => ({ ...current, doctorId: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select doctor</option>
                  {(admissionDoctors || []).map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>{doctor.userId?.name || 'Doctor'}</option>
                  ))}
                </select>
              </Field>
              <Field label="Reason (optional)">
                <input type="text" value={admissionForm.reason} onChange={(event) => setAdmissionForm((current) => ({ ...current, reason: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
              <Field label="Notes (optional)">
                <textarea value={admissionForm.notes} onChange={(event) => setAdmissionForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-[90px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAdmissionTarget(null)}>Cancel</Button>
              <Button type="submit" className="flex-1">Confirm Admission</Button>
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
