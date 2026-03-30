import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { labTechApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const emptyFilters = {
  search: '',
  patient: '',
  doctor: '',
  date: '',
  urgency: '',
  paymentStatus: '',
  status: '',
};

export default function LabTechOrdersInbox({
  presetStatus = '',
  title = 'Lab Orders Inbox',
  description = 'Review, schedule, process, upload, and release diagnostic work from the technician queue.',
}) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState(() => ({ ...emptyFilters, status: presetStatus }));
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState('');
  const [sampleSchedule, setSampleSchedule] = useState({ date: '', time: '', notes: '' });
  const [pickupSchedule, setPickupSchedule] = useState({ date: '', time: '', notes: '' });
  const [reportMeta, setReportMeta] = useState({ reportName: '', reportType: '' });
  const [resultsByItem, setResultsByItem] = useState({});
  const [rejection, setRejection] = useState({ reason: '', notes: '' });
  const [criticalItems, setCriticalItems] = useState([]);
  const [criticalNotes, setCriticalNotes] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await labTechApi.getOrders({
        ...filters,
        status: filters.status || undefined,
        urgency: filters.urgency || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        date: filters.date || undefined,
        search: filters.search || undefined,
        patient: filters.patient || undefined,
        doctor: filters.doctor || undefined,
      });
      setOrders(Array.isArray(data) ? data : []);
      if (!selectedOrderId && data?.length) {
        setSelectedOrderId(data[0]._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lab orders.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (orderId) => {
    if (!orderId) return;
    try {
      const data = await labTechApi.getOrder(orderId);
      setSelectedOrder(data);
      setSampleSchedule({
        date: data.sampleCollectionSchedule?.date || '',
        time: data.sampleCollectionSchedule?.time || '',
        notes: data.sampleCollectionSchedule?.notes || '',
      });
      setPickupSchedule({
        date: data.reportPickupSchedule?.date || '',
        time: data.reportPickupSchedule?.time || '',
        notes: data.reportPickupSchedule?.notes || '',
      });
      setReportMeta({
        reportName: data.reports?.[0]?.reportName || '',
        reportType: data.reports?.[0]?.reportType || '',
      });
      setResultsByItem(
        (data.items || []).reduce((acc, item) => {
          acc[item._id] = {
            resultValue: item.resultValue || '',
            resultUnit: item.resultUnit || '',
            referenceRange: item.referenceRange || '',
            resultNotes: item.resultNotes || '',
          };
          return acc;
        }, {})
      );
      setRejection({
        reason: data.rejectionReason || '',
        notes: data.rejectionNotes || '',
      });
      setCriticalItems((data.items || []).filter((item) => item.isCriticalResult).map((item) => item._id));
      setCriticalNotes((data.items || []).find((item) => item.isCriticalResult)?.criticalNotes || '');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load order detail.');
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters.status, filters.urgency, filters.paymentStatus, filters.date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrderDetail(selectedOrderId);
  }, [selectedOrderId]);

  const filteredOrders = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const patient = filters.patient.trim().toLowerCase();
    const doctor = filters.doctor.trim().toLowerCase();

    return orders.filter((order) => {
      const patientName = order.patientName?.toLowerCase() || '';
      const patientId = order.patientIdentifier?.toLowerCase() || '';
      const doctorName = order.doctorName?.toLowerCase() || '';
      const orderNumber = order.orderNumber?.toLowerCase() || '';

      const matchesSearch =
        !search ||
        patientName.includes(search) ||
        patientId.includes(search) ||
        doctorName.includes(search) ||
        orderNumber.includes(search) ||
        String(order._id).toLowerCase().includes(search);

      const matchesPatient = !patient || patientName.includes(patient) || patientId.includes(patient);
      const matchesDoctor = !doctor || doctorName.includes(doctor);

      return matchesSearch && matchesPatient && matchesDoctor;
    });
  }, [filters.doctor, filters.patient, filters.search, orders]);

  const readyOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'reportReady' ||
          order.status === 'reportAvailableForPickup'
      ),
    [orders]
  );

  const runAction = async (label, fn) => {
    try {
      setSavingAction(label);
      await fn();
      await loadOrders();
      await loadOrderDetail(selectedOrderId);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${label}.`);
    } finally {
      setSavingAction('');
    }
  };

  const getTatMinutes = (order) => {
    if (!order?.createdAt || !order?.reportReadyAt) return null;
    const start = new Date(order.createdAt).getTime();
    const end = new Date(order.reportReadyAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return Math.max(0, Math.round((end - start) / 60000));
  };

  const handleResultChange = (itemId, field, value) => {
    setResultsByItem((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || {}),
        [field]: value,
      },
    }));
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Lab Operations</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search by patient, order ID, or doctor" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <input value={filters.patient} onChange={(event) => setFilters((current) => ({ ...current, patient: event.target.value }))} placeholder="Filter by patient / patient ID" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <input value={filters.doctor} onChange={(event) => setFilters((current) => ({ ...current, doctor: event.target.value }))} placeholder="Filter by doctor" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <select value={filters.urgency} onChange={(event) => setFilters((current) => ({ ...current, urgency: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All urgency</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
          <select value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All payment states</option>
            <option value="pending">Pending</option>
            <option value="partiallyPaid">Partially paid</option>
            <option value="paid">Paid</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All workflow states</option>
            <option value="ordered">Ordered</option>
            <option value="awaitingPayment">Awaiting payment</option>
            <option value="paid">Paid</option>
            <option value="accessioned">Accessioned</option>
            <option value="sampleScheduled">Sample scheduled</option>
            <option value="sampleCollected">Sample collected</option>
            <option value="inProcessing">In processing</option>
            <option value="reportReady">Report ready</option>
            <option value="reportAvailableForPickup">Pickup scheduled</option>
            <option value="reportReleasedToPortal">Released to portal</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex gap-3">
            <Button onClick={loadOrders} className="flex-1">Apply</Button>
            <Button variant="outline" className="flex-1" onClick={() => setFilters({ ...emptyFilters, status: presetStatus })}>Clear</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Inbox</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">
                {loading ? 'Loading orders...' : `${filteredOrders.length} matching orders`}
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredOrders.map((order) => (
              <button
                key={order._id}
                type="button"
                onClick={() => setSelectedOrderId(order._id)}
                className={`w-full rounded-xl border p-4 text-left transition ${selectedOrderId === order._id ? 'border-slate-900 bg-muted/50' : 'border-border bg-card hover:border-border'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{order.patientName}</p>
                      {(order.urgency === 'urgent' || order.urgency === 'stat') && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700">
                          {order.urgency}
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {order.orderSource === 'patient' ? 'Patient order' : 'Doctor order'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.orderNumber} • {order.patientIdentifier} • {order.doctorName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.items?.map((item) => item.testName).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.appointmentReference ? `Appointment ${order.appointmentReference} • ` : ''}
                      Created {new Date(order.createdAt).toLocaleString()}
                    </p>
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
                No lab orders match the selected filters.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <article className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Ready Reports</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{readyOrders.length}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reports waiting for pickup or portal release.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadOrders}>
                Refresh
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {readyOrders.slice(0, 5).map((order) => (
                <button
                  key={order._id}
                  type="button"
                  onClick={() => setSelectedOrderId(order._id)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{order.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderNumber} • {order.doctorName}
                    </p>
                  </div>
                  <StatusBadge status={order.status}>{order.status}</StatusBadge>
                </button>
              ))}
              {readyOrders.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                  No reports ready yet.
                </p>
              )}
            </div>
          </article>

          {!selectedOrder && (
            <div className="mt-6 flex min-h-[420px] items-center justify-center text-center text-muted-foreground">
              Select a lab order to schedule collection, update processing, enter results, or release patient-visible reports.
            </div>
          )}

          {selectedOrder && (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Order Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedOrder.patientName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedOrder.orderNumber} • {selectedOrder.patientIdentifier} • {selectedOrder.doctorName}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={selectedOrder.status}>{selectedOrder.status}</StatusBadge>
                  <StatusBadge status={selectedOrder.paymentStatus}>{selectedOrder.paymentStatus}</StatusBadge>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to={`/employee/lab-orders/${selectedOrder._id}`}>Open Detail Page</Link>
                  </Button>
                </div>
                {getTatMinutes(selectedOrder) !== null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Turnaround time: {getTatMinutes(selectedOrder)} minutes
                  </p>
                )}
              </div>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Ordered tests</p>
                <div className="mt-3 space-y-2">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-3">
                      <div>
                        <p className="font-medium text-foreground">{item.testName}</p>
                        <p className="text-xs text-muted-foreground">₹{Number(item.price || 0).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={item.status}>{item.status}</StatusBadge>
                    </div>
                  ))}
                </div>
              </article>

              <div className="grid gap-4">
              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Accessioning & specimen QC</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm sample integrity before processing. Use reject if specimen is unsuitable.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Button
                    variant="outline"
                    disabled={savingAction === 'accession'}
                    onClick={() =>
                      runAction('accession', async () => {
                        await labTechApi.markAccessioned(selectedOrder._id);
                        toast.success('Order accessioned.');
                      })
                    }
                  >
                    {savingAction === 'accession' ? 'Working...' : 'Mark accessioned'}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={savingAction === 'reject'}
                    onClick={() =>
                      runAction('reject', async () => {
                        await labTechApi.rejectOrder(selectedOrder._id, rejection);
                        toast.success('Order marked as rejected.');
                      })
                    }
                  >
                    {savingAction === 'reject' ? 'Working...' : 'Reject specimen'}
                  </Button>
                </div>
                <div className="mt-3 grid gap-3">
                  <input
                    value={rejection.reason}
                    onChange={(event) => setRejection((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Rejection reason (e.g., hemolyzed, insufficient sample)"
                    className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <textarea
                    value={rejection.notes}
                    onChange={(event) => setRejection((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Optional rejection notes"
                    className="min-h-[90px] w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                {selectedOrder.rejectionReason && (
                  <p className="mt-3 text-xs text-amber-700">
                    Rejected: {selectedOrder.rejectionReason}
                  </p>
                )}
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Sample collection schedule</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input type="date" value={sampleSchedule.date} onChange={(event) => setSampleSchedule((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                    <input type="time" value={sampleSchedule.time} onChange={(event) => setSampleSchedule((current) => ({ ...current, time: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <textarea value={sampleSchedule.notes} onChange={(event) => setSampleSchedule((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional collection instructions" className="mt-3 min-h-[90px] w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                  <Button className="mt-3 w-full" disabled={savingAction === 'schedule sample'} onClick={() => runAction('schedule sample', async () => {
                    await labTechApi.scheduleSampleCollection(selectedOrder._id, sampleSchedule);
                    toast.success('Sample collection scheduled.');
                  })}>
                    {savingAction === 'schedule sample' ? 'Saving...' : 'Save sample collection schedule'}
                  </Button>
                </article>

                <article className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">Report pickup / ready schedule</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input type="date" value={pickupSchedule.date} onChange={(event) => setPickupSchedule((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                    <input type="time" value={pickupSchedule.time} onChange={(event) => setPickupSchedule((current) => ({ ...current, time: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <textarea value={pickupSchedule.notes} onChange={(event) => setPickupSchedule((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional pickup notes" className="mt-3 min-h-[90px] w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                  <Button className="mt-3 w-full" variant="outline" disabled={savingAction === 'schedule pickup'} onClick={() => runAction('schedule pickup', async () => {
                    await labTechApi.scheduleReportPickup(selectedOrder._id, pickupSchedule);
                    toast.success('Report pickup timing saved.');
                  })}>
                    {savingAction === 'schedule pickup' ? 'Saving...' : 'Save pickup / ready timing'}
                  </Button>
                </article>
              </div>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Results entry</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter measured values for each test. The system will generate the final PDF report on release.
                </p>
                <div className="mt-4 space-y-4">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item._id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{item.testName}</p>
                          <p className="text-xs text-muted-foreground">Status: {item.status}</p>
                        </div>
                        <StatusBadge status={item.status}>{item.status}</StatusBadge>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input
                          value={resultsByItem[item._id]?.resultValue || ''}
                          onChange={(event) => handleResultChange(item._id, 'resultValue', event.target.value)}
                          placeholder="Result value"
                          className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                        <input
                          value={resultsByItem[item._id]?.resultUnit || ''}
                          onChange={(event) => handleResultChange(item._id, 'resultUnit', event.target.value)}
                          placeholder="Unit (e.g., mg/dL)"
                          className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                        <input
                          value={resultsByItem[item._id]?.referenceRange || ''}
                          onChange={(event) => handleResultChange(item._id, 'referenceRange', event.target.value)}
                          placeholder="Reference range"
                          className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                        <input
                          value={resultsByItem[item._id]?.resultNotes || ''}
                          onChange={(event) => handleResultChange(item._id, 'resultNotes', event.target.value)}
                          placeholder="Result notes (optional)"
                          className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Workflow actions</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Button variant="outline" disabled={savingAction === 'mark collected'} onClick={() => runAction('mark collected', async () => {
                    await labTechApi.markSampleCollected(selectedOrder._id);
                    toast.success('Sample marked as collected.');
                  })}>
                    {savingAction === 'mark collected' ? 'Working...' : 'Mark sample collected'}
                  </Button>
                  <Button variant="outline" disabled={savingAction === 'start processing'} onClick={() => runAction('start processing', async () => {
                    await labTechApi.markInProcessing(selectedOrder._id);
                    toast.success('Order moved to processing.');
                  })}>
                    {savingAction === 'start processing' ? 'Working...' : 'Move to processing'}
                  </Button>
                  <Button variant="outline" disabled={savingAction === 'mark ready'} onClick={() => runAction('mark ready', async () => {
                    await labTechApi.markReportReady(selectedOrder._id, {
                      reportName: reportMeta.reportName || `${selectedOrder.patientName} Report`,
                      reportType: reportMeta.reportType || 'Diagnostic Report',
                      results: (selectedOrder.items || []).map((item) => ({
                        itemId: item._id,
                        ...resultsByItem[item._id],
                      })),
                      criticalItemIds: criticalItems,
                      criticalNotes,
                    });
                    toast.success('Order marked as report ready.');
                  })}>
                    {savingAction === 'mark ready' ? 'Working...' : 'Mark report ready'}
                  </Button>
                  <Button disabled={savingAction === 'release report' || selectedOrder.paymentStatus !== 'paid'} onClick={() => runAction('release report', async () => {
                    await labTechApi.releaseReport(selectedOrder._id);
                    toast.success('Report released to patient portal.');
                  })}>
                    {savingAction === 'release report' ? 'Working...' : 'Release to patient portal'}
                  </Button>
                </div>
                <div className="mt-4 rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">Critical result flag</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select any tests that should trigger critical alerts for the doctor and ward nurses.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {(selectedOrder.items || []).map((item) => (
                      <label key={item._id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={criticalItems.includes(item._id)}
                          onChange={(event) => {
                            setCriticalItems((current) =>
                              event.target.checked
                                ? [...current, item._id]
                                : current.filter((id) => id !== item._id)
                            );
                          }}
                        />
                        {item.testName}
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={criticalNotes}
                    onChange={(event) => setCriticalNotes(event.target.value)}
                    placeholder="Optional critical notes"
                    className="mt-3 min-h-[80px] w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                {selectedOrder.paymentStatus !== 'paid' && (
                  <p className="mt-3 text-xs text-amber-700">
                    Patient portal release is blocked until this lab order invoice is paid.
                  </p>
                )}
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Report metadata</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The system generates the final PDF. Provide a title and report type for the release.
                </p>
                <div className="mt-3 grid gap-3">
                  <input value={reportMeta.reportName} onChange={(event) => setReportMeta((current) => ({ ...current, reportName: event.target.value }))} placeholder="Report title" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                  <input value={reportMeta.reportType} onChange={(event) => setReportMeta((current) => ({ ...current, reportType: event.target.value }))} placeholder="Test type / report type" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
                </div>
                <div className="mt-4 space-y-2">
                  {(selectedOrder.reports || []).map((report) => (
                    <div key={report._id} className="rounded-xl bg-muted/50 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{report.reportName}</p>
                          <p className="text-xs text-muted-foreground">{report.reportType || 'Lab report'} • {new Date(report.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={report.status}>{report.status}</StatusBadge>
                          {report.patientVisible && <StatusBadge status="completed">Visible to patient</StatusBadge>}
                          {(report.downloadUrl || report.reportFile) && (
                            <a
                              href={report.downloadUrl || report.reportFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.reports || selectedOrder.reports.length === 0) && (
                    <p className="text-sm text-muted-foreground">No reports generated yet.</p>
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
      </div>
    </motion.section>
  );
}
