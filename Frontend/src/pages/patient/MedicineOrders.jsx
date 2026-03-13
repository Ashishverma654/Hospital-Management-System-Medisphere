import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { billingApi, pharmacyOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

export default function PatientMedicineOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await pharmacyOrderApi.getMy();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load medicine orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const payInvoice = async (invoiceId) => {
    try {
      setPayingInvoiceId(invoiceId);
      await billingApi.pay(invoiceId, { paymentMethod: 'card' });
      toast.success('Payment completed successfully.');
      await loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed.');
    } finally {
      setPayingInvoiceId('');
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Pharmacy Orders</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Medicine orders and billing</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Track order status, ready-for-pickup timing, and pharmacy billing for your medicine orders.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{order.orderReference}</p>
                <p className="mt-1 text-sm text-slate-600">Doctor: {order.doctor?.name || 'Hospital Doctor'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Ordered on {new Date(order.placedAt || order.orderedAt || order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={order.status}>{order.status}</StatusBadge>
                <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="rounded-[1.25rem] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.medicineName}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Requested {item.requestedQuantity} • Fulfilled {item.fulfilledQuantity}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Unit ₹{Number(item.unitPrice || 0).toLocaleString()} • Line ₹{Number(item.lineTotal || 0).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={item.fulfillmentStatus}>{item.fulfillmentStatus}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="font-semibold text-slate-900">Order summary</p>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Total</span><span>₹{Number(order.total || 0).toLocaleString()}</span></div>
                  <div className="flex items-center justify-between"><span>Accepted</span><span>{order.acceptedAt ? new Date(order.acceptedAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Ready</span><span>{order.readyAt ? new Date(order.readyAt).toLocaleString() : 'Pending'}</span></div>
                  <div className="flex items-center justify-between"><span>Completed</span><span>{order.completedAt ? new Date(order.completedAt).toLocaleString() : 'Pending'}</span></div>
                </div>

                {order.invoice?.id && order.paymentStatus !== 'paid' && (
                  <Button className="mt-5 w-full" disabled={payingInvoiceId === order.invoice.id} onClick={() => payInvoice(order.invoice.id)}>
                    {payingInvoiceId === order.invoice.id ? 'Processing payment...' : 'Pay pharmacy invoice'}
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}

        {!loading && orders.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No medicine orders have been placed yet.
          </div>
        )}
      </div>
    </section>
  );
}
