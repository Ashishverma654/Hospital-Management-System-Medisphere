import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { departmentApi, specializationApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialForm = {
  name: '',
  departmentId: '',
  description: '',
};

export default function SpecializationManagement() {
  const [specializations, setSpecializations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [specializationData, departmentData] = await Promise.all([
        specializationApi.getAll({
          search,
          departmentId: filterDepartment || undefined,
          isActive: filterStatus || undefined,
        }),
        departmentApi.getAll(),
      ]);
      setSpecializations(Array.isArray(specializationData) ? specializationData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData.filter((item) => item.isActive) : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load specializations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, filterDepartment, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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
        await specializationApi.update(editingItem._id, form);
        toast.success('Specialization updated successfully.');
      } else {
        await specializationApi.create(form);
        toast.success('Specialization created successfully.');
      }
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save specialization.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await specializationApi.toggleActive(item._id);
      toast.success(`${item.name} has been ${item.isActive ? 'deactivated' : 'activated'}.`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update specialization.');
    }
  };

  const departmentOptions = useMemo(() => departments, [departments]);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Specializations</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage doctor-facing specialization records and keep them mapped cleanly to departments for later doctor discovery and filtering.
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
          Add Specialization
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by specialization name"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(event) => setFilterDepartment(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All Departments</option>
          {departmentOptions.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading specializations...</td>
                </tr>
              )}
              {!loading && specializations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No specializations found.</td>
                </tr>
              )}
              {specializations.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.departmentId?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.description || '—'}</td>
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
                            name: item.name,
                            departmentId: item.departmentId?._id || '',
                            description: item.description || '',
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
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingItem ? 'Edit Specialization' : 'Add Specialization'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Specialization Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </Field>
              <Field label="Department">
                <select
                  value={form.departmentId}
                  onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                />
              </Field>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Specialization'}</Button>
            </div>
          </form>
        </div>
      )}
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
