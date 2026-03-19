import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { labTechApi } from '../../services/apiServices.js';
import { Button } from '../../components/ui/button.jsx';
import { getRoleLabel } from '../../auth/constants.js';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const toCertString = (certs) => (Array.isArray(certs) ? certs.join(', ') : '');
const toCertArray = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function LabTechProfile() {
  const authUser = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ labSection: '', certifications: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const displayUser = useMemo(() => profile?.userId || authUser, [profile, authUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await labTechApi.getProfile();
      const data = response?.data || response;
      setProfile(data);
      setForm({
        labSection: data?.labSection || '',
        certifications: toCertString(data?.certifications),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lab technician profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        labSection: form.labSection,
        certifications: toCertArray(form.certifications),
      };
      const response = await labTechApi.updateProfile(payload);
      const updated = response?.data?.tech || response?.tech || profile;
      setProfile(updated);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Lab Technician Profile</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Your diagnostics workspace profile</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Keep your lab section and certification records accurate for internal workflow routing and compliance checks.
        </p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
        <motion.article variants={staggerItem} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <img
              src={
                displayUser?.profileImage ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayUser?.name || 'Lab Tech')}`
              }
              alt={displayUser?.name || 'Lab technician'}
              className="h-28 w-28 rounded-3xl border border-border object-cover"
            />
            <h3 className="mt-4 text-xl font-semibold text-foreground">{displayUser?.name || 'Lab Technician'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{getRoleLabel(displayUser?.role || 'labTechnician')}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {displayUser?.employeeId || 'Employee ID pending'}
            </p>
          </div>

          <div className="mt-6 space-y-3 text-left">
            <InfoRow label="Email" value={displayUser?.email || 'Not available'} />
            <InfoRow label="Phone" value={displayUser?.phone || 'Not available'} />
            <InfoRow label="Department" value={profile?.departmentId?.name || 'Not assigned'} />
          </div>
        </motion.article>

        <motion.form variants={staggerItem} onSubmit={handleSave} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Lab Section">
              <input
                type="text"
                value={form.labSection}
                onChange={(event) => setForm((current) => ({ ...current, labSection: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                disabled={loading}
              />
            </Field>
            <Field label="Certifications">
              <input
                type="text"
                value={form.certifications}
                onChange={(event) => setForm((current) => ({ ...current, certifications: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                placeholder="e.g. NABL, ISO 15189"
                disabled={loading}
              />
            </Field>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Separate multiple certifications with commas.
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || loading} className="rounded-full px-6">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={loadProfile} disabled={loading}>
              Refresh
            </Button>
          </div>
        </motion.form>
      </div>
    </motion.section>
  );
}

function Field({ children, label }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
