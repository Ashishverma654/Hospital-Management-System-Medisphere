import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { labOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { toast } from 'sonner';

export default function LabOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await labOrderApi.getById(id);
      const data = response?.data || response;
      setOrder(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lab order.');
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
        <p className="text-sm text-muted-foreground">Loading lab order...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Lab order not available.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Lab Order</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{order.orderNumber || 'Order'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.patientName} • {order.patientIdentifier} • {order.doctorName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status}>{order.status}</StatusBadge>
            <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
            <Button asChild variant="outline">
              <Link to="/employee/lab-technician/orders">Back to lab orders</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Ordered Tests</h3>
          <div className="mt-4 space-y-3">
            {(order.items || []).map((item) => (
              <div key={item._id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.testName}</p>
                    <p className="text-xs text-muted-foreground">₹{Number(item.price || 0).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={item.status}>{item.status}</StatusBadge>
                </div>
              </div>
            ))}
            {(order.items || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No lab items found for this order.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <Detail label="Urgency" value={order.urgency || 'routine'} />
          <Detail label="Total Amount" value={`₹${Number(order.totalAmount || 0).toLocaleString()}`} />
          <Detail label="Created At" value={order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'} />
          <Detail label="Updated At" value={order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '—'} />
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
