import { useEffect, useState } from 'react';
import { adminApi } from '../../services/apiServices.js';
import { getRoleLabel } from '../../auth/constants.js';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

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
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Audit History</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">Governance activity log</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          This audit foundation records governance actions like user creation and active-status changes so the hospital
          can trace who performed important administrative actions.
        </p>
      </div>

      {error && (
        <article className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </article>
      )}

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-2 py-3 font-medium">Action</th>
                <th className="px-2 py-3 font-medium">Actor</th>
                <th className="px-2 py-3 font-medium">Target</th>
                <th className="px-2 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-muted-foreground">Loading audit history...</td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-muted-foreground">No audit activity available yet.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-2 py-3">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white capitalize">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-foreground">
                    {log.creatorName}
                    <div className="text-xs text-muted-foreground">{getRoleLabel(log.creatorRole)}</div>
                  </td>
                  <td className="px-2 py-3 text-foreground">
                    {log.createdUserName}
                    <div className="text-xs text-muted-foreground">{getRoleLabel(log.createdUserRole)}</div>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </motion.section>
  );
}
