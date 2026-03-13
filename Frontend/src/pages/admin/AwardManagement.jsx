import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { awardApi, doctorApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';

const initialForm = {
  type: 'hospital',
  doctorId: '',
  title: '',
  organization: '',
  year: '',
  description: '',
  image: '',
  isActive: true,
};

export default function AwardManagement() {
  const [awards, setAwards] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const data = await awardApi.getAll({
        search,
        type: filterType || undefined,
        isActive: filterStatus || undefined,
      });
      setAwards(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load awards.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getAdminAll({});
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load doctors for award mapping.');
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadAwards();
  }, [search, filterType, filterStatus]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        doctorId: form.type === 'doctor' ? form.doctorId : undefined,
        year: form.year ? Number(form.year) : undefined,
      };

      if (editingItem) {
        await awardApi.update(editingItem._id, payload);
        toast.success('Award updated successfully.');
      } else {
        await awardApi.create(payload);
        toast.success('Award created successfully.');
      }

      resetForm();
      loadAwards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save award.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await awardApi.toggleActive(item._id);
      toast.success(`${item.title} has been ${item.isActive ? 'deactivated' : 'activated'}.`);
      loadAwards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update award.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Public Content</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Awards</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Manage hospital awards and doctor awards that can appear on the public-facing website.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Award
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or organization"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
        >
          <option value="">All Types</option>
          <option value="hospital">Hospital</option>
          <option value="doctor">Doctor</option>
        </select>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadAwards}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading awards...</td>
                </tr>
              )}
              {!loading && awards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No awards found.</td>
                </tr>
              )}
              {awards.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{item.type}</td>
                  <td className="px-4 py-3 text-slate-600">{item.doctorId?.userId?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.organization}</td>
                  <td className="px-4 py-3 text-slate-600">{item.year || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setForm({
                            type: item.type || 'hospital',
                            doctorId: item.doctorId?._id || '',
                            title: item.title || '',
                            organization: item.organization || '',
                            year: item.year || '',
                            description: item.description || '',
                            image: item.image || '',
                            isActive: item.isActive,
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant={item.isActive ? 'destructive' : 'outline'} size="sm" onClick={() => handleToggle(item)}>
                        {item.isActive ? <UserX className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{editingItem ? 'Edit Award' : 'Add Award'}</h3>
              <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Type">
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, doctorId: '' }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900">
                  <option value="hospital">Hospital Award</option>
                  <option value="doctor">Doctor Award</option>
                </select>
              </Field>
              {form.type === 'doctor' && (
                <Field label="Doctor">
                  <select value={form.doctorId} onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required>
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>{doctor.userId?.name}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Title">
                <input type="text" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required />
              </Field>
              <Field label="Organization">
                <input type="text" value={form.organization} onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required />
              </Field>
              <Field label="Year">
                <input type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
              </Field>
              <Field label="Image URL">
                <input type="text" value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
              </Field>
            </div>

            <Field label="Description" className="mt-4">
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
            </Field>

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
              Active for public visibility
            </label>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Award'}</Button>
            </div>
          </form>
        </div>
      )}
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
