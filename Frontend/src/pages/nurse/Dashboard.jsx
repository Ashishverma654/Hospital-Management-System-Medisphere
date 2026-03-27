import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import StaffDutyWidget from '../../components/StaffDutyWidget.jsx';
import StaffDutyCalendar from '../../components/StaffDutyCalendar.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const statCards = [
  ['assignedPatientsCount', 'Assigned Patients'],
  ['pendingTasks', 'Pending Tasks'],
  ['vitalsDueCount', 'Vitals Due'],
  ['urgentEscalations', 'Urgent Escalations'],
];

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [handoverNotes, setHandoverNotes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [dashboardData, assignmentData, patientData, taskData, handoverData] = await Promise.all([
          nurseApi.getDashboard(),
          nurseApi.getAssignments(),
          nurseApi.getAssignedPatients(),
          nurseApi.getTasks(),
          nurseApi.getHandover(),
        ]);
        if (!isMounted) return;
        setStats(dashboardData);
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
        setAssignedPatients(Array.isArray(patientData) ? patientData : []);
        setTasks(Array.isArray(taskData) ? taskData : []);
        setHandoverNotes(Array.isArray(handoverData) ? handoverData : []);
      } catch (error) {
        if (isMounted) {
          toast.error(error.response?.data?.message || 'Failed to load nurse dashboard.');
        }
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const upcomingAssignments = assignments.filter((assignment) => assignment.status !== 'active').slice(0, 4);

  const openTasks = tasks.filter((task) => task.status !== 'completed').slice(0, 6);
  const priorityHandovers = handoverNotes.slice(0, 5);
  const patientCards = assignedPatients.slice(0, 6);
  const latestPrescriptions = assignedPatients.filter((patient) => patient.activePrescription).slice(0, 5);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Nursing Station</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Nurse dashboard</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Track your current shift, assigned patients, vitals workload, and urgent bedside care updates from one workspace.
        </p>
      </div>

      <StaffDutyWidget />
      <StaffDutyCalendar />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([key, label]) => (
          <article key={key} className="rounded-xl bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <h3 className="mt-2 text-3xl font-semibold text-foreground">{stats?.[key] ?? '—'}</h3>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Duty Context</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Assigned ward</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                {stats?.assignedWard?.name || 'No active ward assignment'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats?.assignedWard?.wardNumber ? `Ward ${stats.assignedWard.wardNumber}` : 'Ward details will appear here when assigned.'}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Current shift</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                {stats?.currentShift?.name || 'No active shift'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats?.currentShift?.startTime && stats?.currentShift?.endTime
                  ? `${stats.currentShift.startTime} - ${stats.currentShift.endTime}`
                  : 'Shift timing will appear here when available.'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Quick Actions</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(stats?.quickActions || []).map((action) => (
                <Button key={action.path} variant="outline" onClick={() => navigate(action.path)}>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Shift Visibility</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">Current and upcoming assignments</h3>

          <div className="mt-4 space-y-3">
            {currentAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-medium text-foreground">
                  {assignment.shift?.name || 'Active shift'} {assignment.ward?.name ? `• ${assignment.ward.name}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {assignment.patient?.name
                    ? `Patient: ${assignment.patient.name} (${assignment.patient.patientId || 'No patient ID'})`
                    : 'Ward-level assignment'}
                </p>
              </div>
            ))}

            {upcomingAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">
                  {assignment.shift?.name || 'Scheduled shift'} {assignment.ward?.name ? `• ${assignment.ward.name}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Starts {assignment.assignmentStart ? new Date(assignment.assignmentStart).toLocaleString() : 'TBD'}
                </p>
              </div>
            ))}

            {assignments.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No nurse assignments are available yet.
              </p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Assigned Patients</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Current care list</h3>
            </div>
            <Button variant="outline" onClick={() => navigate('/employee/nurse/patients')}>View all</Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {patientCards.map((patient) => (
              <div key={patient.id} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">{patient.name || 'Assigned patient'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.patientId ? `ID ${patient.patientId}` : 'No patient ID'} • {patient.age ? `${patient.age}y` : 'Age N/A'} • {patient.gender || '—'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ward {patient.ward?.wardNumber || '—'} • {patient.bed?.bedNumber ? `Bed ${patient.bed.bedNumber}` : 'Bed pending'}
                </p>
              </div>
            ))}
            {assignedPatients.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No assigned patients yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Open Tasks</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Tasks requiring follow-up</h3>
            </div>
            <Button variant="outline" onClick={() => navigate('/employee/nurse/tasks')}>Manage tasks</Button>
          </div>

          <div className="mt-4 space-y-3">
            {openTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">{task.taskType || 'Nursing task'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.patient?.name ? `Patient: ${task.patient.name}` : 'Ward task'} • {task.status}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {task.dueAt ? new Date(task.dueAt).toLocaleString() : 'TBD'}
                </p>
              </div>
            ))}
            {openTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No open nursing tasks right now.</p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Latest Prescriptions</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">Doctor instructions at a glance</h3>
          <div className="mt-4 space-y-3">
            {latestPrescriptions.map((patient) => (
              <div key={patient.id} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">{patient.name || 'Patient'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.activePrescription?.diagnosis || 'Prescription'} • {patient.ward?.name || 'Ward'} {patient.bed?.bedNumber ? `• Bed ${patient.bed.bedNumber}` : ''}
                </p>
                {patient.activePrescription?.followUpDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Follow-up: {new Date(patient.activePrescription.followUpDate).toLocaleDateString()}
                  </p>
                )}
                {patient.activePrescription?.admissionRecommended && (
                  <p className="mt-2 inline-flex items-center rounded-full bg-amber-200/40 px-3 py-1 text-xs font-semibold text-amber-800">
                    Admission recommended
                  </p>
                )}
              </div>
            ))}
            {latestPrescriptions.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent prescriptions for your assigned patients.</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Medication summary</p>
          <div className="mt-4 space-y-3">
            {latestPrescriptions.map((patient) => (
              <div key={`${patient.id}-meds`} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">{patient.name || 'Patient'}</p>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {(patient.medicationSummary || []).slice(0, 3).map((med, index) => (
                    <p key={`${patient.id}-med-${index}`}>
                      {med.name} • {med.dosage || 'Dose'} • {med.frequency || 'Frequency'}
                    </p>
                  ))}
                  {(patient.medicationSummary || []).length === 0 && (
                    <p>No medicines listed yet.</p>
                  )}
                </div>
              </div>
            ))}
            {latestPrescriptions.length === 0 && (
              <p className="text-sm text-muted-foreground">Medication details will appear here once prescriptions are issued.</p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Handover Notes</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Latest shift handovers</h3>
            </div>
            <Button variant="outline" onClick={() => navigate('/employee/nurse/handover')}>Open handover</Button>
          </div>
          <div className="mt-4 space-y-3">
            {priorityHandovers.map((note) => (
              <div key={note.id} className="rounded-xl border border-border p-4">
                <p className="font-medium text-foreground">{note.summary || 'Handover note'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {note.patient?.name ? `Patient: ${note.patient.name}` : note.ward?.name ? `Ward: ${note.ward.name}` : 'General'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Updated recently'}
                </p>
              </div>
            ))}
            {handoverNotes.length === 0 && (
              <p className="text-sm text-muted-foreground">No handover notes recorded yet.</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Care Priorities</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Vitals due</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.vitalsDueCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Urgent escalations logged today</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.urgentEscalations ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Pending nursing tasks</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.pendingTasks ?? 0}</p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Recent Vitals</p>
        <div className="mt-4 space-y-3">
          {(stats?.recentVitals || []).map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{entry.patientName || 'Assigned patient'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    BP {entry.systolicBp || '—'}/{entry.diastolicBp || '—'} • Pulse {entry.pulse || '—'} • Temp {entry.temperature || '—'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : 'No time'}
                </span>
              </div>
            </div>
          ))}
          {stats?.recentVitals?.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent vitals have been recorded for your assigned patients.</p>
          )}
        </div>
      </article>
    </motion.section>
  );
}
