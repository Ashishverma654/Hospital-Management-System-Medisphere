import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../../components/ui/button';
import { billingApi, patientApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialForm = {
  patientId: '',
  billType: 'mixed',
  notes: '',
  lineItems: [{ label: '', category: 'other', quantity: 1, unitPrice: 0, notes: '' }],
};

export default function BillingManagement() {
  const user = useSelector((state) => state.auth.user);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({ search: '', billType: '', paymentStatus: '', date: '' });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadInvoices = async () => {
    try {
      const data = await billingApi.getAll(filters);
      const list = Array.isArray(data) ? data : [];
      setInvoices(list);
      if (!selectedInvoiceId && list.length) {
        setSelectedInvoiceId(list[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load invoices.');
    }
  };

  const loadInvoiceDetail = async (invoiceId) => {
    if (!invoiceId) {
      setSelectedInvoice(null);
      return;
    }
    try {
      const data = await billingApi.getById(invoiceId);
      setSelectedInvoice(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load invoice detail.');
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientApi.getAdminList({});
      setPatients(response.patients || []);
    } catch {
      setPatients([]);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadPatients();
  }, [filters.search, filters.billType, filters.paymentStatus, filters.date]);

  useEffect(() => {
    loadInvoiceDetail(selectedInvoiceId);
  }, [selectedInvoiceId]);

  const totals = useMemo(
    () => ({
      total: invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
      paid: invoices.filter((invoice) => invoice.paymentStatus === 'paid').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
      pending: invoices.filter((invoice) => invoice.paymentStatus === 'pending').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
    }),
    [invoices]
  );

  const updateLineItem = (index, patch) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  };

  const addLineItem = () => {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, { label: '', category: 'other', quantity: 1, unitPrice: 0, notes: '' }],
    }));
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await billingApi.create({
        patientId: form.patientId,
        billType: form.billType,
        notes: form.notes,
        lineItems: form.lineItems
          .filter((item) => item.label.trim())
          .map((item) => ({
            ...item,
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            lineTotal: Number(item.quantity || 1) * Number(item.unitPrice || 0),
          })),
      });
      toast.success('Invoice created successfully.');
      setShowCreate(false);
      setForm(initialForm);
      await loadInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (invoiceId) => {
    try {
      await billingApi.pay(invoiceId, { paymentMethod: 'cash' });
      toast.success('Payment marked successfully.');
      await loadInvoices();
      await loadInvoiceDetail(invoiceId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark payment.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Financial Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Billing and payments</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage consultation, lab, pharmacy, and future ward-ready invoices with payment state visibility across patient and staff workflows.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Invoice</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total billed" value={`₹${totals.total.toLocaleString()}`} />
        <SummaryCard label="Paid" value={`₹${totals.paid.toLocaleString()}`} />
        <SummaryCard label="Pending" value={`₹${totals.pending.toLocaleString()}`} />
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search invoice, patient, or context" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          <select value={filters.billType} onChange={(event) => setFilters((current) => ({ ...current, billType: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All bill types</option>
            <option value="consultation">Consultation</option>
            <option value="lab">Lab</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="ward">Ward</option>
            <option value="mixed">Mixed</option>
          </select>
          <select value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
            <option value="">All payment states</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Invoice List</p>
          <div className="mt-4 space-y-3">
            {invoices.map((invoice) => (
              <button key={invoice.id} type="button" onClick={() => setSelectedInvoiceId(invoice.id)} className={`w-full rounded-xl border p-4 text-left ${selectedInvoiceId === invoice.id ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{invoice.patient?.name || 'Patient'} • {invoice.patient?.patientId || 'No ID'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={invoice.billType}>{invoice.billType}</StatusBadge>
                    <StatusBadge status={invoice.paymentStatus}>{invoice.paymentStatus}</StatusBadge>
                  </div>
                </div>
              </button>
            ))}
            {invoices.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No invoices match the selected filters.</p>}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          {!selectedInvoice && <div className="py-24 text-center text-muted-foreground">Select an invoice to review its itemized detail.</div>}
          {selectedInvoice && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Invoice Detail</p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedInvoice.invoiceNumber}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedInvoice.patient?.name || 'Patient'} • {selectedInvoice.patient?.patientId || 'No ID'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedInvoice.billType}>{selectedInvoice.billType}</StatusBadge>
                  <StatusBadge status={selectedInvoice.paymentStatus}>{selectedInvoice.paymentStatus}</StatusBadge>
                </div>
              </div>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Linked context</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {selectedInvoice.context?.appointment && <p>Appointment: {selectedInvoice.context.appointment.date} • {selectedInvoice.context.appointment.slot} • {selectedInvoice.context.appointment.doctorName || 'Doctor'}</p>}
                  {selectedInvoice.context?.labOrder && <p>Lab Order: {selectedInvoice.context.labOrder.orderNumber} • {selectedInvoice.context.labOrder.status}</p>}
                  {selectedInvoice.context?.pharmacyOrder && <p>Pharmacy Order: {selectedInvoice.context.pharmacyOrder.id} • {selectedInvoice.context.pharmacyOrder.status}</p>}
                  {selectedInvoice.context?.ward && <p>Ward: {selectedInvoice.context.ward.name}</p>}
                  {!selectedInvoice.context?.appointment && !selectedInvoice.context?.labOrder && !selectedInvoice.context?.pharmacyOrder && !selectedInvoice.context?.ward && <p>No linked operational context.</p>}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Itemized lines</p>
                <div className="mt-3 space-y-3">
                  {(selectedInvoice.lineItems || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground capitalize">
                          {item.category || 'charge'} • Qty {item.quantity} • Unit ₹{Number(item.unitPrice || 0).toLocaleString()}
                        </p>
                        {item.notes && <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>}
                      </div>
                      <p className="font-semibold text-foreground">₹{Number(item.lineTotal || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Subtotal</span><span>₹{Number(selectedInvoice.subtotal || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between font-semibold text-foreground"><span>Total</span><span>₹{Number(selectedInvoice.totalAmount || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between"><span>Payment method</span><span>{selectedInvoice.paymentMethod || 'Not recorded'}</span></div>
                  <div className="flex items-center justify-between"><span>Paid at</span><span>{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Operator</span><span>{user?.name || 'Staff'}</span></div>
                </div>
              </article>

              {selectedInvoice.paymentStatus !== 'paid' && (
                <Button onClick={() => markPaid(selectedInvoice.id)}>Mark Paid</Button>
              )}
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={createInvoice} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Create Invoice</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Patient">
                <select value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.name || 'Patient'} ({patient.user?.patientId || 'No ID'})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bill type">
                <select value={form.billType} onChange={(event) => setForm((current) => ({ ...current, billType: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="consultation">Consultation</option>
                  <option value="lab">Lab</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="ward">Ward</option>
                  <option value="mixed">Mixed</option>
                </select>
              </Field>
            </div>

            <Field label="Internal note" className="mt-4">
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-[100px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
            </Field>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-foreground">Line items</h4>
                <Button type="button" variant="outline" onClick={addLineItem}>Add Line</Button>
              </div>
              {form.lineItems.map((item, index) => (
                <div key={`line-${index}`} className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-4">
                  <input value={item.label} onChange={(event) => updateLineItem(index, { label: event.target.value })} placeholder="Label" className="rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  <input value={item.category} onChange={(event) => updateLineItem(index, { category: event.target.value })} placeholder="Category" className="rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  <input type="number" min="1" value={item.quantity} onChange={(event) => updateLineItem(index, { quantity: event.target.value })} placeholder="Quantity" className="rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  <input type="number" min="0" value={item.unitPrice} onChange={(event) => updateLineItem(index, { unitPrice: event.target.value })} placeholder="Unit price" className="rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  <textarea value={item.notes} onChange={(event) => updateLineItem(index, { notes: event.target.value })} placeholder="Optional notes" className="md:col-span-4 min-h-[80px] rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Creating...' : 'Create Invoice'}</Button>
            </div>
          </form>
        </div>
      )}
    </motion.section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-xl bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold text-foreground">{value}</h3>
    </article>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
