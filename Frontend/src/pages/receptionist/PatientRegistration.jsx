import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { receptionistApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'unknown',
  address: '',
  bloodGroup: '',
  allergies: '',
  chronicDiseases: '',
  insuranceProvider: '',
  insuranceNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [credential, setCredential] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setMatches([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const response = await receptionistApi.searchPatients(query);
        setMatches(response.patients || []);
      } catch {
        setMatches([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await receptionistApi.registerPatient({
        ...form,
        allergies: form.allergies,
        chronicDiseases: form.chronicDiseases,
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relation: form.emergencyContactRelation,
        },
      });
      setCredential(response.temporaryCredential || null);
      toast.success('Patient registered successfully.');
      setForm(initialForm);
      setQuery('');
      setMatches([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register patient.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Receptionist Workflow</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Register Patient</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Search existing patients before creating a new record, then create the patient&apos;s auth identity and linked profile together from one front-desk workflow.
        </p>
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search existing patients by name, patient ID, phone, or email"
            className="w-full rounded-2xl border border-border py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-4 space-y-3">
          {loadingSearch && <p className="text-sm text-muted-foreground">Searching existing patients...</p>}
          {matches.map((patient) => (
            <article key={patient.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{patient.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{patient.patientId} • {patient.phone} • {patient.email}</p>
              </div>
              <Button variant="outline" asChild>
                <Link to={`/employee/receptionist/appointments?patientId=${patient.id}`}>Book Appointment</Link>
              </Button>
            </article>
          ))}
          {query.trim() && !loadingSearch && matches.length === 0 && (
            <p className="text-sm text-muted-foreground">No existing patient matched. You can register a new patient below.</p>
          )}
        </div>
      </article>

      {credential && (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">Temporary patient credential generated</p>
          <p className="mt-2 text-sm text-amber-800">
            Patient ID: <strong>{credential.patientId}</strong> | Email: <strong>{credential.email}</strong> | Temporary Password: <strong>{credential.temporaryPassword}</strong>
          </p>
          <p className="mt-2 text-xs text-amber-700">Share this securely with the patient for their first portal login.</p>
        </article>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name"><input type="text" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required /></Field>
          <Field label="Phone"><input type="text" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required /></Field>
          <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required /></Field>
          <Field label="Gender">
            <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Blood Group"><input type="text" value={form.bloodGroup} onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
        </div>

        <Field label="Address" className="mt-4"><textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="min-h-[100px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
        <Field label="Allergies (comma separated)" className="mt-4"><input type="text" value={form.allergies} onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
        <Field label="Chronic Diseases (comma separated)" className="mt-4"><input type="text" value={form.chronicDiseases} onChange={(event) => setForm((current) => ({ ...current, chronicDiseases: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Insurance Provider"><input type="text" value={form.insuranceProvider} onChange={(event) => setForm((current) => ({ ...current, insuranceProvider: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
          <Field label="Insurance Number"><input type="text" value={form.insuranceNumber} onChange={(event) => setForm((current) => ({ ...current, insuranceNumber: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
          <Field label="Emergency Contact Name (optional)"><input type="text" value={form.emergencyContactName} onChange={(event) => setForm((current) => ({ ...current, emergencyContactName: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
          <Field label="Emergency Contact Phone (optional)"><input type="text" value={form.emergencyContactPhone} onChange={(event) => setForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
          <Field label="Relation to Patient (optional)"><input type="text" value={form.emergencyContactRelation} onChange={(event) => setForm((current) => ({ ...current, emergencyContactRelation: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/employee/receptionist')}>
            Back to Dashboard
          </Button>
          <Button type="submit" disabled={saving}>{saving ? 'Registering...' : 'Register Patient'}</Button>
        </div>
      </form>
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
