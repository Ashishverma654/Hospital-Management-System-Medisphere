import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Users, Stethoscope, UserCog, CalendarCheck, ArrowRight } from 'lucide-react';
import { adminApi } from '../../services/apiServices.js';
import { getRoleLabel } from '../../auth/constants.js';
import StatCard from '../../components/StatCard.jsx';
import { SkeletonCard, SkeletonList } from '../../components/ui/skeleton.jsx';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const roleCountLabels = [
  ['totalAdmins', 'Admins'],
  ['totalSubadmins', 'Sub Admins'],
  ['totalDoctors', 'Doctors'],
  ['totalNurses', 'Nurses'],
  ['totalReceptionists', 'Receptionists'],
  ['totalLabTechs', 'Lab Technicians'],
  ['totalPharmacists', 'Pharmacists'],
];

export default function GovernanceDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        setStats(await adminApi.getDashboardStats());
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="doccure-card p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Governance Hub</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{getRoleLabel(user?.role)} Operations Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Live workforce oversight, patient volume, and system-level controls.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Link to="/employee" className="hover:text-foreground">Employee</Link>
              <span>/</span>
              <span className="text-foreground font-semibold">Dashboard</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="doccure-chip">Organization health</span>
            <span className="doccure-chip">Realtime activity</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Main stat cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Patients" value={stats?.totalPatients} icon={Users} variant="default" />
          <StatCard title="Total Doctors" value={stats?.totalDoctors} icon={Stethoscope} variant="info" />
          <StatCard title="Total Employees" value={stats?.totalEmployees} icon={UserCog} variant="success" />
          <StatCard title="Today's Appointments" value={stats?.todayPatientActivity?.appointments} icon={CalendarCheck} variant="warning" />
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        {/* Quick actions + role breakdown */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="doccure-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Quick Actions</p>
            <h3 className="mt-1 text-xl font-bold text-foreground">Operational shortcuts</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(stats?.quickActions || []).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110"
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Role breakdown */}
          <div className="doccure-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Staff Breakdown</p>
            <h3 className="mt-1 text-xl font-bold text-foreground">Workforce by role</h3>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {roleCountLabels.map(([key, label]) => (
                <motion.div key={key} variants={staggerItem} className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/60">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{loading ? '...' : stats?.[key] ?? 0}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="doccure-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Activity Feed</p>
          <h3 className="mt-1 text-xl font-bold text-foreground">Recent governance actions</h3>
          <div className="mt-4 space-y-3">
            {loading ? <SkeletonList count={4} /> : (
              <>
                {(stats?.recentActivity || []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No recent audit activity yet.
                  </div>
                )}
                {(stats?.recentActivity || []).map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.creatorName}</p>
                      <span className="text-xs text-muted-foreground">({getRoleLabel(item.creatorRole)})</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.action} {item.createdUserName} ({getRoleLabel(item.createdUserRole)})
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/70">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Doctor spotlight */}
      <div className="doccure-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Doctor Spotlight</p>
            <h3 className="mt-1 text-xl font-bold text-foreground">Recently active doctors</h3>
          </div>
          <Link to="/employee/doctors" className="text-sm font-semibold text-primary hover:underline">Manage doctors</Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(stats?.recentUsers || [])
            .filter((item) => item.role === 'doctor')
            .slice(0, 6)
            .map((item) => (
              <div key={item.id} className="doccure-card-soft p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-border bg-muted/60 flex items-center justify-center font-semibold text-foreground">
                    {item.name?.charAt(0) || 'D'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.employeeId || 'No ID'}</p>
                    <p className="mt-2 text-xs text-muted-foreground capitalize">{item.role}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          {!loading && (stats?.recentUsers || []).filter((item) => item.role === 'doctor').length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No doctor cards available yet. As doctors are onboarded, they will appear here automatically.
            </div>
          )}
          {loading && (
            <>
              <div className="doccure-card-soft p-5 animate-pulse"><div className="h-20 rounded-xl bg-muted" /></div>
              <div className="doccure-card-soft p-5 animate-pulse"><div className="h-20 rounded-xl bg-muted" /></div>
              <div className="doccure-card-soft p-5 animate-pulse"><div className="h-20 rounded-xl bg-muted" /></div>
            </>
          )}
        </div>
      </div>

      {/* Recent users table */}
      <div className="doccure-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Latest Accounts</p>
        <h3 className="mt-1 text-xl font-bold text-foreground">Newest employee accounts</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Employee ID</th>
                <th className="px-3 py-3 font-medium">Created By</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentUsers || []).map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-3 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{getRoleLabel(item.role)}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.employeeId || '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{item.createdBy?.name || 'System'}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
