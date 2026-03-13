import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { adminApi } from '../../services/apiServices.js';
import { getRoleLabel } from '../../auth/constants.js';

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
        const data = await adminApi.getDashboardStats();
        setStats(data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load governance dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Governance Dashboard</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">{getRoleLabel(user?.role)} operations center</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          This governance dashboard gives hospital managers a live foundation for workforce oversight, patient volume,
          and system-level controls without crossing into the public portal or employee business workflows.
        </p>
      </div>

      {error && (
        <article className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </article>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Patients" value={stats?.totalPatients} loading={loading} />
        <StatCard label="Total Doctors" value={stats?.totalDoctors} loading={loading} />
        <StatCard label="Total Employees" value={stats?.totalEmployees} loading={loading} />
        <StatCard label="Today's Patient Activity" value={stats?.todayPatientActivity?.appointments} loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Quick Actions</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Operational shortcuts</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(stats?.quickActions || []).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-[1.5rem] bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roleCountLabels.map(([key, label]) => (
              <div key={key} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? '...' : stats?.[key] ?? 0}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent Governance Activity</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Latest actions</h3>
          <div className="mt-5 space-y-3">
            {(stats?.recentActivity || []).length === 0 && !loading && (
              <p className="text-sm text-slate-500">No recent audit activity available yet.</p>
            )}
            {(stats?.recentActivity || []).map((item) => (
              <div key={item.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {item.creatorName} <span className="font-normal text-slate-500">({getRoleLabel(item.creatorRole)})</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.action} {item.createdUserName} ({getRoleLabel(item.createdUserRole)})
                </p>
                <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent User Creation</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">Newest employee accounts</h3>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-3 font-medium">Name</th>
                <th className="px-2 py-3 font-medium">Role</th>
                <th className="px-2 py-3 font-medium">Employee ID</th>
                <th className="px-2 py-3 font-medium">Created By</th>
                <th className="px-2 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentUsers || []).map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-2 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-2 py-3 text-slate-600">{getRoleLabel(item.role)}</td>
                  <td className="px-2 py-3 font-mono text-xs text-slate-500">{item.employeeId || '—'}</td>
                  <td className="px-2 py-3 text-slate-600">{item.createdBy?.name || 'System'}</td>
                  <td className="px-2 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-slate-500">Loading dashboard data...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-3 text-3xl font-semibold text-slate-900">{loading ? '...' : value ?? 0}</h3>
    </article>
  );
}
