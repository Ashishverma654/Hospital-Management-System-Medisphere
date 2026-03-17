import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { updateUser } from '../../store/authSlice.js';
import { getRoleLabel } from '../../auth/constants.js';
import { userApi } from '../../services/apiServices.js';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialForm = {
  name: '',
  phone: '',
  gender: '',
  address: '',
};

export default function AdminProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await userApi.getMe();
        const profile = response.data || response;
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          gender: profile.gender || '',
          address: profile.address || '',
        });
        dispatch(updateUser(profile));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [dispatch]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await userApi.updateMe(form);
      const profile = response.data || response;
      dispatch(updateUser(profile));
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);
    setUploading(true);
    try {
      const response = await userApi.uploadProfileImage(formData);
      const profile = response.data || response;
      dispatch(updateUser(profile));
      toast.success('Profile image updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Profile</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">Your governance profile</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Update your basic identity details, review your role, and maintain the account used to manage hospital governance tools.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <img
              src={authUser?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser?.name || 'Employee')}`}
              alt={authUser?.name || 'Employee'}
              className="h-28 w-28 rounded-full border border-border object-cover"
            />
            <h3 className="mt-4 text-xl font-semibold text-foreground">{authUser?.name || 'Employee'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{getRoleLabel(authUser?.role || 'employee')}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{authUser?.employeeId || 'No employee ID'}</p>
            <label className="mt-5 inline-flex cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              {uploading ? 'Uploading...' : 'Update Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImage} />
            </label>
          </div>
        </article>

        <form onSubmit={handleSave} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full Name">
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                disabled={loading}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={authUser?.email || ''}
                className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 text-muted-foreground outline-none"
                disabled
              />
            </Field>
            <Field label="Phone">
              <input
                type="text"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                disabled={loading}
              />
            </Field>
            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                disabled={loading}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Role">
              <input
                type="text"
                value={getRoleLabel(authUser?.role || 'employee')}
                className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 text-muted-foreground outline-none"
                disabled
              />
            </Field>
            <Field label="Onboarding Status">
              <input
                type="text"
                value={authUser?.onboardingStatus || 'active'}
                className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3 text-muted-foreground outline-none"
                disabled
              />
            </Field>
          </div>

          <Field label="Address" className="mt-5">
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="min-h-[120px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
              disabled={loading}
            />
          </Field>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <p className="text-sm text-muted-foreground">Password and advanced account security can be expanded in a later module.</p>
          </div>
        </form>
      </div>
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
