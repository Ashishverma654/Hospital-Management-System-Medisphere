import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pharmacyOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { toast } from 'sonner';

export default function PharmacyOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await pharmacyOrderApi.getById(id);
      setOrder(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pharmacy order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading pharmacy order...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Pharmacy order not available.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Pharmacy Order</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{order.orderReference}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.patient?.name} • {order.patient?.patientId} • {order.doctor?.name || 'Doctor'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status}>{order.status}</StatusBadge>
            <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
            <Button asChild variant="outline">
              <Link to="/employee/pharmacist/orders">Back to pharmacy orders</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Order Items</h3>
          <div className="mt-4 space-y-3">
            {(order.items || []).map((item, index) => (
              <div key={`${order.id}-${index}`} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.medicineName}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {item.requestedQuantity} • Fulfilled {item.fulfilledQuantity || 0}
                    </p>
                  </div>
                  <StatusBadge status={item.fulfillmentStatus}>{item.fulfillmentStatus}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Unit ₹{Number(item.unitPrice || 0).toLocaleString()} • Line ₹{Number(item.lineTotal || 0).toLocaleString()}
                </p>
              </div>
            ))}
            {(order.items || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No medicines listed for this order.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <Detail label="Subtotal" value={`₹${Number(order.subtotal || 0).toLocaleString()}`} />
          <Detail label="Total" value={`₹${Number(order.total || 0).toLocaleString()}`} />
          <Detail label="Ordered At" value={order.orderedAt ? new Date(order.orderedAt).toLocaleString() : '—'} />
          <Detail label="Ready At" value={order.readyAt ? new Date(order.readyAt).toLocaleString() : '—'} />
          <Detail label="Completed At" value={order.completedAt ? new Date(order.completedAt).toLocaleString() : '—'} />
          <Detail label="Notes" value={order.notes || '—'} />
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || '—'}</p>
    </div>
  );
}
