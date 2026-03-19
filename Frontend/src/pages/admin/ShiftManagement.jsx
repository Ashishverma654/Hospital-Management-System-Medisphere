import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { shiftApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const SHIFT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'on-call', label: 'On-Call' },
  { value: 'custom', label: 'Custom' },
  { value: 'morning', label: 'Morning (Legacy)' },
  { value: 'afternoon', label: 'Afternoon (Legacy)' },
  { value: 'evening', label: 'Evening (Legacy)' },
  { value: 'night', label: 'Night (Legacy)' },
];

const initialForm = {
  name: '',
  shiftType: 'custom',
  startTime: '',
  endTime: '',
  code: '',
  description: '',
  isActive: true,
};

export default function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  const shiftTypeLabel = (value) => {
    const match = SHIFT_TYPES.find((type) => type.value === value);
    if (match) return match.label.replace(' (Legacy)', '');
    if (!value) return 'Custom';
    return value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const shiftSuggestion = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (name === 'morning') return { start: '06:00', end: '14:00' };
    if (name === 'evening') return { start: '14:00', end: '22:00' };
    if (name === 'night') return { start: '22:00', end: '06:00' };
    return null;
  }, [form.name]);

  useEffect(() => {
    if (!shiftSuggestion) return;
    setForm((current) => ({
      ...current,
      startTime: current.startTime || shiftSuggestion.start,
      endTime: current.endTime || shiftSuggestion.end,
    }));
  }, [shiftSuggestion]);

  useEffect(() => {
    if (codeTouched) return;
    const trimmed = form.name.trim();
    if (!trimmed) {
      setForm((current) => ({ ...current, code: current.code || '' }));
      return;
    }
    const abbr = trimmed.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'GEN';
    setForm((current) => ({
      ...current,
      code: current.code || `SHIFT-${abbr}`,
    }));
  }, [form.name, codeTouched]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const data = await shiftApi.getAll({
        search,
        isActive: filterStatus || undefined,
        page: 1,
        limit: 50,
      });
      setShifts(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [search, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
    setCodeTouched(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.startTime || !form.endTime) {
      return toast.error('Name, start time, and end time are required.');
    }

    setSaving(true);
    try {
      if (editingItem) {
        await shiftApi.update(editingItem._id || editingItem.id, form);
        toast.success('Shift updated successfully.');
      } else {
        await shiftApi.create(form);
        toast.success('Shift created successfully.');
      }
      resetForm();
      loadShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save shift.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shift) => {
    if (!shift?._id && !shift?.id) return;
    try {
      await shiftApi.remove(shift._id || shift.id);
      toast.success('Shift deleted successfully.');
      loadShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete shift.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Staff Scheduling</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Shift management</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Define the shift library used across nurse duty allocations and ward coverage.
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
          Add Shift
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shift name"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadShifts}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Shift</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Timing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading shifts...</td>
                </tr>
              )}
              {!loading && shifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No shifts found.</td>
                </tr>
              )}
              {shifts.map((shift) => (
                <tr key={shift._id || shift.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{shift.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shiftTypeLabel(shift.shiftType)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shift.startTime} - {shift.endTime}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shift.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {shift.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{shift.updatedAt ? new Date(shift.updatedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(shift);
                          setForm({
                            name: shift.name || '',
                            shiftType: shift.shiftType || 'custom',
                            startTime: shift.startTime || '',
                            endTime: shift.endTime || '',
                            code: shift.code || '',
                            description: shift.description || '',
                            isActive: shift.isActive ?? true,
                          });
                          setCodeTouched(Boolean(shift.code));
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(shift)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
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
              <h3 className="text-xl font-semibold text-foreground">{editingItem ? 'Edit Shift' : 'Add Shift'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Shift Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </Field>
              <Field label="Shift Type">
                <select
                  value={form.shiftType}
                  onChange={(e) => setForm((c) => ({ ...c, shiftType: e.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                >
                  {SHIFT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Shift Code (optional)">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => {
                    setCodeTouched(true);
                    setForm((c) => ({ ...c, code: e.target.value }));
                  }}
                  placeholder="SHIFT-MOR"
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                />
              </Field>
              <Field label="Description (optional)">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  className="min-h-[96px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                />
              </Field>
              <Field label="Start Time">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((c) => ({ ...c, startTime: e.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </Field>
              <Field label="End Time">
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((c) => ({ ...c, endTime: e.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </Field>
            </div>

            {shiftSuggestion && (
              <p className="mt-3 rounded-2xl border border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                Suggested timing for {form.name.trim()}: {shiftSuggestion.start} – {shiftSuggestion.end} (editable)
              </p>
            )}

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
              />
              Shift is active
            </label>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Shift'}
              </Button>
            </div>
          </form>
        </div>
      )}
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
