import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { billingApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function PatientBilling() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({ billType: '', paymentStatus: '', date: '' });
  const [payingInvoiceId, setPayingInvoiceId] = useState('');

  const loadInvoices = async () => {
    try {
      const data = await billingApi.getMy(filters);
      const list = Array.isArray(data) ? data : [];
      setInvoices(list);
      if (!selectedInvoiceId && list.length) {
        setSelectedInvoiceId(list[0].id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load bills.');
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
      toast.error(error.response?.data?.message || 'Failed to load bill detail.');
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [filters.billType, filters.paymentStatus, filters.date]);

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

  const payInvoice = async (invoiceId) => {
    try {
      setPayingInvoiceId(invoiceId);
      await billingApi.pay(invoiceId, { paymentMethod: 'card' });
      toast.success('Payment completed successfully.');
      await loadInvoices();
      await loadInvoiceDetail(invoiceId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed.');
    } finally {
      setPayingInvoiceId('');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Billing History</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Bills and payments</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review consultation, lab, and pharmacy bills with itemized charges, payment status, and linked appointment or order context.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total billed" value={`₹${totals.total.toLocaleString()}`} />
        <SummaryCard label="Paid" value={`₹${totals.paid.toLocaleString()}`} />
        <SummaryCard label="Pending" value={`₹${totals.pending.toLocaleString()}`} />
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Bill History</p>
          <div className="mt-4 space-y-3">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => setSelectedInvoiceId(invoice.id)}
                className={`w-full rounded-xl border p-4 text-left ${selectedInvoiceId === invoice.id ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">{invoice.billType} bill</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={invoice.billType}>{invoice.billType}</StatusBadge>
                    <StatusBadge status={invoice.paymentStatus}>{invoice.paymentStatus}</StatusBadge>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">₹{Number(invoice.totalAmount || 0).toLocaleString()}</p>
              </button>
            ))}
            {invoices.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No bills are available for the selected filters.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          {!selectedInvoice && <div className="py-24 text-center text-muted-foreground">Select a bill to review itemized charges.</div>}
          {selectedInvoice && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Bill Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedInvoice.invoiceNumber}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
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
                  {selectedInvoice.context?.ward && <p>Ward: {selectedInvoice.context.ward.name} {selectedInvoice.context.bed?.bedNumber ? `• Bed ${selectedInvoice.context.bed.bedNumber}` : ''}</p>}
                  {!selectedInvoice.context?.appointment && !selectedInvoice.context?.labOrder && !selectedInvoice.context?.pharmacyOrder && !selectedInvoice.context?.ward && (
                    <p>No linked operational context is attached to this bill.</p>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Itemized charges</p>
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
                {(selectedInvoice.lineItems || []).length === 0 && <p className="mt-3 text-sm text-muted-foreground">No line items are attached to this invoice.</p>}
              </article>

              <article className="rounded-xl border border-border p-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Subtotal</span><span>₹{Number(selectedInvoice.subtotal || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between font-semibold text-foreground"><span>Total</span><span>₹{Number(selectedInvoice.totalAmount || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between"><span>Payment method</span><span>{selectedInvoice.paymentMethod || 'Not recorded'}</span></div>
                  <div className="flex items-center justify-between"><span>Created</span><span>{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '—'}</span></div>
                  <div className="flex items-center justify-between"><span>Paid at</span><span>{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString() : 'Pending'}</span></div>
                </div>
              </article>

              {selectedInvoice.paymentStatus !== 'paid' && (
                <Button className="w-full" disabled={payingInvoiceId === selectedInvoice.id} onClick={() => payInvoice(selectedInvoice.id)}>
                  {payingInvoiceId === selectedInvoice.id ? 'Processing payment...' : 'Pay this bill'}
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
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
