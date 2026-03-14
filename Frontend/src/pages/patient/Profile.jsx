import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { patientApi, userApi } from '../../services/apiServices.js';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../store/authSlice.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const parseList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PatientProfile() {
  const dispatch = useDispatch();
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
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '', saving: false });

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

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      toast.error('All password fields are required.');
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setPasswordForm((prev) => ({ ...prev, saving: true }));
    try {
      const response = await userApi.changePassword({ oldPassword: passwordForm.current, newPassword: passwordForm.next });
      if (response) {
        dispatch(updateUser({ mustResetPassword: response.mustResetPassword, onboardingStatus: response.onboardingStatus }));
      }
      toast.success('Password updated successfully.');
      setPasswordForm({ current: '', next: '', confirm: '', saving: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password.');
      setPasswordForm((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Profile</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Your patient profile</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Keep your demographic and medical basics up to date so care teams can support you faster.
        </p>
      </div>

      <form onSubmit={updateProfile} className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
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

        <section className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Emergency contact</h3>
          <Field label="Contact name" value={form.emergencyName} onChange={(value) => setForm((current) => ({ ...current, emergencyName: value }))} />
          <Field label="Contact phone" value={form.emergencyPhone} onChange={(value) => setForm((current) => ({ ...current, emergencyPhone: value }))} />
          <Field label="Relation" value={form.emergencyRelation} onChange={(value) => setForm((current) => ({ ...current, emergencyRelation: value }))} />

          <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Account email</p>
            <p className="mt-1">{profile?.user?.email || '—'}</p>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </section>
      </form>

      <form onSubmit={handlePasswordChange} className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Security</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">Change password</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your current password to set a new one for your patient portal.
          </p>
        </div>
        <Field
          label="Current password"
          type="password"
          value={passwordForm.current}
          onChange={(value) => setPasswordForm((prev) => ({ ...prev, current: value }))}
        />
        <Field
          label="New password"
          type="password"
          value={passwordForm.next}
          onChange={(value) => setPasswordForm((prev) => ({ ...prev, next: value }))}
        />
        <Field
          label="Confirm new password"
          type="password"
          value={passwordForm.confirm}
          onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirm: value }))}
        />
        <Button type="submit" disabled={passwordForm.saving}>
          {passwordForm.saving ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </motion.section>
  );
}

function Field({ label, value, onChange, type = 'text', readOnly = false }) {
  return (
    <label className="block text-sm text-muted-foreground">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary ${readOnly ? 'bg-muted/50 text-muted-foreground' : 'bg-card'}`}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm text-muted-foreground">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
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
