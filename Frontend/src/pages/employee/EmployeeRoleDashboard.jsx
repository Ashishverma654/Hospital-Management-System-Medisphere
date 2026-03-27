import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import {
  EMPLOYEE_DASHBOARD_META,
  STAFF_MANAGEMENT_ROLES,
  getRoleLabel,
} from '../../auth/constants.js';
import { adminApi } from '../../services/apiServices.js';

export default function EmployeeRoleDashboard({ role }) {
  const user = useSelector((state) => state.auth.user);
  const metadata = EMPLOYEE_DASHBOARD_META[role] || EMPLOYEE_DASHBOARD_META.doctor;
  const canManageUsers = STAFF_MANAGEMENT_ROLES.includes(role);
  const canAccessPatientAdmin = ['superadmin', 'admin'].includes(role);
  const [subadminDashboard, setSubadminDashboard] = useState(null);
  const [subadminLoading, setSubadminLoading] = useState(false);
  const [subadminUpdatedAt, setSubadminUpdatedAt] = useState(null);
  const [subadminError, setSubadminError] = useState('');

  useEffect(() => {
    if (role !== 'subadmin') return;
    const loadDashboard = async () => {
      setSubadminLoading(true);
      setSubadminError('');
      try {
        const data = await adminApi.getSubadminDashboard();
        setSubadminDashboard(data);
        setSubadminUpdatedAt(new Date());
      } catch {
        setSubadminError('Unable to load the subadmin dashboard snapshot. Please refresh.');
      } finally {
        setSubadminLoading(false);
      }
    };
    loadDashboard();
  }, [role]);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {role !== 'subadmin' && (
        <div className="doccure-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{metadata.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">{metadata.title}</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">{metadata.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="doccure-chip">Role access</span>
            <span className="doccure-chip">Daily priorities</span>
          </div>
        </div>
      )}

      {role !== 'subadmin' && (
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard label="Employee" value={user?.name || getRoleLabel(role)} />
          <InfoCard label="Role" value={getRoleLabel(role)} />
          <InfoCard label="Employee ID" value={user?.employeeId || 'Not available'} />
        </div>
      )}

      {role !== 'subadmin' && (
        <div className="grid gap-4 md:grid-cols-3">
          {metadata.highlights.map((highlight) => (
            <article key={highlight} className="doccure-card-soft p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Future Module</p>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{highlight}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This area is reserved as a secure entry point for upcoming employee workflows.
              </p>
            </article>
          ))}
        </div>
      )}

      {role === 'subadmin' && (
        <SubadminDashboard
          loading={subadminLoading}
          error={subadminError}
          data={subadminDashboard}
          updatedAt={subadminUpdatedAt}
          onRefresh={async () => {
            setSubadminLoading(true);
            setSubadminError('');
            try {
              const data = await adminApi.getSubadminDashboard();
              setSubadminDashboard(data);
              setSubadminUpdatedAt(new Date());
            } catch {
              setSubadminError('Unable to load the subadmin dashboard snapshot. Please refresh.');
            } finally {
              setSubadminLoading(false);
            }
          }}
        />
      )}

      {canManageUsers && role !== 'subadmin' && (
        <article className="rounded-2xl bg-gradient-to-br from-[#0de0fe] via-[#09e5ab] to-[#7c83fd] p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-white/80">Access Management</p>
          <h3 className="mt-3 text-2xl font-semibold">Administration shortcuts</h3>
          <p className="mt-2 max-w-2xl text-white/80">
            Open the employee-side governance tools your role is allowed to use without crossing into public or
            patient-facing routes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/employee/manage-roles"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              Open Manage Roles
            </Link>
            {canAccessPatientAdmin && (
              <Link
                to="/employee/patients"
                className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                View Patients
              </Link>
            )}
          </div>
        </article>
      )}
    </motion.section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="doccure-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-foreground">{value}</h3>
    </article>
  );
}

function SubadminDashboard({ loading, error, data, updatedAt, onRefresh }) {
  const patientFlow = data?.patientFlow || {
    total: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    avgWaitMinutes: 0,
  };
  const bedOccupancy = data?.bedOccupancy || {
    total: 0,
    occupied: 0,
    available: 0,
    reserved: 0,
    maintenance: 0,
  };
  const dutyTracker = data?.dutyTracker || { onDuty: 0, offDuty: 0, leave: 0, holiday: 0 };
  const occupancyRate = bedOccupancy.total
    ? Math.round((bedOccupancy.occupied / bedOccupancy.total) * 100)
    : 0;
  const dutyTotal = Object.values(dutyTracker).reduce((sum, value) => sum + value, 0);
  const flowSeries = [
    { label: 'Waiting', value: patientFlow.waiting, className: 'bg-primary/80' },
    { label: 'In consult', value: patientFlow.inConsultation, className: 'bg-secondary' },
    { label: 'Completed', value: patientFlow.completed, className: 'bg-accent' },
  ];
  const flowBars = [
    { label: 'Waiting', value: patientFlow.waiting, tone: 'primary' },
    { label: 'Consult', value: patientFlow.inConsultation, tone: 'secondary' },
    { label: 'Done', value: patientFlow.completed, tone: 'accent' },
    { label: 'Total', value: patientFlow.total, tone: 'muted' },
  ];
  const sparklineValues = flowBars.map((item) => item.value);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Live Operations</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">Subadmin operational snapshot</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time visibility into patient flow, staffing, wards, and bed availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-muted-foreground">Updated {updatedAt.toLocaleTimeString()}</span>
          )}
          <button type="button" onClick={onRefresh} className="doccure-button-outline">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <InfoCard label="Patients Today" value={patientFlow.total} />
        <InfoCard label="Waiting/Arrived" value={patientFlow.waiting} />
        <InfoCard label="In Consultation" value={patientFlow.inConsultation} />
        <InfoCard label="Completed" value={patientFlow.completed} />
        <InfoCard label="Avg Wait (min)" value={patientFlow.avgWaitMinutes} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="doccure-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bed Occupancy</p>
              <h4 className="mt-2 text-lg font-semibold text-foreground">Hospital capacity overview</h4>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {occupancyRate}% occupied
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr]">
            <div className="flex items-center justify-center">
              <DonutChart
                value={bedOccupancy.occupied}
                total={bedOccupancy.total}
                label="Occupied"
                trackLabel="Available"
              />
            </div>
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${occupancyRate}%` }} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniStat label="Total beds" value={bedOccupancy.total} />
                <MiniStat label="Available" value={bedOccupancy.available} />
                <MiniStat label="Occupied" value={bedOccupancy.occupied} />
                <MiniStat label="Reserved" value={bedOccupancy.reserved} />
                <MiniStat label="Maintenance" value={bedOccupancy.maintenance} />
              </div>
            </div>
          </div>
        </div>

        <div className="doccure-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Duty Tracker</p>
          <h4 className="mt-2 text-lg font-semibold text-foreground">Staff availability today</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr]">
            <div className="flex items-center justify-center">
              <DonutChart
                value={dutyTracker.onDuty}
                total={dutyTotal}
                label="On duty"
                trackLabel="Others"
                accentTone="secondary"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniStat label="On Duty" value={dutyTracker.onDuty} />
              <MiniStat label="Off Duty" value={dutyTracker.offDuty} />
              <MiniStat label="Leave" value={dutyTracker.leave} />
              <MiniStat label="Holiday" value={dutyTracker.holiday} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="doccure-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Patient Flow Histogram</p>
          <h4 className="mt-2 text-lg font-semibold text-foreground">Current flow intensity</h4>
          <div className="mt-5">
            <MiniBarChart data={flowBars} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {flowSeries.map((segment) => (
              <span key={segment.label} className="flex items-center gap-2 rounded-full border border-border px-2.5 py-1">
                <span className={`h-2 w-2 rounded-full ${segment.className}`} />
                {segment.label}
              </span>
            ))}
          </div>
        </div>
        <div className="doccure-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Flow Trend</p>
          <h4 className="mt-2 text-lg font-semibold text-foreground">Today’s operational pulse</h4>
          <div className="mt-6">
            <SparklineChart values={sparklineValues} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Avg wait" value={`${patientFlow.avgWaitMinutes} min`} />
            <MiniStat label="Queue load" value={patientFlow.waiting} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="doccure-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ward Status</p>
          <h4 className="mt-2 text-lg font-semibold text-foreground">Live ward availability</h4>
          <div className="mt-4 space-y-3">
            {loading && (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Loading ward status...
              </div>
            )}
            {!loading && (data?.wardStatus || []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No ward activity to show yet.
              </div>
            )}
            {!loading &&
              (data?.wardStatus || []).slice(0, 6).map((ward) => (
                <div key={ward.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ward.name}</p>
                      <p className="text-xs text-muted-foreground">{ward.department}</p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {ward.available}/{ward.total} available
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${ward.total ? Math.round((ward.occupied / ward.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-2 py-1">Occupied {ward.occupied}</span>
                    <span className="rounded-full border border-border px-2 py-1">Reserved {ward.reserved}</span>
                    <span className="rounded-full border border-border px-2 py-1">Maintenance {ward.maintenance}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="doccure-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Operational Alerts</p>
          <h4 className="mt-2 text-lg font-semibold text-foreground">Real-time flags</h4>
          <div className="mt-4 space-y-3">
            {loading && (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Loading alerts...
              </div>
            )}
            {!loading && (data?.alerts || []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No critical alerts right now.
              </div>
            )}
            {!loading &&
              (data?.alerts || []).map((alert, index) => (
                <div key={`${alert.title}-${index}`} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                      {alert.priority || 'info'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{alert.message}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="doccure-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick Actions</p>
        <h4 className="mt-2 text-lg font-semibold text-foreground">Jump into delegated tools</h4>
        <div className="mt-4 flex flex-wrap gap-3">
          {(data?.quickActions || []).map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DonutChart({ value, total, label, trackLabel, accentTone = 'primary' }) {
  const safeTotal = total || 0;
  const safeValue = Math.min(value || 0, safeTotal);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = safeTotal ? (safeValue / safeTotal) * circumference : 0;
  const track = circumference - progress;
  const accentStroke = accentTone === 'secondary' ? 'hsl(var(--secondary))' : 'hsl(var(--primary))';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="transparent"
          stroke={accentStroke}
          strokeWidth="10"
          strokeDasharray={`${progress} ${track}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{safeTotal ? Math.round((safeValue / safeTotal) * 100) : 0}%</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{trackLabel}</p>
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {data.map((item) => {
        const height = Math.round((item.value / maxValue) * 100);
        const toneClass = {
          primary: 'bg-primary',
          secondary: 'bg-secondary',
          accent: 'bg-accent',
          muted: 'bg-muted',
        }[item.tone];
        return (
          <div key={item.label} className="flex flex-col items-center gap-3">
            <div className="flex h-28 w-10 items-end rounded-full bg-muted/50 p-1">
              <div className={`w-full rounded-full ${toneClass}`} style={{ height: `${height}%` }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SparklineChart({ values }) {
  const padded = values.length ? values : [0, 0, 0, 0];
  const maxValue = Math.max(1, ...padded);
  const points = padded
    .map((value, index) => {
      const x = (index / (padded.length - 1)) * 260;
      const y = 60 - (value / maxValue) * 50;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height="80" viewBox="0 0 260 70">
      <polyline
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polyline
        fill="none"
        stroke="hsl(var(--primary) / 0.2)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
