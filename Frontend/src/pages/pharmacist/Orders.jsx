import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
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
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [itemInputs, setItemInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [counselingCompleted, setCounselingCompleted] = useState(false);
  const [substitutions, setSubstitutions] = useState({});

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

  const loadOrder = async (orderId) => {
    if (!orderId) return;
    try {
      const data = await pharmacyOrderApi.getPharmacistOrder(orderId);
      setSelectedOrder(data);
      setItemInputs(
        Object.fromEntries(
          (data.items || []).map((item, index) => [
            index,
            { fulfilledQuantity: item.fulfilledQuantity ?? item.requestedQuantity ?? 0 },
          ])
        )
      );
      setSubstitutions(
        Object.fromEntries(
          (data.items || []).map((item, index) => [
            index,
            {
              originalMedicineName: item.substitution?.originalMedicineName || item.medicineName,
              substitutedMedicineName: item.substitution?.substitutedMedicineName || '',
              reason: item.substitution?.reason || '',
            },
          ])
        )
      );
      setVerificationNotes(data.verificationNotes || '');
      setCounselingCompleted(Boolean(data.counselingCompleted));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load order detail.');
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters.date, filters.paymentStatus, filters.status, historyOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrder(selectedOrderId);
  }, [selectedOrderId]);

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

  const itemPayload = () =>
    Object.entries(itemInputs).map(([index, value]) => ({
      index: Number(index),
      fulfilledQuantity: Number(value.fulfilledQuantity || 0),
      substitution: substitutions[index]?.substitutedMedicineName
        ? {
            originalMedicineName: substitutions[index]?.originalMedicineName,
            substitutedMedicineName: substitutions[index]?.substitutedMedicineName,
            reason: substitutions[index]?.reason,
          }
        : undefined,
    }));

  const runAction = async (label, action) => {
    try {
      setSaving(label);
      await action();
      await loadOrders();
      await loadOrder(selectedOrderId);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${label}.`);
    } finally {
      setSaving('');
    }
  };

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
              <button key={order.id} type="button" onClick={() => setSelectedOrderId(order.id)} className={`w-full rounded-xl border p-4 text-left ${selectedOrderId === order.id ? 'border-slate-900 bg-muted/50' : 'border-border bg-card hover:border-border'}`}>
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
          {!selectedOrder && <div className="py-24 text-center text-muted-foreground">Select a pharmacy order to process it.</div>}
          {selectedOrder && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Order Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedOrder.patient?.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedOrder.orderReference} • Prescription {selectedOrder.prescription?.id?.slice(-8).toUpperCase()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={selectedOrder.status}>{selectedOrder.status}</StatusBadge>
                  <StatusBadge status={selectedOrder.paymentStatus}>{selectedOrder.paymentStatus}</StatusBadge>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to={`/employee/pharmacy-orders/${selectedOrder.id}`}>Open Detail Page</Link>
                  </Button>
                </div>
              </div>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Requested medicines</p>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={`${selectedOrder.id}-${index}`} className="rounded-xl bg-muted/50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.medicineName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Requested {item.requestedQuantity} • Stock available {item.stockCurrent ?? item.stockAvailableAtReview ?? 0}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Unit ₹{Number(item.unitPrice || 0).toLocaleString()} • Line ₹{Number(item.lineTotal || 0).toLocaleString()}
                          </p>
                        </div>
                        <StatusBadge status={item.fulfillmentStatus}>{item.fulfillmentStatus}</StatusBadge>
                      </div>
                      {!historyOnly && (
                        <div className="mt-3 flex items-center gap-3">
                          <label className="text-sm text-muted-foreground">Fulfilled quantity</label>
                          <input
                            type="number"
                            min="0"
                            max={item.requestedQuantity}
                            value={itemInputs[index]?.fulfilledQuantity ?? item.fulfilledQuantity ?? 0}
                            onChange={(event) =>
                              setItemInputs((current) => ({
                                ...current,
                                [index]: { fulfilledQuantity: event.target.value },
                              }))
                            }
                            className="w-28 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      )}
                      {!historyOnly && (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <input
                            value={substitutions[index]?.substitutedMedicineName || ''}
                            onChange={(event) =>
                              setSubstitutions((current) => ({
                                ...current,
                                [index]: {
                                  ...current[index],
                                  originalMedicineName: item.medicineName,
                                  substitutedMedicineName: event.target.value,
                                },
                              }))
                            }
                            placeholder="Substitute medicine name"
                            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                          <input
                            value={substitutions[index]?.reason || ''}
                            onChange={(event) =>
                              setSubstitutions((current) => ({
                                ...current,
                                [index]: {
                                  ...current[index],
                                  reason: event.target.value,
                                },
                              }))
                            }
                            placeholder="Substitution reason"
                            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                          <div className="text-xs text-muted-foreground">
                            {item.substitution?.substitutedMedicineName
                              ? `Substituted: ${item.substitution.substitutedMedicineName}`
                              : 'No substitution applied'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Billing snapshot</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Subtotal</span><span>₹{Number(selectedOrder.subtotal || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between font-semibold text-foreground"><span>Total</span><span>₹{Number(selectedOrder.total || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between"><span>Payment</span><span className="capitalize">{selectedOrder.paymentStatus}</span></div>
                  <div className="flex items-center justify-between"><span>Accepted</span><span>{selectedOrder.acceptedAt ? new Date(selectedOrder.acceptedAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Verified</span><span>{selectedOrder.verifiedAt ? new Date(selectedOrder.verifiedAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Ready</span><span>{selectedOrder.readyAt ? new Date(selectedOrder.readyAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Completed</span><span>{selectedOrder.completedAt ? new Date(selectedOrder.completedAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Dispensed</span><span>{selectedOrder.dispensedAt ? new Date(selectedOrder.dispensedAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Counseling</span><span>{selectedOrder.counselingCompleted ? 'Completed' : 'Pending'}</span></div>
                </div>
              </article>

              {!historyOnly && (
                <article className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">Workflow actions</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Button variant="outline" disabled={saving === 'accept'} onClick={() => runAction('accept', () => pharmacyOrderApi.accept(selectedOrder.id, { items: itemPayload() }))}>
                      {saving === 'accept' ? 'Working...' : 'Accept order'}
                    </Button>
                    <Button variant="outline" disabled={saving === 'verify'} onClick={() => runAction('verify', () => pharmacyOrderApi.verify(selectedOrder.id, { items: itemPayload(), verificationNotes }))}>
                      {saving === 'verify' ? 'Working...' : 'Verify order'}
                    </Button>
                    <Button variant="outline" disabled={saving === 'prepare'} onClick={() => runAction('prepare', () => pharmacyOrderApi.markPreparing(selectedOrder.id, { items: itemPayload() }))}>
                      {saving === 'prepare' ? 'Working...' : 'Move to preparing'}
                    </Button>
                    <Button variant="outline" disabled={saving === 'ready'} onClick={() => runAction('ready', () => pharmacyOrderApi.markReady(selectedOrder.id, { items: itemPayload() }))}>
                      {saving === 'ready' ? 'Working...' : 'Mark ready for pickup'}
                    </Button>
                    <Button disabled={saving === 'complete'} onClick={() => runAction('complete', () => pharmacyOrderApi.complete(selectedOrder.id, { counselingCompleted }))}>
                      {saving === 'complete' ? 'Working...' : 'Mark completed'}
                    </Button>
                    <Button variant="destructive" disabled={saving === 'cancel'} onClick={() => runAction('cancel', () => pharmacyOrderApi.cancel(selectedOrder.id))}>
                      {saving === 'cancel' ? 'Working...' : 'Cancel order'}
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <textarea
                      value={verificationNotes}
                      onChange={(event) => setVerificationNotes(event.target.value)}
                      placeholder="Verification notes (interaction check, substitutions, warnings)"
                      className="min-h-[80px] w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={counselingCompleted}
                        onChange={(event) => setCounselingCompleted(event.target.checked)}
                      />
                      Counseling completed with patient
                    </label>
                  </div>
                  {selectedOrder.paymentStatus !== 'paid' && (
                    <p className="mt-3 text-xs text-amber-700">Final completion is blocked until payment is marked paid.</p>
                  )}
                </article>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.section>
  );
}
