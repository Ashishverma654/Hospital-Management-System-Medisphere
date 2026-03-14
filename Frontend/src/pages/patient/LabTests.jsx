import { useEffect, useState } from 'react';
import { labOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

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
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Diagnostics</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Lab tests and schedules</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          View ordered tests, payment state, scheduled sample collection time, and expected report pickup timing.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.doctorName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.items?.map((item) => item.testName).join(', ')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={order.status}>{order.status}</StatusBadge>
                <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Sample collection</p>
                <p className="mt-2 font-medium text-foreground">
                  {order.sampleCollectionSchedule?.date && order.sampleCollectionSchedule?.time
                    ? `${order.sampleCollectionSchedule.date} at ${order.sampleCollectionSchedule.time}`
                    : 'Not scheduled yet'}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Report pickup / ready time</p>
                <p className="mt-2 font-medium text-foreground">
                  {order.reportPickupSchedule?.date && order.reportPickupSchedule?.time
                    ? `${order.reportPickupSchedule.date} at ${order.reportPickupSchedule.time}`
                    : 'Not scheduled yet'}
                </p>
              </div>
            </div>
          </article>
        ))}

        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No lab orders have been created for this patient account yet.
          </div>
        )}
      </div>
    </motion.section>
  );
}
