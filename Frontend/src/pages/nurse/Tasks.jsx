import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialTaskForm = {
  patientId: '',
  wardId: '',
  taskType: 'vitals recording',
  dueAt: '',
  notes: '',
};

export default function NurseTasks() {
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', patientId: '', type: '' });
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find((patient) => patient.id === taskForm.patientId) || null;

  const load = async () => {
    try {
      const [patientData, taskData] = await Promise.all([
        nurseApi.getAssignedPatients(),
        nurseApi.getTasks(filters),
      ]);
      const patientList = Array.isArray(patientData) ? patientData : [];
      setPatients(patientList);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load nursing tasks.');
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.patientId, filters.type]);

  useEffect(() => {
    if (!taskForm.patientId && patients.length) {
      setTaskForm((current) => ({
        ...current,
        patientId: patients[0].id,
        wardId: patients[0].ward?.id || '',
      }));
    }
  }, [patients, taskForm.patientId]);

  const taskStats = useMemo(
    () => ({
      pending: tasks.filter((task) => task.status === 'pending').length,
      inProgress: tasks.filter((task) => task.status === 'inProgress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
      missed: tasks.filter((task) => task.status === 'missed').length,
    }),
    [tasks]
  );

  const createTask = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await nurseApi.createTask(taskForm);
      toast.success('Nursing task created.');
      setTaskForm((current) => ({ ...initialTaskForm, patientId: current.patientId, wardId: current.wardId }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create nursing task.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await nurseApi.updateTask(taskId, { status });
      toast.success('Task updated.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update nursing task.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Nursing Workflow</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Task list</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Manage bedside tasks for medicine support, vitals recording, observation rounds, discharge prep, and doctor-round assistance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(taskStats).map(([key, value]) => (
          <article key={key} className="rounded-xl bg-card p-6 shadow-sm">
            <p className="text-sm capitalize text-muted-foreground">{key}</p>
            <h3 className="mt-2 text-3xl font-semibold text-foreground">{value}</h3>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Create Task</p>
          <form className="mt-4 space-y-4" onSubmit={createTask}>
            <select
              value={taskForm.patientId}
              onChange={(event) => {
                const patient = patients.find((item) => item.id === event.target.value);
                setTaskForm((current) => ({
                  ...current,
                  patientId: event.target.value,
                  wardId: patient?.ward?.id || '',
                }));
              }}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId || 'No ID'})
                </option>
              ))}
            </select>
            <select
              value={taskForm.taskType}
              onChange={(event) => setTaskForm((current) => ({ ...current, taskType: event.target.value }))}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="medicine administration">Medicine administration</option>
              <option value="vitals recording">Vitals recording</option>
              <option value="patient observation">Patient observation</option>
              <option value="lab preparation support">Lab preparation support</option>
              <option value="discharge prep">Discharge prep</option>
              <option value="doctor round assistance">Doctor round assistance</option>
            </select>
            <input
              type="datetime-local"
              value={taskForm.dueAt}
              onChange={(event) => setTaskForm((current) => ({ ...current, dueAt: event.target.value }))}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={taskForm.notes}
              onChange={(event) => setTaskForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Task instructions or context"
              rows={4}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {selectedPatient && (
              <div className="rounded-xl bg-muted/50 p-4 text-sm text-foreground">
                Creating task for {selectedPatient.name}
                {selectedPatient.ward?.name ? ` in ${selectedPatient.ward.name}` : ''}.
              </div>
            )}
            <Button disabled={saving || !taskForm.patientId} type="submit" className="w-full">
              {saving ? 'Creating...' : 'Create nursing task'}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="inProgress">In progress</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
            <select value={filters.patientId} onChange={(event) => setFilters((current) => ({ ...current, patientId: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            <input value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} placeholder="Filter by task type" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>

          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold capitalize text-foreground">{task.taskType}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.patient?.name || 'No patient'} {task.ward?.name ? `• ${task.ward.name}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Due {task.dueAt ? new Date(task.dueAt).toLocaleString() : 'Not scheduled'}
                    </p>
                    {task.notes && <p className="mt-2 text-sm text-muted-foreground">{task.notes}</p>}
                  </div>
                  <StatusBadge status={task.status}>{task.status}</StatusBadge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => updateStatus(task.id, 'pending')}>Pending</Button>
                  <Button variant="outline" onClick={() => updateStatus(task.id, 'inProgress')}>In progress</Button>
                  <Button variant="outline" onClick={() => updateStatus(task.id, 'completed')}>Completed</Button>
                  <Button variant="outline" onClick={() => updateStatus(task.id, 'missed')}>Missed</Button>
                </div>
              </article>
            ))}
            {tasks.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No nursing tasks are available for the current filters.
              </p>
            )}
          </div>
        </section>
      </div>
    </motion.section>
  );
}
