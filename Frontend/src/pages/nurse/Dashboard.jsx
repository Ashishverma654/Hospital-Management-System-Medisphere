import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

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

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, assignmentData] = await Promise.all([
          nurseApi.getDashboard(),
          nurseApi.getAssignments(),
        ]);
        setStats(dashboardData);
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load nurse dashboard.');
      }
    };

    load();
  }, []);

  const currentAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const upcomingAssignments = assignments.filter((assignment) => assignment.status !== 'active').slice(0, 4);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Nursing Station</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Nurse dashboard</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Track your current shift, assigned patients, vitals workload, and urgent bedside care updates from one workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([key, label]) => (
          <article key={key} className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">{stats?.[key] ?? '—'}</h3>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Duty Context</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Assigned ward</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {stats?.assignedWard?.name || 'No active ward assignment'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {stats?.assignedWard?.wardNumber ? `Ward ${stats.assignedWard.wardNumber}` : 'Ward details will appear here when assigned.'}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Current shift</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {stats?.currentShift?.name || 'No active shift'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {stats?.currentShift?.startTime && stats?.currentShift?.endTime
                  ? `${stats.currentShift.startTime} - ${stats.currentShift.endTime}`
                  : 'Shift timing will appear here when available.'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Quick Actions</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(stats?.quickActions || []).map((action) => (
                <Button key={action.path} variant="outline" onClick={() => navigate(action.path)}>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Shift Visibility</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Current and upcoming assignments</h3>

          <div className="mt-4 space-y-3">
            {currentAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-medium text-slate-900">
                  {assignment.shift?.name || 'Active shift'} {assignment.ward?.name ? `• ${assignment.ward.name}` : ''}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {assignment.patient?.name
                    ? `Patient: ${assignment.patient.name} (${assignment.patient.patientId || 'No patient ID'})`
                    : 'Ward-level assignment'}
                </p>
              </div>
            ))}

            {upcomingAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="font-medium text-slate-900">
                  {assignment.shift?.name || 'Scheduled shift'} {assignment.ward?.name ? `• ${assignment.ward.name}` : ''}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Starts {assignment.assignmentStart ? new Date(assignment.assignmentStart).toLocaleString() : 'TBD'}
                </p>
              </div>
            ))}

            {assignments.length === 0 && (
              <p className="rounded-[1.25rem] border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No nurse assignments are available yet.
              </p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Recent Vitals</p>
          <div className="mt-4 space-y-3">
            {(stats?.recentVitals || []).map((entry) => (
              <div key={entry.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{entry.patientName || 'Assigned patient'}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      BP {entry.systolicBp || '—'}/{entry.diastolicBp || '—'} • Pulse {entry.pulse || '—'} • Temp {entry.temperature || '—'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : 'No time'}
                  </span>
                </div>
              </div>
            ))}
            {stats?.recentVitals?.length === 0 && (
              <p className="text-sm text-slate-500">No recent vitals have been recorded for your assigned patients.</p>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Care Priorities</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.25rem] border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Vitals due</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.vitalsDueCount ?? 0}</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Urgent escalations logged today</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.urgentEscalations ?? 0}</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Pending nursing tasks</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.pendingTasks ?? 0}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
