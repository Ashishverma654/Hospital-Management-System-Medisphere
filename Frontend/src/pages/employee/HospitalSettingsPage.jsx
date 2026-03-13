import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '../../services/apiServices.js';

const initialForm = {
  hospitalName: '',
  logo: '',
  email: '',
  phone: '',
  address: '',
  emergencyNumber: '',
  footerInfo: '',
  publicInfo: '',
};

export default function HospitalSettingsPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const settings = await adminApi.getSettings();
        setForm({
          hospitalName: settings.hospitalName || '',
          logo: settings.logo || '',
          email: settings.email || '',
          phone: settings.phone || '',
          address: settings.address || '',
          emergencyNumber: settings.emergencyNumber || '',
          footerInfo: settings.footerInfo || '',
          publicInfo: settings.publicInfo || '',
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load hospital settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await adminApi.updateSettings(form);
      const settings = response.settings || response;
      setForm({
        hospitalName: settings.hospitalName || '',
        logo: settings.logo || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        emergencyNumber: settings.emergencyNumber || '',
        footerInfo: settings.footerInfo || '',
        publicInfo: settings.publicInfo || '',
      });
      toast.success('Hospital settings saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Hospital Settings</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Global hospital identity</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage the organization-wide contact and branding details that future public content and patient-facing modules will rely on.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Hospital Name">
            <input
              type="text"
              value={form.hospitalName}
              onChange={(event) => setForm((current) => ({ ...current, hospitalName: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              disabled={loading}
              required
            />
          </Field>
          <Field label="Logo URL">
            <input
              type="text"
              value={form.logo}
              onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              disabled={loading}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              disabled={loading}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              disabled={loading}
            />
          </Field>
          <Field label="Emergency Number">
            <input
              type="text"
              value={form.emergencyNumber}
              onChange={(event) => setForm((current) => ({ ...current, emergencyNumber: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              disabled={loading}
            />
          </Field>
          <Field label="Public Footer">
            <input
              type="text"
              value={form.footerInfo}
              onChange={(event) => setForm((current) => ({ ...current, footerInfo: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              disabled={loading}
            />
          </Field>
        </div>

        <Field label="Address" className="mt-5">
          <textarea
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            disabled={loading}
          />
        </Field>

        <Field label="Public Information" className="mt-5">
          <textarea
            value={form.publicInfo}
            onChange={(event) => setForm((current) => ({ ...current, publicInfo: event.target.value }))}
            className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            disabled={loading}
          />
        </Field>

        <div className="mt-6">
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
