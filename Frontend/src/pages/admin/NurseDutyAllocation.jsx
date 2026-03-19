import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, departmentApi, nurseAssignmentApi, shiftApi, wardApi, adminApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialForm = {
  nurseUserId: '',
  wardId: '',
  shiftId: '',
  patientId: '',
  assignmentStart: '',
  assignmentEnd: '',
  status: 'scheduled',
};

export default function NurseDutyAllocation() {
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [wards, setWards] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterNurse, setFilterNurse] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [formErrors, setFormErrors] = useState({});

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll({ isActive: true });
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    }
  };

  const loadWards = async () => {
    try {
      const data = await wardApi.getAll({
        isActive: true,
        departmentId: filterDepartment || undefined,
      });
      setWards(Array.isArray(data) ? data : []);
    } catch {
      setWards([]);
    }
  };

  const loadShifts = async () => {
    try {
      const data = await shiftApi.getAll({ isActive: true, page: 1, limit: 100 });
      setShifts(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setShifts([]);
    }
  };

  const loadNurses = async () => {
    try {
      const data = await adminApi.getAllUsers({ role: 'nurse', isActive: true, page: 1, limit: 200 });
      setNurses(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setNurses([]);
    }
  };

  const loadPatientsForWard = async (wardId) => {
    if (!wardId) {
      setPatients([]);
      return;
    }
    try {
      const beds = await bedApi.getAll({ wardId, status: 'occupied' });
      const list = (Array.isArray(beds) ? beds : [])
        .map((bed) => bed.patient)
        .filter(Boolean);
      setPatients(list);
    } catch {
      setPatients([]);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await nurseAssignmentApi.getAll({
        nurseUserId: filterNurse || undefined,
        wardId: filterWard || undefined,
        shiftId: filterShift || undefined,
        status: filterStatus || undefined,
        startDate: filterStart || undefined,
        endDate: filterEnd || undefined,
        page,
        limit: 12,
      });
      setAssignments(Array.isArray(data?.items) ? data.items : []);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadShifts();
    loadNurses();
  }, []);

  useEffect(() => {
    loadWards();
  }, [filterDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAssignments();
  }, [filterNurse, filterWard, filterShift, filterStatus, filterStart, filterEnd, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filterWard && !wards.some((ward) => ward._id === filterWard)) {
      setFilterWard('');
    }
  }, [filterDepartment, wards]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPatientsForWard(form.wardId);
  }, [form.wardId]);

  useEffect(() => {
    if (!form.shiftId) return;
    const selectedShift = shifts.find((shift) => shift._id === form.shiftId || shift.id === form.shiftId);
    if (!selectedShift) return;
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const formatDateTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${hours}:${minutes}`;
    };
    setForm((current) => ({
      ...current,
      assignmentStart: current.assignmentStart || formatDateTime(selectedShift.startTime),
      assignmentEnd: current.assignmentEnd || formatDateTime(selectedShift.endTime),
    }));
  }, [form.shiftId, shifts]);

  const filteredAssignments = assignments.filter((assignment) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return [
      assignment.nurse?.name,
      assignment.ward?.name,
      assignment.shift?.name,
      assignment.patient?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
  };

  const openEdit = (assignment) => {
    setEditingItem(assignment);
    setForm({
      nurseUserId: assignment.nurse?.id || '',
      wardId: assignment.ward?.id || '',
      shiftId: assignment.shift?.id || '',
      patientId: assignment.patient?.id || '',
      assignmentStart: assignment.assignmentStart ? new Date(assignment.assignmentStart).toISOString().slice(0, 16) : '',
      assignmentEnd: assignment.assignmentEnd ? new Date(assignment.assignmentEnd).toISOString().slice(0, 16) : '',
      status: assignment.status || 'scheduled',
    });
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.nurseUserId || !form.wardId || !form.shiftId || !form.assignmentStart) {
      return toast.error('Nurse, ward, shift, and start time are required.');
    }
    if (form.assignmentEnd && new Date(form.assignmentEnd) <= new Date(form.assignmentStart)) {
      return toast.error('Assignment end must be after assignment start.');
    }
    if (form.patientId && !patients.some((patient) => patient.id === form.patientId)) {
      return toast.error('Selected patient does not belong to the selected ward.');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignmentEnd: form.assignmentEnd || undefined,
        patientId: form.patientId || undefined,
      };
      if (editingItem) {
        await nurseAssignmentApi.update(editingItem.id || editingItem._id, payload);
        toast.success('Assignment updated.');
      } else {
        await nurseAssignmentApi.create(payload);
        toast.success('Assignment created.');
      }
      resetForm();
      loadAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save assignment.');
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (assignment) => {
    try {
      await nurseAssignmentApi.remove(assignment.id || assignment._id);
      toast.success('Assignment deleted.');
      loadAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete assignment.');
    }
  };

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const days = [];
    const startWeekday = start.getDay();
    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, assignments: [] });
    }
    for (let day = 1; day <= end.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().slice(0, 10);
      const items = filteredAssignments.filter((assignment) =>
        assignment.assignmentStart?.slice(0, 10) === dateKey
      );
      days.push({ date, assignments: items });
    }
    return days;
  }, [monthCursor, filteredAssignments]);

  const selectedShift = shifts.find((shift) => shift._id === form.shiftId || shift.id === form.shiftId);
  const selectedWard = wards.find((ward) => ward._id === form.wardId || ward.id === form.wardId);

  const validateForm = () => {
    const errors = {};
    if (!form.nurseUserId) errors.nurseUserId = 'Select a nurse.';
    if (!form.shiftId) errors.shiftId = 'Select a shift.';
    if (!form.wardId) errors.wardId = 'Select a ward.';
    if (!form.assignmentStart) errors.assignmentStart = 'Start time is required.';
    if (form.assignmentEnd && new Date(form.assignmentEnd) <= new Date(form.assignmentStart)) {
      errors.assignmentEnd = 'End time must be after start time.';
    }
    if (form.patientId && !patients.some((patient) => patient.id === form.patientId)) {
      errors.patientId = 'Patient must belong to the selected ward.';
    }
    return errors;
  };

  useEffect(() => {
    setFormErrors(validateForm());
  }, [form, patients]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFormInvalid = Object.keys(formErrors).length > 0;

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Nursing Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Staff duty allocation</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Assign nurses to wards and shifts with optional patient coverage, and monitor schedules in list or calendar view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
            List View
          </Button>
          <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} onClick={() => setViewMode('calendar')}>
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
          <Button onClick={() => { setEditingItem(null); setForm(initialForm); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Staff
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search nurse, ward, patient, shift"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(event) => {
            setFilterDepartment(event.target.value);
            setFilterWard('');
          }}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All wards</option>
          {wards.map((ward) => (
            <option key={ward._id} value={ward._id}>{ward.name}</option>
          ))}
        </select>
        <select value={filterNurse} onChange={(event) => setFilterNurse(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All nurses</option>
          {nurses.map((nurse) => (
            <option key={nurse._id} value={nurse._id}>{nurse.name}</option>
          ))}
        </select>
        <select value={filterShift} onChange={(event) => setFilterShift(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All shifts</option>
          {shifts.map((shift) => (
            <option key={shift._id} value={shift._id}>{shift.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button type="button" variant="outline" onClick={loadAssignments}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="rounded-2xl border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary" />
        <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="rounded-2xl border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary" />
      </div>

      {viewMode === 'list' ? (
        <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nurse</th>
                  <th className="px-4 py-3 font-medium">Ward</th>
                  <th className="px-4 py-3 font-medium">Shift</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Timing</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading assignments...</td>
                  </tr>
                )}
                {!loading && filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No assignments found.</td>
                  </tr>
                )}
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-foreground">{assignment.nurse?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{assignment.ward?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{assignment.shift?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{assignment.patient?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {assignment.assignmentStart ? new Date(assignment.assignmentStart).toLocaleString() : '—'}
                      {assignment.assignmentEnd ? ` → ${new Date(assignment.assignmentEnd).toLocaleString()}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-foreground">{assignment.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(assignment)}>Edit</Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => removeAssignment(assignment)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </article>
      ) : (
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Calendar View</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                {monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setMonthCursor(new Date())}>
                <Calendar className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-2 py-1 text-center font-semibold">{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div key={`${day.date?.toISOString() || 'empty'}-${index}`} className="min-h-[110px] rounded-xl border border-border bg-muted/20 p-2">
                {day.date ? (
                  <>
                    <p className="text-xs font-semibold text-foreground">{day.date.getDate()}</p>
                    <div className="mt-2 space-y-1">
                      {day.assignments.slice(0, 2).map((assignment) => (
                        <div key={assignment.id} className="rounded-lg bg-card px-2 py-1 text-[11px] text-muted-foreground">
                          <p className="font-semibold text-foreground">{assignment.nurse?.name || 'Nurse'}</p>
                          <p>{assignment.ward?.name || 'Ward'} • {assignment.shift?.name || 'Shift'}</p>
                        </div>
                      ))}
                      {day.assignments.length > 2 && (
                        <p className="text-[10px] text-muted-foreground">+{day.assignments.length - 2} more</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            ))}
          </div>
        </article>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="w-full max-w-3xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingItem ? 'Edit Assignment' : 'Assign Staff Duty'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {nurses.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                No available nurses found. Please create nurse profiles before assigning duty.
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nurse">
                <select value={form.nurseUserId} onChange={(e) => setForm((c) => ({ ...c, nurseUserId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select nurse</option>
                  {nurses.map((nurse) => (
                    <option key={nurse._id} value={nurse._id}>{nurse.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Shift">
                <select value={form.shiftId} onChange={(e) => setForm((c) => ({ ...c, shiftId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select shift</option>
                  {shifts.map((shift) => (
                    <option key={shift._id} value={shift._id}>{shift.name} ({shift.startTime}-{shift.endTime})</option>
                  ))}
                </select>
                {formErrors.shiftId && <p className="mt-1 text-xs text-destructive">{formErrors.shiftId}</p>}
                {selectedShift && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Shift timing: {selectedShift.startTime} – {selectedShift.endTime} • {selectedShift.shiftType || 'custom'}
                  </p>
                )}
              </Field>
              <Field label="Ward">
                <select value={form.wardId} onChange={(e) => setForm((c) => ({ ...c, wardId: e.target.value, patientId: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>
                      {ward.name}{ward.departmentId?.name ? ` • ${ward.departmentId.name}` : ''}
                    </option>
                  ))}
                </select>
                {formErrors.wardId && <p className="mt-1 text-xs text-destructive">{formErrors.wardId}</p>}
                {selectedWard && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ward details: {selectedWard.wardNumber || '—'} • {selectedWard.departmentId?.name || 'No department'}
                  </p>
                )}
              </Field>
              <Field label="Patient (optional)">
                <select value={form.patientId} onChange={(e) => setForm((c) => ({ ...c, patientId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">No patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.patientId || 'No ID'})
                    </option>
                  ))}
                </select>
                {formErrors.patientId && <p className="mt-1 text-xs text-destructive">{formErrors.patientId}</p>}
              </Field>
              <Field label="Assignment Start">
                <input type="datetime-local" value={form.assignmentStart} onChange={(e) => setForm((c) => ({ ...c, assignmentStart: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
                {formErrors.assignmentStart && <p className="mt-1 text-xs text-destructive">{formErrors.assignmentStart}</p>}
              </Field>
              <Field label="Assignment End (optional)">
                <input type="datetime-local" value={form.assignmentEnd} onChange={(e) => setForm((c) => ({ ...c, assignmentEnd: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                {formErrors.assignmentEnd && <p className="mt-1 text-xs text-destructive">{formErrors.assignmentEnd}</p>}
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
            </div>

            {form.nurseUserId && (
              <div className="mt-4 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Current assignments for this nurse</p>
                {assignments
                  .filter((assignment) => assignment.nurse?.id === form.nurseUserId)
                  .slice(0, 3)
                  .map((assignment) => (
                    <p key={assignment.id}>
                      {assignment.ward?.name || 'Ward'} • {assignment.shift?.name || 'Shift'} • {assignment.assignmentStart
                        ? new Date(assignment.assignmentStart).toLocaleString()
                        : 'Start time pending'}
                    </p>
                  ))}
                {assignments.filter((assignment) => assignment.nurse?.id === form.nurseUserId).length === 0 && (
                  <p>No active assignments found.</p>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving || isFormInvalid}>
                {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Assignment'}
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
