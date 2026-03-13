import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { pharmacyApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

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
  isActive: true,
};

export default function PharmacistInventory() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', stockState: '', status: '' });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState('');

  const loadInventory = async () => {
    try {
      const data = await pharmacyApi.getAll(filters);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load inventory.');
    }
  };

  useEffect(() => {
    loadInventory();
  }, [filters.search, filters.status, filters.stockState]);

  const resetForm = () => {
    setEditingId('');
    setForm(initialForm);
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

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Inventory Management</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Medicine inventory</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Maintain stock quantities, prices, activity state, and low-stock thresholds for pharmacist operations.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit medicine' : 'Add medicine'}</h3>
          {[
            ['name', 'Medicine Name'],
            ['manufacturer', 'Manufacturer'],
            ['category', 'Category'],
            ['supplier', 'Supplier'],
            ['batchNumber', 'Batch Number'],
            ['unit', 'Unit'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
              <input value={form[field]} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            </div>
          ))}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['price', 'Unit Price'],
              ['stock', 'Stock'],
              ['lowStockThreshold', 'Low Stock Threshold'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
                <input type="number" value={form[field]} onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))} />
            Active inventory item
          </label>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Clear</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Add Medicine'}</Button>
          </div>
        </form>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Search medicines" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <select value={filters.stockState} onChange={(e) => setFilters((current) => ({ ...current, stockState: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="">All stock states</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" onClick={loadInventory}>Refresh</Button>
          </div>

          <div className="mt-5 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      ₹{Number(item.price || 0).toLocaleString()} • {item.stock} {item.unit}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.manufacturer || 'No manufacturer'} • {item.category || 'No category'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.stockState === 'outOfStock' ? 'bg-red-100 text-red-700' : item.stockState === 'lowStock' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.stockState}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'}`}>
                      {item.isActive ? 'active' : 'inactive'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => {
                    setEditingId(item.id);
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
                      isActive: item.isActive,
                    });
                  }}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
