import { useEffect, useMemo, useState } from 'react';
import { appointmentApi, getDepartments, getDoctors, getSpecializations, slotApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Calendar, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialForm = {
  departmentId: '',
  specializationId: '',
  doctorId: '',
  date: new Date().toISOString().split('T')[0],
  slot: '',
  hospitalLocationId: '',
  visitType: 'newConsultation',
  consultationMode: 'in-person',
  reasonForVisit: '',
};

export default function PatientBookAppointment() {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => doc._id === form.doctorId),
    [doctors, form.doctorId]
  );

  useEffect(() => {
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [deptData, specData] = await Promise.all([getDepartments(), getSpecializations()]);
        setDepartments(Array.isArray(deptData) ? deptData : []);
        setSpecializations(Array.isArray(specData) ? specData : []);
      } finally {
        setLoading(false);
      }
    };
    loadMasters();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await getDoctors({
          departmentId: form.departmentId || undefined,
          specializationId: form.specializationId || undefined,
        });
        setDoctors(Array.isArray(response) ? response : []);
      } catch {
        setDoctors([]);
      }
    };
    loadDoctors();
  }, [form.departmentId, form.specializationId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!form.doctorId || !form.date) {
        setAvailableSlots([]);
        return;
      }
      setSlotLoading(true);
      try {
        const response = await slotApi.getByDoctor(form.doctorId, form.date);
        setAvailableSlots(response?.availableSlots || []);
      } catch {
        setAvailableSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };
    loadSlots();
  }, [form.doctorId, form.date]);

  const filteredSpecializations = useMemo(
    () => specializations.filter((spec) => !form.departmentId || spec.departmentId?._id === form.departmentId),
    [specializations, form.departmentId]
  );

  const resolveFee = () => {
    if (!selectedDoctor) return 0;
    let fee = selectedDoctor.consultationFee || 0;
    if (form.consultationMode === 'video' && selectedDoctor.consultationFeeVideo != null) {
      fee = selectedDoctor.consultationFeeVideo;
    }
    if (form.consultationMode === 'phone' && selectedDoctor.consultationFeePhone != null) {
      fee = selectedDoctor.consultationFeePhone;
    }
    if (form.consultationMode === 'in-person' && form.hospitalLocationId) {
      const match = (selectedDoctor.locationFees || []).find(
        (item) => item.locationId === form.hospitalLocationId || item.locationId?._id === form.hospitalLocationId
      );
      if (match?.fee != null) fee = match.fee;
    }
    return fee;
  };

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
      setForm({ ...initialForm, departmentId: form.departmentId, specializationId: form.specializationId, doctorId: form.doctorId });
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
                  specializationId: '',
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
          <Field label="Specialization">
            <select
              value={form.specializationId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  specializationId: event.target.value,
                  doctorId: '',
                  slot: '',
                  hospitalLocationId: '',
                }))
              }
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            >
              <option value="">All specializations</option>
              {filteredSpecializations.map((spec) => (
                <option key={spec._id} value={spec._id}>
                  {spec.name}
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
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.userId?.name} • {doctor.departmentId?.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date: event.target.value,
                  slot: '',
                }))
              }
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
              required
            />
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
            <select
              value={form.consultationMode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  consultationMode: event.target.value,
                  hospitalLocationId: '',
                }))
              }
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            >
              <option value="in-person">In-person</option>
              <option value="video">Video</option>
              <option value="phone">Phone</option>
            </select>
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
              {selectedDoctor.hospitalLocations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}{loc.city ? ` • ${loc.city}` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Available slots">
          <div className="flex flex-wrap gap-2">
            {slotLoading && <span className="text-sm text-muted-foreground">Loading slots...</span>}
            {!slotLoading &&
              availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, slot }))}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    form.slot === slot
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {slot}
                </button>
              ))}
            {!slotLoading && form.doctorId && availableSlots.length === 0 && (
              <span className="text-sm text-muted-foreground">No available slots for the selected date.</span>
            )}
          </div>
        </Field>

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Estimated consultation fee: <span className="font-semibold text-foreground">₹{Number(resolveFee() || 0).toLocaleString()}</span>
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
            type="submit"
            disabled={saving || (form.consultationMode === 'in-person' && selectedDoctor?.hospitalLocations?.length > 0 && !form.hospitalLocationId)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            <Calendar className="h-4 w-4" />
            {saving ? 'Booking...' : 'Confirm appointment'}
          </button>
        </div>
      </form>
    </motion.section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm text-muted-foreground">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
