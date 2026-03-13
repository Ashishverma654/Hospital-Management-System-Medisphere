import { useEffect, useState } from 'react';
import { adminApi } from '../../services/apiServices.js';
import { getRoleLabel } from '../../auth/constants.js';

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAudit = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getAuditHistory({ limit: 30 });
        setLogs(response.logs || []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load audit history.');
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Audit History</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Governance activity log</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          This audit foundation records governance actions like user creation and active-status changes so the hospital
          can trace who performed important administrative actions.
        </p>
      </div>

      {error && (
        <article className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </article>
      )}

      <article className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-3 font-medium">Action</th>
                <th className="px-2 py-3 font-medium">Actor</th>
                <th className="px-2 py-3 font-medium">Target</th>
                <th className="px-2 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-slate-500">Loading audit history...</td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-slate-500">No audit activity available yet.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-2 py-3">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white capitalize">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-700">
                    {log.creatorName}
                    <div className="text-xs text-slate-500">{getRoleLabel(log.creatorRole)}</div>
                  </td>
                  <td className="px-2 py-3 text-slate-700">
                    {log.createdUserName}
                    <div className="text-xs text-slate-500">{getRoleLabel(log.createdUserRole)}</div>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
