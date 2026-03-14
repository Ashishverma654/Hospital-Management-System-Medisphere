import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { pharmacistApi, pharmacyApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

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
  const [recentLedger, setRecentLedger] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, ledgerData] = await Promise.all([
          pharmacistApi.getDashboard(),
          pharmacyApi.getRecentStockLedger({ limit: 6 }),
        ]);
        setStats(dashboardData);
        setRecentLedger(Array.isArray(ledgerData) ? ledgerData : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load pharmacist dashboard.');
      }
    };

    load();
  }, []);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Pharmacy Operations</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Pharmacist dashboard</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Monitor incoming orders, preparation workload, pickup-ready handovers, and stock pressure from one workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([key, label]) => (
          <article key={key} className="rounded-xl bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <h3 className="mt-2 text-3xl font-semibold text-foreground">{stats?.[key] ?? '—'}</h3>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Quick Actions</p>
          <div className="mt-4 grid gap-3">
            {(stats?.quickActions || []).map((action) => (
              <Button key={action.path} variant="outline" onClick={() => navigate(action.path)}>
                {action.label}
              </Button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Inventory Alerts</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">Low and out-of-stock medicines</h3>
          <div className="mt-4 space-y-3">
            {(stats?.urgentInventory || []).map((medicine) => (
              <div key={medicine.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{medicine.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">No urgent inventory alerts right now.</p>
            )}
          </div>
        </article>
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Recent stock movements</p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">Inventory activity</h3>
        <div className="mt-4 space-y-3">
          {recentLedger.map((entry) => (
            <div key={entry._id} className="rounded-xl border border-border p-4">
              <p className="font-medium text-foreground">{entry.medicineId?.name || 'Medicine'} • {entry.changeType}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange} • Stock {entry.previousStock} → {entry.newStock}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()} • {entry.performedByName || 'System'}
              </p>
            </div>
          ))}
          {recentLedger.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent stock movements recorded.</p>
          )}
        </div>
      </article>
    </motion.section>
  );
}
