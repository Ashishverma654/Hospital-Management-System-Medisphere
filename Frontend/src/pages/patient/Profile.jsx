import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { patientApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    allergies: '',
    chronicDiseases: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await patientApi.getMyProfile();
      const patient = data?.patient;
      setProfile(patient);
      if (patient) {
        setForm({
          name: patient.user?.name || '',
          phone: patient.user?.phone || '',
          address: patient.address || '',
          gender: patient.gender || '',
          dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
          bloodGroup: patient.bloodGroup || '',
          allergies: (patient.allergies || []).join(', '),
          chronicDiseases: (patient.chronicDiseases || []).join(', '),
          emergencyName: patient.emergencyContact?.name || '',
          emergencyPhone: patient.emergencyContact?.phone || '',
          emergencyRelation: patient.emergencyContact?.relation || '',
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load profile.');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bloodGroup: form.bloodGroup || undefined,
        allergies: parseList(form.allergies),
        chronicDiseases: parseList(form.chronicDiseases),
        emergencyContact: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relation: form.emergencyRelation,
        },
      };
      const data = await patientApi.updateMyProfile(payload);
      setProfile(data?.patient);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Profile</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Your patient profile</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Keep your demographic and medical basics up to date so care teams can support you faster.
        </p>
      </div>

      <form onSubmit={updateProfile} className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          </div>
          <Field label="Address" value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Gender" value={form.gender} onChange={(value) => setForm((current) => ({ ...current, gender: value }))} options={['', 'male', 'female', 'other', 'unknown']} />
            <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => setForm((current) => ({ ...current, dateOfBirth: value }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Blood group" value={form.bloodGroup} onChange={(value) => setForm((current) => ({ ...current, bloodGroup: value }))} />
            <Field label="Medical record number" value={profile?.user?.patientId || ''} readOnly />
          </div>
          <Field
            label="Allergies (comma separated)"
            value={form.allergies}
            onChange={(value) => setForm((current) => ({ ...current, allergies: value }))}
          />
          <Field
            label="Chronic conditions (comma separated)"
            value={form.chronicDiseases}
            onChange={(value) => setForm((current) => ({ ...current, chronicDiseases: value }))}
          />
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Emergency contact</h3>
          <Field label="Contact name" value={form.emergencyName} onChange={(value) => setForm((current) => ({ ...current, emergencyName: value }))} />
          <Field label="Contact phone" value={form.emergencyPhone} onChange={(value) => setForm((current) => ({ ...current, emergencyPhone: value }))} />
          <Field label="Relation" value={form.emergencyRelation} onChange={(value) => setForm((current) => ({ ...current, emergencyRelation: value }))} />

          <div className="rounded-[1.25rem] border border-slate-200 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Account email</p>
            <p className="mt-1">{profile?.user?.email || '—'}</p>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </section>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', readOnly = false }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 ${readOnly ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
      >
        {options.map((option) => (
          <option key={option || 'none'} value={option}>
            {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'Select'}
          </option>
        ))}
      </select>
    </label>
  );
}
