import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { labTechApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { Activity, Clock3, FileUp, FlaskConical, ListTodo, ShieldCheck } from 'lucide-react';

const quickActions = [
  { label: 'Open Pending Lab Orders', to: '/employee/lab-technician/orders' },
  { label: 'Schedule Sample Collection', to: '/employee/lab-technician/orders' },
  { label: 'Mark Sample Collected', to: '/employee/lab-technician/processing' },
  { label: 'Upload Report', to: '/employee/lab-technician/processing' },
  { label: 'Release Report', to: '/employee/lab-technician/completed' },
];

export default function LabTechDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await labTechApi.getDashboard();
      setDashboard(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lab technician dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    { label: 'Pending lab orders', value: dashboard?.summary?.pendingLabOrders ?? 0, icon: ListTodo },
    { label: 'Urgent lab orders', value: dashboard?.summary?.urgentLabOrders ?? 0, icon: ShieldCheck },
    { label: 'Pending collections', value: dashboard?.summary?.pendingSampleCollections ?? 0, icon: Clock3 },
    { label: 'In processing tests', value: dashboard?.summary?.inProcessingTests ?? 0, icon: FlaskConical },
    { label: 'Completed reports today', value: dashboard?.summary?.completedReportsToday ?? 0, icon: Activity },
    { label: 'Ready but unreleased', value: dashboard?.summary?.readyButNotReleased ?? 0, icon: FileUp },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Diagnostics Desk</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Lab technician workflow dashboard</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Track pending orders, urgent sample flow, internal report readiness, and patient-safe report release from one
          technician workspace.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Lab section: <span className="font-semibold text-slate-900">{dashboard?.labSection || 'Loading...'}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-[#ee4c35]" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{loading ? '...' : stat.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Quick Actions</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Technician shortcuts</h3>
            </div>
            <Button variant="outline" onClick={loadDashboard}>Refresh</Button>
          </div>

          <div className="mt-5 grid gap-3">
            {quickActions.map((action) => (
              <Button key={action.label} asChild variant="outline" className="justify-start rounded-2xl py-6 text-left">
                <Link to={action.to}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Priority Queue</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Live operational orders</h3>
            </div>
            <Button asChild variant="outline">
              <Link to="/employee/lab-technician/orders">Open inbox</Link>
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {(dashboard?.quickQueue || []).map((order) => (
              <article key={order._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{order.patientName}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.orderNumber} • {order.doctorName} • {order.items?.map((item) => item.testName).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status}>{order.status}</StatusBadge>
                    <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
                    {(order.urgency === 'urgent' || order.urgency === 'stat') && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                        {order.urgency}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {!loading && (dashboard?.quickQueue || []).length === 0 && (
              <p className="text-sm text-slate-500">No active lab orders are waiting in the queue right now.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
