import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { pharmacyOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialFilters = {
  search: '',
  patient: '',
  doctor: '',
  date: '',
  status: '',
  paymentStatus: '',
};

export default function PharmacistOrders({
  historyOnly = false,
  title = 'Pharmacy Orders',
  description = 'Review medicine orders, verify stock, prepare items, and coordinate ready-for-pickup handovers.',
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const navigate = useNavigate();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await pharmacyOrderApi.getPharmacistOrders({
        ...filters,
        history: historyOnly ? 'true' : undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      if (!selectedOrderId && list.length) {
        setSelectedOrderId(list[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pharmacy orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters.date, filters.paymentStatus, filters.status, historyOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredOrders = useMemo(() => {
    const search = filters.search.toLowerCase();
    const patient = filters.patient.toLowerCase();
    const doctor = filters.doctor.toLowerCase();
    return orders.filter((order) => {
      const patientName = order.patient?.name?.toLowerCase() || '';
      const patientId = order.patient?.patientId?.toLowerCase() || '';
      const doctorName = order.doctor?.name?.toLowerCase() || '';
      const reference = order.orderReference?.toLowerCase() || '';

      const searchMatch =
        !search || [patientName, patientId, doctorName, reference].some((value) => value.includes(search));
      const patientMatch = !patient || [patientName, patientId].some((value) => value.includes(patient));
      const doctorMatch = !doctor || doctorName.includes(doctor);

      return searchMatch && patientMatch && doctorMatch;
    });
  }, [filters.doctor, filters.patient, filters.search, orders]);


  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Pharmacy Workflow</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Search patient, doctor, or order" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <input value={filters.patient} onChange={(e) => setFilters((current) => ({ ...current, patient: e.target.value }))} placeholder="Filter by patient" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <input value={filters.doctor} onChange={(e) => setFilters((current) => ({ ...current, doctor: e.target.value }))} placeholder="Filter by doctor" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <input type="date" value={filters.date} onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All statuses</option>
            <option value="orderPlaced">Order placed</option>
            <option value="orderAccepted">Order accepted</option>
            <option value="verified">Verified</option>
            <option value="awaitingPayment">Awaiting payment</option>
            <option value="paid">Paid</option>
            <option value="preparing">Preparing</option>
            <option value="readyForPickup">Ready for pickup</option>
            <option value="completed">Completed</option>
            <option value="partiallyFulfilled">Partially fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.paymentStatus} onChange={(e) => setFilters((current) => ({ ...current, paymentStatus: e.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All payment states</option>
            <option value="pending">Pending</option>
            <option value="partiallyPaid">Partially paid</option>
            <option value="paid">Paid</option>
          </select>
          <div className="flex gap-3">
            <Button onClick={loadOrders} className="flex-1">Apply</Button>
            <Button variant="outline" onClick={() => setFilters(initialFilters)} className="flex-1">Clear</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Order Inbox</p>
          <div className="mt-4 space-y-3">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setSelectedOrderId(order.id);
                  navigate(`/employee/pharmacy-orders/${order.id}`);
                }}
                className={`w-full rounded-xl border p-4 text-left ${selectedOrderId === order.id ? 'border-slate-900 bg-muted/50' : 'border-border bg-card hover:border-border'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{order.patient?.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.orderReference} • {order.patient?.patientId} • {order.doctor?.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{order.items.map((item) => item.medicineName).join(', ')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status}>{order.status}</StatusBadge>
                    <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
                  </div>
                </div>
              </button>
            ))}
            {!loading && filteredOrders.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No pharmacy orders match the selected filters.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="py-20 text-center text-muted-foreground">
            Click an order from the inbox to open the detail view.
          </div>
        </section>
      </div>
    </motion.section>
  );
}
