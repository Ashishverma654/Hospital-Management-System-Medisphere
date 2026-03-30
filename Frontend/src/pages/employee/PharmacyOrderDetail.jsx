import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pharmacyOrderApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { toast } from 'sonner';

export default function PharmacyOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [counselingCompleted, setCounselingCompleted] = useState(false);
  const [itemInputs, setItemInputs] = useState({});
  const [substitutions, setSubstitutions] = useState({});

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await pharmacyOrderApi.getById(id);
      setOrder(data);
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
      await loadOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${label}.`);
    } finally {
      setSaving('');
    }
  };

  const canAccept = order.status === 'orderPlaced';
  const canVerify = order.status === 'orderAccepted';
  const canPrepare = order.status === 'verified';
  const canReady = order.status === 'preparing';
  const canComplete = order.status === 'readyForPickup' && order.paymentStatus === 'paid';
  const canCancel = !['completed', 'cancelled'].includes(order.status);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Pharmacy Order</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{order.orderReference}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.patient?.name} • {order.patient?.patientId} • {order.doctor?.name || 'Doctor'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status}>{order.status}</StatusBadge>
            <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
            <Button variant="outline" onClick={() => navigate('/employee/pharmacist/orders')}>Close</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Requested medicines</h3>
          <div className="mt-4 space-y-3">
            {(order.items || []).map((item, index) => (
              <div key={`${order.id}-${index}`} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.medicineName}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {item.requestedQuantity} • Stock available {item.stockCurrent ?? item.stockAvailableAtReview ?? 0}
                    </p>
                  </div>
                  <StatusBadge status={item.fulfillmentStatus}>{item.fulfillmentStatus}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Unit ₹{Number(item.unitPrice || 0).toLocaleString()} • Line ₹{Number(item.lineTotal || 0).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
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
              </div>
            ))}
            {(order.items || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No medicines listed for this order.</p>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <Detail label="Subtotal" value={`₹${Number(order.subtotal || 0).toLocaleString()}`} />
            <Detail label="Total" value={`₹${Number(order.total || 0).toLocaleString()}`} />
            <Detail label="Ordered At" value={order.orderedAt ? new Date(order.orderedAt).toLocaleString() : '—'} />
            <Detail label="Ready At" value={order.readyAt ? new Date(order.readyAt).toLocaleString() : '—'} />
            <Detail label="Completed At" value={order.completedAt ? new Date(order.completedAt).toLocaleString() : '—'} />
            <Detail label="Notes" value={order.notes || '—'} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="font-semibold text-foreground">Workflow actions</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                disabled={saving === 'accept' || !canAccept}
                title={!canAccept ? 'Order can only be accepted when status is Order placed.' : undefined}
                onClick={() => runAction('accept', () => pharmacyOrderApi.accept(order.id, { items: itemPayload() }))}
              >
                {saving === 'accept' ? 'Working...' : 'Accept order'}
              </Button>
              <Button
                variant="outline"
                disabled={saving === 'verify' || !canVerify}
                title={!canVerify ? 'Verify after the order is accepted.' : undefined}
                onClick={() => runAction('verify', () => pharmacyOrderApi.verify(order.id, { items: itemPayload(), verificationNotes }))}
              >
                {saving === 'verify' ? 'Working...' : 'Verify order'}
              </Button>
              <Button
                variant="outline"
                disabled={saving === 'prepare' || !canPrepare}
                title={!canPrepare ? 'Move to preparing after verification.' : undefined}
                onClick={() => runAction('prepare', () => pharmacyOrderApi.markPreparing(order.id, { items: itemPayload() }))}
              >
                {saving === 'prepare' ? 'Working...' : 'Move to preparing'}
              </Button>
              <Button
                variant="outline"
                disabled={saving === 'ready' || !canReady}
                title={!canReady ? 'Mark ready after preparation.' : undefined}
                onClick={() => runAction('ready', () => pharmacyOrderApi.markReady(order.id, { items: itemPayload() }))}
              >
                {saving === 'ready' ? 'Working...' : 'Mark ready for pickup'}
              </Button>
              <Button
                disabled={saving === 'complete' || !canComplete}
                title={!canComplete ? 'Complete after ready for pickup and payment is paid.' : undefined}
                onClick={() => runAction('complete', () => pharmacyOrderApi.complete(order.id, { counselingCompleted }))}
              >
                {saving === 'complete' ? 'Working...' : 'Mark completed'}
              </Button>
              <Button
                variant="destructive"
                disabled={saving === 'cancel' || !canCancel}
                title={!canCancel ? 'Completed or cancelled orders cannot be cancelled.' : undefined}
                onClick={() => runAction('cancel', () => pharmacyOrderApi.cancel(order.id))}
              >
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
            {order.paymentStatus !== 'paid' && (
              <p className="mt-3 text-xs text-amber-700">Final completion is blocked until payment is marked paid.</p>
            )}
          </section>
        </div>
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
