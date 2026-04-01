import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { billingApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function PatientBilling() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({ billType: '', paymentStatus: '', date: '' });
  const [payingInvoiceId, setPayingInvoiceId] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const detailRef = useRef(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
  }, [filters.billType, filters.paymentStatus, filters.date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadInvoiceDetail(selectedInvoiceId);
  }, [selectedInvoiceId]);

  useEffect(() => {
    const invoiceParam = searchParams.get('invoice') || searchParams.get('invoiceId');
    if (invoiceParam) {
      setSelectedInvoiceId(invoiceParam);
    }
  }, [searchParams]);

  const handleSelectInvoice = async (invoice) => {
    const invoiceId = invoice?.id || invoice?._id;
    if (!invoiceId) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('invoice', invoiceId);
    setSearchParams(nextParams, { replace: true });
    setSelectedInvoiceId(invoiceId);
    setSelectedInvoice(invoice || null);
    await loadInvoiceDetail(invoiceId);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openDetailModal = async (invoice) => {
    await handleSelectInvoice(invoice);
    setDetailOpen(true);
  };

  const renderInvoiceDetail = (invoice) => (
    <div className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Bill Detail</p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">{invoice.invoiceNumber}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={invoice.billType}>{invoice.billType}</StatusBadge>
          <StatusBadge status={invoice.paymentStatus}>{invoice.paymentStatus}</StatusBadge>
        </div>
      </div>

      <article className="rounded-xl border border-border p-4">
        <p className="font-semibold text-foreground">Linked context</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {invoice.context?.appointment && (
            <p>
              Appointment: {invoice.context.appointment.date} • {invoice.context.appointment.slot} • {invoice.context.appointment.doctorName || 'Doctor'}
              {invoice.context.appointment.consultationMode ? ` • ${invoice.context.appointment.consultationMode}` : ''}
              {invoice.context.appointment.locationName ? ` • ${invoice.context.appointment.locationName}` : ''}
            </p>
          )}
          {invoice.context?.labOrder && <p>Lab Order: {invoice.context.labOrder.orderNumber} • {invoice.context.labOrder.status}</p>}
          {invoice.context?.pharmacyOrder && <p>Pharmacy Order: {invoice.context.pharmacyOrder.id} • {invoice.context.pharmacyOrder.status}</p>}
          {invoice.context?.ward && <p>Ward: {invoice.context.ward.name} {invoice.context.bed?.bedNumber ? `• Bed ${invoice.context.bed.bedNumber}` : ''}</p>}
          {!invoice.context?.appointment && !invoice.context?.labOrder && !invoice.context?.pharmacyOrder && !invoice.context?.ward && (
            <p>No linked operational context is attached to this bill.</p>
          )}
        </div>
      </article>

      <article className="rounded-xl border border-border p-4">
        <p className="font-semibold text-foreground">Itemized charges</p>
        <div className="mt-3 space-y-3">
          {(invoice.lineItems || []).map((item) => (
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
        {(invoice.lineItems || []).length === 0 && <p className="mt-3 text-sm text-muted-foreground">No line items are attached to this invoice.</p>}
      </article>

      <article className="rounded-xl border border-border p-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between"><span>Subtotal</span><span>₹{Number(invoice.subtotal || 0).toLocaleString()}</span></div>
          <div className="flex items-center justify-between font-semibold text-foreground"><span>Total</span><span>₹{Number(invoice.totalAmount || 0).toLocaleString()}</span></div>
          {invoice.discount?.amount ? (
            <div className="flex items-center justify-between"><span>Discount</span><span>-₹{Number(invoice.discount.amount || 0).toLocaleString()}</span></div>
          ) : null}
          {invoice.insuranceCoverage?.amount ? (
            <div className="flex items-center justify-between"><span>Insurance cover</span><span>-₹{Number(invoice.insuranceCoverage.amount || 0).toLocaleString()}</span></div>
          ) : null}
          <div className="flex items-center justify-between"><span>Paid so far</span><span>₹{Number(invoice.totalPaid || 0).toLocaleString()}</span></div>
          <div className="flex items-center justify-between font-semibold text-foreground"><span>Balance</span><span>₹{Number(invoice.balance ?? 0).toLocaleString()}</span></div>
          <div className="flex items-center justify-between"><span>Payment method</span><span>{invoice.paymentMethod || 'Not recorded'}</span></div>
          <div className="flex items-center justify-between"><span>Created</span><span>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '—'}</span></div>
          <div className="flex items-center justify-between"><span>Paid at</span><span>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : 'Pending'}</span></div>
        </div>
      </article>

      <article className="rounded-xl border border-border p-4">
        <p className="font-semibold text-foreground">Payment history</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {(invoice.paymentHistory || []).map((entry, index) => (
            <div key={`${invoice.id}-payment-${index}`} className="flex items-center justify-between">
              <span>₹{Number(entry.amount || 0).toLocaleString()} • {entry.method || 'method'} • {entry.paidAt ? new Date(entry.paidAt).toLocaleString() : '—'}</span>
              <span>{entry.notes || ''}</span>
            </div>
          ))}
          {(invoice.paymentHistory || []).length === 0 && (
            <p>No payment entries recorded yet.</p>
          )}
        </div>
      </article>

      <div className="grid gap-3 md:grid-cols-3">
        <Button variant="outline" onClick={() => downloadPdf(invoice.id)}>
          Download receipt (PDF)
        </Button>
        <Button variant="outline" onClick={() => emailInvoice(invoice.id)}>
          Email receipt
        </Button>
        {invoice.paymentStatus !== 'paid' && (
          <Button
            className="w-full"
            disabled={payingInvoiceId === invoice.id}
            onClick={() => {
              setPaymentAmount(invoice.balance ? String(invoice.balance) : '');
              setPaymentNotes('');
              setPaymentOpen(true);
              setDetailOpen(false);
            }}
          >
            {payingInvoiceId === invoice.id ? 'Processing payment...' : 'Pay this bill'}
          </Button>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (!selectedInvoice || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedInvoice]);

  const totals = useMemo(
    () => ({
      total: invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
      paid: invoices.filter((invoice) => invoice.paymentStatus === 'paid').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
      pending: invoices.filter((invoice) => invoice.paymentStatus === 'pending').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
      outstanding: invoices.filter((invoice) => ['pending', 'partiallyPaid'].includes(invoice.paymentStatus)).reduce((sum, invoice) => sum + Number(invoice.balance ?? invoice.totalAmount ?? 0), 0),
    }),
    [invoices]
  );

  const unifiedTotals = useMemo(() => ({
    consultation: invoices.filter((invoice) => invoice.billType === 'consultation').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
    lab: invoices.filter((invoice) => invoice.billType === 'lab').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
    pharmacy: invoices.filter((invoice) => invoice.billType === 'pharmacy').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
    ward: invoices.filter((invoice) => invoice.billType === 'ward').reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
  }), [invoices]);

  const payInvoice = async (invoiceId) => {
    try {
      setPayingInvoiceId(invoiceId);
      await billingApi.pay(invoiceId, {
        paymentMethod,
        amount: paymentAmount ? Number(paymentAmount) : undefined,
        notes: paymentNotes || undefined,
      });
      toast.success('Payment completed successfully.');
      await loadInvoices();
      await loadInvoiceDetail(invoiceId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed.');
    } finally {
      setPayingInvoiceId('');
    }
  };

  const downloadPdf = async (invoiceId) => {
    try {
      const response = await billingApi.downloadPdf(invoiceId);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download invoice.');
    }
  };

  const emailInvoice = async (invoiceId) => {
    try {
      await billingApi.emailInvoice(invoiceId);
      toast.success('Invoice sent to your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send invoice email.');
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
        <SummaryCard label="Outstanding" value={`₹${totals.outstanding.toLocaleString()}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Consultation" value={`₹${unifiedTotals.consultation.toLocaleString()}`} />
        <SummaryCard label="Lab" value={`₹${unifiedTotals.lab.toLocaleString()}`} />
        <SummaryCard label="Pharmacy" value={`₹${unifiedTotals.pharmacy.toLocaleString()}`} />
        <SummaryCard label="Ward" value={`₹${unifiedTotals.ward.toLocaleString()}`} />
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
            <option value="partiallyPaid">Partially paid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section ref={detailRef} className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Bill History</p>
          <div className="mt-4 space-y-3">
            {invoices.map((invoice) => (
              <button
                key={invoice.id || invoice._id}
                type="button"
                onClick={() => handleSelectInvoice(invoice)}
                className={`w-full rounded-xl border p-4 text-left ${selectedInvoiceId === (invoice.id || invoice._id) ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">{invoice.billType} bill</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={invoice.billType}>{invoice.billType}</StatusBadge>
                    <StatusBadge status={invoice.paymentStatus}>{invoice.paymentStatus}</StatusBadge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetailModal(invoice);
                      }}
                    >
                      Bill details
                    </Button>
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
          {selectedInvoice && renderInvoiceDetail(selectedInvoice)}
        </section>
      </div>

      {paymentOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Choose payment method</h3>
              <button type="button" onClick={() => setPaymentOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Amount to pay</label>
                <input
                  type="number"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                {selectedInvoice?.balance !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">Outstanding balance: ₹{Number(selectedInvoice.balance || 0).toLocaleString()}</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" name="payMethod" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} />
                UPI payment
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" name="payMethod" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
                Card payment
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" name="payMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} />
                Razorpay
              </label>
              {paymentMethod === 'upi' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">UPI ID (optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Payment note (optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Reference or note"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <Button className="w-full" onClick={async () => { await payInvoice(selectedInvoice.id); setPaymentOpen(false); }}>
                Confirm payment
              </Button>
              <p className="text-xs text-muted-foreground">This demo marks the invoice paid. Gateway integration can be added later.</p>
            </div>
          </div>
        </div>
      )}

      {detailOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4">
          <div className="relative w-full h-full max-w-3xl max-h-none overflow-y-auto rounded-none bg-card p-6 shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Bill details</h3>
              <button type="button" onClick={() => setDetailOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-4">{renderInvoiceDetail(selectedInvoice)}</div>
            {selectedInvoice.paymentStatus !== 'paid' && (
              <div className="sticky bottom-0 left-0 right-0 mt-6 border-t border-border bg-card/95 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding balance</p>
                    <p className="text-lg font-semibold text-foreground">₹{Number(selectedInvoice.balance ?? selectedInvoice.totalAmount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
                    <Button
                      disabled={payingInvoiceId === selectedInvoice.id}
                      onClick={() => {
                        setPaymentAmount(selectedInvoice.balance ? String(selectedInvoice.balance) : '');
                        setPaymentNotes('');
                        setPaymentOpen(true);
                        setDetailOpen(false);
                      }}
                    >
                      {payingInvoiceId === selectedInvoice.id ? 'Processing payment...' : 'Pay now'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
