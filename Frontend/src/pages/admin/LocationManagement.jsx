import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { locationApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';

const initialForm = {
  name: '',
  city: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  mapUrl: '',
  locationType: 'hospital',
};

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await locationApi.getAll({
        search,
        isActive: filterStatus || undefined,
      });
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [search, filterStatus]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await locationApi.update(editingItem._id, form);
        toast.success('Location updated successfully.');
      } else {
        await locationApi.create(form);
        toast.success('Location created successfully.');
      }
      resetForm();
      loadLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await locationApi.toggleActive(item._id);
      toast.success(`${item.name} has been ${item.isActive ? 'deactivated' : 'activated'}.`);
      loadLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Hospital Locations</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Manage hospital branches and care locations so later doctor assignment, public discovery, and booking filters use one clean source of truth.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setForm(initialForm);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or city"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadLocations}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading locations...</td>
                </tr>
              )}
              {!loading && locations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No locations found.</td>
                </tr>
              )}
              {locations.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.city}{item.state ? `, ${item.state}` : ''}</td>
                  <td className="px-4 py-3 text-slate-600">{item.address}</td>
                  <td className="px-4 py-3 text-slate-600">{item.phone || item.email || '—'}</td>
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
                            name: item.name || '',
                            city: item.city || '',
                            state: item.state || '',
                            address: item.address || '',
                            phone: item.phone || '',
                            email: item.email || '',
                            mapUrl: item.mapUrl || '',
                            locationType: item.locationType || 'hospital',
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
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{editingItem ? 'Edit Location' : 'Add Location'}</h3>
              <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Location Name">
                <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required />
              </Field>
              <Field label="Location Type">
                <select value={form.locationType} onChange={(e) => setForm((c) => ({ ...c, locationType: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900">
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="lab">Lab</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="City">
                <input type="text" value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required />
              </Field>
              <Field label="State">
                <input type="text" value={form.state} onChange={(e) => setForm((c) => ({ ...c, state: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
              </Field>
              <Field label="Phone">
                <input type="text" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
              </Field>
            </div>
            <Field label="Address" className="mt-4">
              <textarea value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required />
            </Field>
            <Field label="Map URL" className="mt-4">
              <input type="text" value={form.mapUrl} onChange={(e) => setForm((c) => ({ ...c, mapUrl: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
            </Field>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Location'}</Button>
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
