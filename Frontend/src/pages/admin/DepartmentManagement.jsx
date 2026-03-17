import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { departmentApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { History, Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialForm = {
  name: '',
  description: '',
  code: '',
  image: '',
  isFeatured: false,
};

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getAll({
        search,
        isActive: filterStatus || undefined,
      });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [search, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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
        await departmentApi.update(editingItem._id, form);
        toast.success('Department updated successfully.');
      } else {
        await departmentApi.create(form);
        toast.success('Department created successfully.');
      }
      resetForm();
      loadDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await departmentApi.toggleActive(item._id);
      toast.success(`${item.name} has been ${item.isActive ? 'deactivated' : 'activated'}.`);
      loadDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update department.');
    }
  };

  const handleViewHistory = async (item) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const logs = await departmentApi.getHistory(item._id);
      setHistoryLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      toast.error('Failed to load history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Departments</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage the core clinical departments that future doctor management, public discovery, booking, and reporting modules depend on.
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
          Add Department
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by department name"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadDepartments}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading departments...</td>
                </tr>
              )}
              {!loading && departments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No departments found.</td>
                </tr>
              )}
              {departments.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.code || '—'}</td>
                  <td className="px-4 py-3">
                    {item.isFeatured ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Featured
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</td>
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
                            description: item.description || '',
                            code: item.code || '',
                            image: item.image || '',
                            isFeatured: item.isFeatured || false,
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleViewHistory(item)}>
                        <History className="h-3.5 w-3.5" />
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
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingItem ? 'Edit Department' : 'Add Department'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Department Name">
                <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
              </Field>
              <Field label="Code">
                <input type="text" value={form.code} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
              <Field label="Display Image URL">
                <input type="text" value={form.image} onChange={(e) => setForm((c) => ({ ...c, image: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>

            <Field label="Description" className="mt-4">
              <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="min-h-[120px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
            </Field>

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((c) => ({ ...c, isFeatured: e.target.checked }))} />
              Show this department in featured public content
            </label>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Department'}</Button>
            </div>
          </form>
        </div>
      )}
      {historyItem && (
        <DepartmentHistoryModal
          item={historyItem}
          logs={historyLogs}
          loading={loadingHistory}
          onClose={() => setHistoryItem(null)}
        />
      )}
    </motion.section>
  );
}

function DepartmentHistoryModal({ item, logs, loading, onClose }) {
  const getActionBadge = (action) => {
    const colors = {
      department_created: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      department_updated: 'bg-blue-100 text-blue-700 border-blue-200',
      department_activated: 'bg-green-100 text-green-700 border-green-200',
      department_deactivated: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = {
      department_created: 'Created',
      department_updated: 'Updated',
      department_activated: 'Activated',
      department_deactivated: 'Deactivated',
    };
    return (
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[action] || 'bg-slate-100 text-slate-700'}`}>
        {labels[action] || action.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Audit History</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{item.name} ({item.code || 'No Code'})</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">✕</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
               <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
               <p className="text-sm text-muted-foreground font-medium">Retrieving audit trail...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
               <p className="text-sm text-muted-foreground">No history records found for this department.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="group relative flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-semibold text-foreground">{log.actorName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded font-bold">{log.actorRole}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 text-[11px]">
                         {Object.entries(log.details).map(([key, value]) => (
                           <div key={key} className="truncate">
                             <span className="font-semibold text-muted-foreground uppercase mr-1">{key}:</span>
                             <span className="text-foreground">{String(value)}</span>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border px-6 py-4 flex justify-end">
           <Button onClick={onClose} variant="outline" className="rounded-xl">Close History</Button>
        </div>
      </div>
    </div>
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
