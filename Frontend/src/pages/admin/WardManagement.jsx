import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { locationApi, wardApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';

const initialForm = {
  name: '',
  wardNumber: '',
  wardType: 'general',
  floor: '',
  block: '',
  bedCount: '',
  defaultPrice: '',
  hospitalLocationId: '',
};

export default function WardManagement() {
  const [wards, setWards] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedWardDetail, setSelectedWardDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadWards = async () => {
    setLoading(true);
    try {
      const data = await wardApi.getAll({
        search,
        isActive: filterStatus || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setWards(list);
      if (!selectedWardId && list.length) {
        setSelectedWardId(list[0]._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load wards.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationApi.getAll({ isActive: true });
      setLocations(Array.isArray(data) ? data : []);
    } catch (_) {
      setLocations([]);
    }
  };

  const loadWardDetail = async (wardId) => {
    if (!wardId) {
      setSelectedWardDetail(null);
      return;
    }
    try {
      const data = await wardApi.getById(wardId);
      setSelectedWardDetail(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load ward detail.');
    }
  };

  useEffect(() => {
    loadWards();
    loadLocations();
  }, [search, filterStatus]);

  useEffect(() => {
    loadWardDetail(selectedWardId);
  }, [selectedWardId]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      bedCount: Number(form.bedCount || 0),
      defaultPrice: Number(form.defaultPrice || 0),
      hospitalLocationId: form.hospitalLocationId || undefined,
    };

    try {
      if (editingItem) {
        await wardApi.update(editingItem._id, payload);
        toast.success('Ward updated successfully.');
      } else {
        await wardApi.create(payload);
        toast.success('Ward created successfully.');
      }
      resetForm();
      await loadWards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save ward.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ward) => {
    try {
      await wardApi.toggleActive(ward._id);
      toast.success(`${ward.name} has been ${ward.isActive ? 'deactivated' : 'activated'}.`);
      await loadWards();
      if (selectedWardId === ward._id) {
        await loadWardDetail(ward._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ward status.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Inpatient Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Ward management</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Manage wards, fixed bed capacity, ward types, floor and block details, and ward-level default bed pricing.
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setForm(initialForm); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ward
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ward name, number, floor, or block"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadWards}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Ward</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Beds</th>
                  <th className="px-4 py-3 font-medium">Default Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading wards...</td>
                  </tr>
                )}
                {!loading && wards.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No wards found.</td>
                  </tr>
                )}
                {wards.map((ward) => (
                  <tr key={ward._id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <button type="button" className="text-left" onClick={() => setSelectedWardId(ward._id)}>
                        <p className="font-medium text-slate-900">{ward.name}</p>
                        <p className="text-xs text-slate-500">{ward.wardNumber}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{ward.wardType}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {ward.bedSummary?.totalBeds || 0}/{ward.bedCount || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600">₹{Number(ward.defaultPrice || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ward.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {ward.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(ward);
                            setForm({
                              name: ward.name || '',
                              wardNumber: ward.wardNumber || '',
                              wardType: ward.wardType || 'general',
                              floor: ward.floor || '',
                              block: ward.block || '',
                              bedCount: ward.bedCount ?? '',
                              defaultPrice: ward.defaultPrice ?? '',
                              hospitalLocationId: ward.hospitalLocationId?._id || '',
                            });
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button type="button" variant={ward.isActive ? 'destructive' : 'outline'} size="sm" onClick={() => toggleActive(ward)}>
                          {ward.isActive ? <UserX className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                          {ward.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          {!selectedWardDetail && <div className="py-24 text-center text-slate-500">Select a ward to review its occupancy and bed setup.</div>}
          {selectedWardDetail && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Ward Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedWardDetail.ward.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedWardDetail.ward.wardNumber} • {selectedWardDetail.ward.wardType}
                  {selectedWardDetail.ward.floor ? ` • Floor ${selectedWardDetail.ward.floor}` : ''}
                  {selectedWardDetail.ward.block ? ` • Block ${selectedWardDetail.ward.block}` : ''}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <StatCard label="Default price" value={`₹${Number(selectedWardDetail.ward.defaultPrice || 0).toLocaleString()}`} />
                <StatCard label="Configured beds" value={selectedWardDetail.ward.bedCount || 0} />
                <StatCard label="Available beds" value={selectedWardDetail.ward.bedSummary?.availableBeds || 0} />
                <StatCard label="Occupied beds" value={selectedWardDetail.ward.bedSummary?.occupiedBeds || 0} />
              </div>

              <div>
                <p className="font-semibold text-slate-900">Beds in this ward</p>
                <div className="mt-3 space-y-3">
                  {(selectedWardDetail.beds || []).map((bed) => (
                    <div key={bed._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Bed {bed.bedNumber}</p>
                          <p className="mt-1 text-sm text-slate-600 capitalize">{bed.status}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Price ₹{Number(bed.effectivePrice || 0).toLocaleString()}
                            {bed.patient ? ` • ${bed.patient.name} (${bed.patient.patientId || 'No ID'})` : ''}
                          </p>
                        </div>
                        {bed.admittedAt && (
                          <span className="text-xs text-slate-500">
                            Admitted {new Date(bed.admittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedWardDetail.beds?.length === 0 && (
                    <p className="text-sm text-slate-500">No beds are linked to this ward yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{editingItem ? 'Edit Ward' : 'Add Ward'}</h3>
              <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Ward name"><input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required /></Field>
              <Field label="Ward number"><input type="text" value={form.wardNumber} onChange={(e) => setForm((c) => ({ ...c, wardNumber: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required /></Field>
              <Field label="Ward type">
                <select value={form.wardType} onChange={(e) => setForm((c) => ({ ...c, wardType: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900">
                  <option value="general">General</option>
                  <option value="semi-private">Semi-private</option>
                  <option value="private">Private</option>
                  <option value="icu">ICU</option>
                  <option value="nicu">NICU</option>
                  <option value="picu">PICU</option>
                  <option value="emergency">Emergency</option>
                  <option value="maternity">Maternity</option>
                  <option value="isolation">Isolation</option>
                </select>
              </Field>
              <Field label="Location">
                <select value={form.hospitalLocationId} onChange={(e) => setForm((c) => ({ ...c, hospitalLocationId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900">
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Floor"><input type="text" value={form.floor} onChange={(e) => setForm((c) => ({ ...c, floor: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" /></Field>
              <Field label="Block"><input type="text" value={form.block} onChange={(e) => setForm((c) => ({ ...c, block: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" /></Field>
              <Field label="Fixed bed count"><input type="number" min="0" value={form.bedCount} onChange={(e) => setForm((c) => ({ ...c, bedCount: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required /></Field>
              <Field label="Default bed price"><input type="number" min="0" value={form.defaultPrice} onChange={(e) => setForm((c) => ({ ...c, defaultPrice: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required /></Field>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Ward'}</Button>
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

function StatCard({ label, value }) {
  return (
    <article className="rounded-[1.25rem] border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
