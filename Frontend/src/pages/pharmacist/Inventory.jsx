import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { pharmacyApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars -- used as motion.section in JSX
import { staggerContainer } from '../../lib/animation-variants.js';

const initialForm = {
  name: '',
  manufacturer: '',
  category: '',
  price: '',
  stock: '',
  lowStockThreshold: '10',
  unit: 'unit',
  supplier: '',
  batchNumber: '',
  expiryDate: '',
  adjustmentNote: '',
  isActive: true,
};

export default function PharmacistInventory() {
  const formRef = useRef(null);
  const ledgerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', stockState: '', status: '' });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState('');
  const [ledger, setLedger] = useState(null);
  const [ledgerFilters, setLedgerFilters] = useState({ startDate: '', endDate: '', type: '' });
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [expiryWindowDays, setExpiryWindowDays] = useState(30);

  const loadInventory = async () => {
    try {
      const data = await pharmacyApi.getAll(filters);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load inventory.');
    }
  };

  const loadLedger = async (medicineId) => {
    if (!medicineId) return;
    try {
      const data = await pharmacyApi.getStockLedger(medicineId, {
        startDate: ledgerFilters.startDate || undefined,
        endDate: ledgerFilters.endDate || undefined,
        type: ledgerFilters.type || undefined,
      });
      setLedger(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load stock ledger.');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInventory();
  }, [filters.search, filters.status, filters.stockState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedMedicine?.id) {
      loadLedger(selectedMedicine.id); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [selectedMedicine?.id, ledgerFilters.startDate, ledgerFilters.endDate, ledgerFilters.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setEditingId('');
    setForm(initialForm);
  };

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToLedger = () => {
    if (ledgerRef.current) {
      ledgerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await pharmacyApi.update(editingId, form);
        toast.success('Medicine updated successfully.');
      } else {
        await pharmacyApi.add(form);
        toast.success('Medicine added successfully.');
      }
      resetForm();
      loadInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save medicine.');
    }
  };

  const now = new Date();
  const expiryWindowMs = expiryWindowDays * 24 * 60 * 60 * 1000;
  const withExpiry = items.filter((item) => item.expiryDate);
  const expiredItems = withExpiry.filter((item) => new Date(item.expiryDate) < now && item.stock > 0);
  const expiringSoonItems = withExpiry.filter((item) => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= now && expiryDate.getTime() - now.getTime() <= expiryWindowMs && item.stock > 0;
  });
  const fefoSuggestions = withExpiry
    .filter((item) => item.stock > 0 && new Date(item.expiryDate) >= now)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 6);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Medicine inventory</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground">{editingId ? 'Edit medicine' : 'Add medicine'}</h3>
          {[
            ['name', 'Medicine Name'],
            ['manufacturer', 'Manufacturer'],
            ['category', 'Category'],
            ['supplier', 'Supplier'],
            ['batchNumber', 'Batch Number'],
            ['unit', 'Unit'],
            ['expiryDate', 'Expiry Date'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
              <input
                type={field === 'expiryDate' ? 'date' : 'text'}
                value={form[field]}
                onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))}
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['price', 'Unit Price'],
              ['stock', 'Stock'],
              ['lowStockThreshold', 'Low Stock Threshold'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
                <input type="number" value={form[field]} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Adjustment note (optional)</label>
            <input value={form.adjustmentNote || ''} onChange={(e) => setForm((current) => ({ ...current, adjustmentNote: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
            Active inventory item
          </label>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Clear</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Add Medicine'}</Button>
          </div>
        </form>

        <section ref={ledgerRef} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Search medicines" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
            <select value={filters.stockState} onChange={(e) => setFilters((current) => ({ ...current, stockState: e.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All stock states</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))} className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" onClick={loadInventory}>Refresh</Button>
          </div>

          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ₹{Number(item.price || 0).toLocaleString()} • {item.stock} {item.unit}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.manufacturer || 'No manufacturer'} • {item.category || 'No category'}
                    </p>
                    {item.expiryDate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Expiry {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.stockState === 'outOfStock' ? 'bg-red-100 text-red-700' : item.stockState === 'lowStock' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.stockState}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? 'bg-muted text-foreground' : 'bg-slate-200 text-muted-foreground'}`}>
                      {item.isActive ? 'active' : 'inactive'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => {
                    setEditingId(item.id);
                    setSelectedMedicine(item);
                    setForm({
                      name: item.name || '',
                      manufacturer: item.manufacturer || '',
                      category: item.category || '',
                      price: item.price ?? '',
                      stock: item.stock ?? '',
                      lowStockThreshold: item.lowStockThreshold ?? 10,
                      unit: item.unit || 'unit',
                      supplier: item.supplier || '',
                      batchNumber: item.batchNumber || '',
                      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
                      adjustmentNote: '',
                      isActive: item.isActive,
                    });
                    loadLedger(item.id);
                    scrollToForm();
                  }}>
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedMedicine(item);
                    loadLedger(item.id);
                    scrollToLedger();
                  }}>
                    View history
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Expiry & FEFO</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">Expiry alerts and FEFO suggestions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Prioritize dispensing medicines with the earliest expiry dates first.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Alert window (days)</label>
            <input
              type="number"
              min="1"
              value={expiryWindowDays}
              onChange={(e) => setExpiryWindowDays(Number(e.target.value || 30))}
              className="w-24 rounded-2xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground">Expired stock</p>
            <div className="mt-3 space-y-2">
              {expiredItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-red-800">{item.name}</p>
                    <p className="text-xs text-red-700">Expired {new Date(item.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-700">{item.stock} {item.unit}</span>
                </div>
              ))}
              {expiredItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No expired stock detected.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground">Expiring soon</p>
            <div className="mt-3 space-y-2">
              {expiringSoonItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-amber-900">{item.name}</p>
                    <p className="text-xs text-amber-700">Expires {new Date(item.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-700">{item.stock} {item.unit}</span>
                </div>
              ))}
              {expiringSoonItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No near-expiry stock in the selected window.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground">FEFO dispensing suggestions</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {fefoSuggestions.map((item) => (
              <div key={item.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Expiry {new Date(item.expiryDate).toLocaleDateString()} • Stock {item.stock} {item.unit}
                </p>
              </div>
            ))}
            {fefoSuggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">No FEFO suggestions available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Inventory Ledger</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              {selectedMedicine ? `${selectedMedicine.name} stock history` : 'Select a medicine to view stock movements'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <input type="date" value={ledgerFilters.startDate} onChange={(e) => setLedgerFilters((current) => ({ ...current, startDate: e.target.value }))} className="rounded-2xl border border-border px-4 py-2 text-sm outline-none focus:border-primary" />
            <input type="date" value={ledgerFilters.endDate} onChange={(e) => setLedgerFilters((current) => ({ ...current, endDate: e.target.value }))} className="rounded-2xl border border-border px-4 py-2 text-sm outline-none focus:border-primary" />
            <select value={ledgerFilters.type} onChange={(e) => setLedgerFilters((current) => ({ ...current, type: e.target.value }))} className="rounded-2xl border border-border px-4 py-2 text-sm outline-none focus:border-primary">
              <option value="">All changes</option>
              <option value="initial">Initial</option>
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
              <option value="sale">Sale</option>
            </select>
            <Button variant="outline" onClick={() => selectedMedicine && loadLedger(selectedMedicine.id)}>Refresh</Button>
          </div>
        </div>

        {!selectedMedicine && (
          <p className="mt-6 text-sm text-muted-foreground">Choose a medicine from inventory to see ledger details.</p>
        )}

        {selectedMedicine && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Current stock</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{ledger?.medicine?.stock ?? selectedMedicine.stock}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total sold</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{ledger?.summary?.totalSold ?? 0}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total restocked</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{ledger?.summary?.totalRestocked ?? 0}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Manual adjustments</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{ledger?.summary?.totalAdjusted ?? 0}</p>
              </div>
            </div>

            <div className="space-y-3">
              {(ledger?.logs || []).map((entry) => (
                <div key={entry._id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-foreground capitalize">{entry.changeType} • {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock {entry.previousStock} → {entry.newStock}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()} • {entry.performedByName || 'System'} ({entry.performedByRole || 'system'})
                      </p>
                      {entry.notes && <p className="mt-1 text-xs text-muted-foreground">{entry.notes}</p>}
                    </div>
                    {entry.referenceType && (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                        {entry.referenceType}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {ledger?.logs?.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No stock movements recorded for this medicine yet.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </motion.section>
  );
}
