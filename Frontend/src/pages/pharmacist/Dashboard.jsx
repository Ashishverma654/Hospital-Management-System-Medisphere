import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { pharmacistApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

const cards = [
  ['newOrders', 'New Orders'],
  ['acceptedOrders', 'Accepted'],
  ['preparingOrders', 'Preparing'],
  ['readyForPickupOrders', 'Ready for Pickup'],
  ['completedToday', 'Completed Today'],
  ['lowStockMedicines', 'Low Stock'],
  ['outOfStockMedicines', 'Out of Stock'],
];

export default function PharmacistDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setStats(await pharmacistApi.getDashboard());
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load pharmacist dashboard.');
      }
    };

    load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Pharmacy Operations</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Pharmacist dashboard</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Monitor incoming orders, preparation workload, pickup-ready handovers, and stock pressure from one workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([key, label]) => (
          <article key={key} className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">{stats?.[key] ?? '—'}</h3>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Quick Actions</p>
          <div className="mt-4 grid gap-3">
            {(stats?.quickActions || []).map((action) => (
              <Button key={action.path} variant="outline" onClick={() => navigate(action.path)}>
                {action.label}
              </Button>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Inventory Alerts</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Low and out-of-stock medicines</h3>
          <div className="mt-4 space-y-3">
            {(stats?.urgentInventory || []).map((medicine) => (
              <div key={medicine.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{medicine.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Stock: {medicine.stock} • Threshold: {medicine.lowStockThreshold}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${medicine.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {medicine.stock <= 0 ? 'Out of stock' : 'Low stock'}
                  </span>
                </div>
              </div>
            ))}
            {stats?.urgentInventory?.length === 0 && (
              <p className="text-sm text-slate-500">No urgent inventory alerts right now.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
