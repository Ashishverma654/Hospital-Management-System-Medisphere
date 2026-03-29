import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { departmentApi, labTestApi, testPriceApi } from '../../services/apiServices.js';
import { staggerContainer } from '../../lib/animation-variants.js';

const TEST_TYPES = [
  { value: 'BLOOD', label: 'Blood' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'PATHOLOGY', label: 'Pathology' },
  { value: 'OTHER', label: 'Other' },
];

const initialTestForm = {
  name: '',
  testType: 'BLOOD',
  description: '',
  isActive: true,
  price: '',
  department: '',
};

export default function TestPriceManagement() {
  const role = useSelector((state) => state.auth.user?.role);
  const canManageTests = ['admin', 'superadmin'].includes(role);
  const canView = ['admin', 'superadmin'].includes(role);
  const [prices, setPrices] = useState([]);
  const [catalogTests, setCatalogTests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSearch, setTestSearch] = useState('');
  const [testFilterType, setTestFilterType] = useState('');
  const [testFilterStatus, setTestFilterStatus] = useState('');
  const [testsLoading, setTestsLoading] = useState(true);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState(initialTestForm);

  const departmentMap = useMemo(() => {
    const map = new Map();
    departments.forEach((dept) => {
      map.set(String(dept._id), dept.name);
    });
    return map;
  }, [departments]);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await testPriceApi.getAll();
      setPrices(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load test prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [_, deptData] = await Promise.all([
          labTestApi.getAll({ isActive: true }),
          departmentApi.getAll({ isActive: true }),
        ]);
        setDepartments(Array.isArray(deptData) ? deptData : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load reference data.');
      }
    };
    loadReferenceData();
  }, []);

  const loadTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const data = await labTestApi.getAll({
        search: testSearch || undefined,
        testType: testFilterType || undefined,
        isActive: testFilterStatus || undefined,
      });
      setCatalogTests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lab tests.');
    } finally {
      setTestsLoading(false);
    }
  }, [testFilterStatus, testFilterType, testSearch]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const resetTestForm = () => {
    setTestForm(initialTestForm);
    setEditingTest(null);
    setShowTestForm(false);
  };

  const handleTestSubmit = async (event) => {
    event.preventDefault();
    if (!canManageTests) {
      return toast.error('You do not have permission to manage tests.');
    }
    if (!testForm.name.trim()) {
      return toast.error('Test name is required.');
    }
    if (testForm.price === '' || Number.isNaN(Number(testForm.price))) {
      return toast.error('Price is required for every test.');
    }
    setSaving(true);
    try {
      const priceValue = Number(testForm.price);
      const departmentValue = testForm.department || undefined;
      const findExistingPrice = (testId) =>
        prices.find(
          (item) =>
            String(item.testId?._id || item.testId) === String(testId) &&
            String(item.department || '') === String(departmentValue || '')
        );

      if (editingTest) {
        await labTestApi.update(editingTest._id, testForm);
        if (priceValue !== null) {
          const existing = findExistingPrice(editingTest._id);
          if (existing) {
            await testPriceApi.update(existing._id, {
              testId: editingTest._id,
              department: departmentValue,
              price: priceValue,
            });
          } else {
            await testPriceApi.create({
              testId: editingTest._id,
              department: departmentValue,
              price: priceValue,
            });
          }
        }
        toast.success('Test updated successfully.');
      } else {
        const created = await labTestApi.create(testForm);
        const createdId = created?._id || created?.id;
        if (priceValue !== null && createdId) {
          await testPriceApi.create({
            testId: createdId,
            department: departmentValue,
            price: priceValue,
          });
        }
        toast.success('Test created successfully.');
      }
      resetTestForm();
      loadTests();
      loadPrices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lab test.');
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = (value) => TEST_TYPES.find((type) => type.value === value)?.label || value;

  const MotionSection = motion.section;

  return (
    <MotionSection variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Laboratory</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Lab tests & pricing</h2>
        </div>
        {canView && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingTest(null);
                setTestForm(initialTestForm);
                setShowTestForm(true);
              }}
              disabled={!canManageTests}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Test
            </Button>
          </div>
        )}
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Test master</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Lab test catalog</h3>
          </div>
          <Button type="button" variant="outline" onClick={loadTests} className="h-9">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={testSearch}
              onChange={(event) => setTestSearch(event.target.value)}
              placeholder="Search test name"
              className="h-11 w-full rounded-2xl border border-border bg-card pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={testFilterType}
            onChange={(event) => setTestFilterType(event.target.value)}
            className="h-11 min-w-[170px] rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">All types</option>
            {TEST_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <select
            value={testFilterStatus}
            onChange={(event) => setTestFilterStatus(event.target.value)}
            className="h-11 min-w-[170px] rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testsLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading tests...</td>
                </tr>
              )}
              {!testsLoading && catalogTests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No tests found.</td>
                </tr>
              )}
              {catalogTests.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{typeLabel(item.testType)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {canManageTests ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                  const matchedPrice = prices.find((entry) => String(entry.testId?._id || entry.testId) === String(item._id));
                  setEditingTest(item);
                  setTestForm({
                    name: item.name || '',
                    testType: item.testType || 'BLOOD',
                    description: item.description || '',
                    isActive: item.isActive ?? true,
                    price: matchedPrice?.price ?? '',
                    department: matchedPrice?.department || '',
                  });
                  setShowTestForm(true);
                }}
              >
                Edit
              </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {showTestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleTestSubmit} className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingTest ? 'Edit Test' : 'Add Test'}</h3>
              <button type="button" onClick={resetTestForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Test Name">
                <input
                  type="text"
                  value={testForm.name}
                  onChange={(event) => setTestForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </Field>
              <Field label="Test Type">
                <select
                  value={testForm.testType}
                  onChange={(event) => setTestForm((current) => ({ ...current, testType: event.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                >
                  {TEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Description (optional)" className="mt-4">
              <textarea
                value={testForm.description}
                onChange={(event) => setTestForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[120px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
              />
            </Field>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={testForm.price}
                  onChange={(event) => setTestForm((current) => ({ ...current, price: event.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                  required
                />
              </Field>
              <Field label="Department (optional)">
                <select
                  value={testForm.department}
                  onChange={(event) => setTestForm((current) => ({ ...current, department: event.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={testForm.isActive}
                onChange={(event) => setTestForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Test is active
            </label>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetTestForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving || !canManageTests}>
                {saving ? 'Saving...' : editingTest ? 'Save Changes' : 'Create Test'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </MotionSection>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
