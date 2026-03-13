import { useEffect, useState } from 'react';
import { labOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

export default function PatientLabTests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await labOrderApi.getMy();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load lab tests.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Diagnostics</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Lab tests and schedules</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          View ordered tests, payment state, scheduled sample collection time, and expected report pickup timing.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-slate-600">{order.doctorName}</p>
                <p className="mt-1 text-sm text-slate-600">{order.items?.map((item) => item.testName).join(', ')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={order.status}>{order.status}</StatusBadge>
                <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Sample collection</p>
                <p className="mt-2 font-medium text-slate-900">
                  {order.sampleCollectionSchedule?.date && order.sampleCollectionSchedule?.time
                    ? `${order.sampleCollectionSchedule.date} at ${order.sampleCollectionSchedule.time}`
                    : 'Not scheduled yet'}
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Report pickup / ready time</p>
                <p className="mt-2 font-medium text-slate-900">
                  {order.reportPickupSchedule?.date && order.reportPickupSchedule?.time
                    ? `${order.reportPickupSchedule.date} at ${order.reportPickupSchedule.time}`
                    : 'Not scheduled yet'}
                </p>
              </div>
            </div>
          </article>
        ))}

        {!loading && orders.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No lab orders have been created for this patient account yet.
          </div>
        )}
      </div>
    </section>
  );
}
