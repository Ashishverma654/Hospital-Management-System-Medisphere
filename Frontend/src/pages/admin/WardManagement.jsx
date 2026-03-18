import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { locationApi, wardApi, departmentApi, doctorApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, UserCheck, UserX, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const EQUIPMENT_OPTIONS = [
  "Ventilator", "Heart Monitor", "Infusion Pump", "Defibrillator", "Oxygen Concentrator",
  "Suction Machine", "Pulse Oximeter", "ECG Machine", "Nebulizer", "Blood Pressure Monitor",
  "Patient Bed (Electric)", "Wheelchair", "Stretcher", "IV Stand", "Crash Cart",
];

const initialForm = {
  name: '',
  wardNumber: '',
  wardCode: '',
  wardType: 'general',
  departmentId: '',
  floor: '',
  block: '',
  bedCount: '',
  occupiedBeds: 0,
  defaultPrice: '',
  hospitalLocationId: '',
  wardInCharge: '',
  assignedDoctor: '',
  nurseCount: '',
  equipment: [],
  cleaningStatus: 'clean',
  lastSanitized: '',
  contactNumber: '',
};

export default function WardManagement() {
  const [wards, setWards] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedWardDetail, setSelectedWardDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterWardId, setFilterWardId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [bedPreview, setBedPreview] = useState([]);
  const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

  // Bed Preview Logic
  useEffect(() => {
    if (!showForm) return;

    // Auto-generate wardCode
    const autoCode = (form.wardNumber || '').trim().toUpperCase().replace(/\s+/g, '-');
    if (!editingItem && autoCode !== form.wardCode) {
      setForm(prev => ({ ...prev, wardCode: autoCode }));
    }

    // Generate Preview
    const code = form.wardCode || autoCode || 'WARD';
    const count = parseInt(form.bedCount) || 0;
    const previews = [];
    const maxPreview = Math.min(count, 10);
    
    for (let i = 1; i <= maxPreview; i++) {
      previews.push(`BED-${code}-${i}`);
    }
    setBedPreview(previews);
  }, [form.wardNumber, form.wardCode, form.bedCount, showForm, editingItem]);

  // Validation Logic
  useEffect(() => {
    const newErrors = {};
    if (showForm) {
      if (!form.name.trim()) newErrors.name = 'Ward name is required';
      if (!form.wardNumber.trim()) newErrors.wardNumber = 'Ward number is required';
      
      const beds = parseInt(form.bedCount);
      if (isNaN(beds) || beds <= 0) {
        newErrors.bedCount = 'Total beds must be greater than 0';
      }

      const price = parseFloat(form.defaultPrice);
      if (isNaN(price) || price <= 0) {
        newErrors.defaultPrice = 'Price must be a positive number';
      }

      if (form.contactNumber && !/^\+?[0-9\s-]{10,15}$/.test(form.contactNumber)) {
        newErrors.contactNumber = 'Enter a valid 10-15 digit phone number';
      }
    }
    setErrors(newErrors);
  }, [form, showForm]);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyWardName, setHistoryWardName] = useState('');

  const loadWards = async () => {
    setLoading(true);
    try {
      const data = await wardApi.getAll({
        search,
        isActive: filterStatus || undefined,
        departmentId: filterDepartment || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setWards(list);
      const nextList = list.filter((ward) => {
        if (filterDepartment && (ward.departmentId?._id || ward.departmentId) !== filterDepartment) return false;
        if (filterWardId && ward._id !== filterWardId) return false;
        return true;
      });
      if (!selectedWardId && nextList.length) {
        setSelectedWardId(nextList[0]._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load wards.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationApi.getAll({ isActive: true });
      setLocations(Array.isArray(data) ? data : []);
    } catch {
      setLocations([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll({ isActive: true });
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getAdminAll({ isActive: true });
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setDoctors([]);
    }
  };

  const loadWardDetail = async (wardId) => {
    if (!wardId) {
      setSelectedWardDetail(null);
      return;
    }
    try {
      const data = await wardApi.getById(wardId);
      setSelectedWardDetail(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load ward detail.');
    }
  };

  const getDepartmentId = (ward) => ward.departmentId?._id || ward.departmentId || '';
  const wardOptions = filterDepartment
    ? wards.filter((ward) => getDepartmentId(ward) === filterDepartment)
    : wards;

  const filteredWards = wards.filter((ward) => {
    if (filterDepartment && getDepartmentId(ward) !== filterDepartment) return false;
    if (filterWardId && ward._id !== filterWardId) return false;
    return true;
  });

  useEffect(() => {
    loadWards();
    loadLocations();
    loadDepartments();
    loadDoctors();
  }, [search, filterStatus, filterDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filterWardId && !wardOptions.some((ward) => ward._id === filterWardId)) {
      setFilterWardId('');
    }
  }, [filterDepartment, wards]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedWardId && !filteredWards.some((ward) => ward._id === selectedWardId)) {
      const nextWardId = filteredWards[0]?._id || '';
      setSelectedWardId(nextWardId);
      return;
    }
    loadWardDetail(selectedWardId);
  }, [selectedWardId, filterDepartment, filterWardId, wards]); // eslint-disable-line react-hooks/exhaustive-deps  

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
    setSubmitAttempted(false);
  };

  const handleViewHistory = async (ward) => {
    setHistoryWardName(ward.name);
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const data = await wardApi.getHistory(ward._id);
      setHistoryLogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load ward history.');
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return toast.error('Please fix the errors before saving.');
    const bedCount = Number(form.bedCount || 0);
    const occupiedBeds = Number(form.occupiedBeds || 0);

    if (occupiedBeds > bedCount) {
      return toast.error('Occupied beds cannot exceed total bed count.');
    }

    setSaving(true);
    const wardCode = (form.wardCode || form.wardNumber || '').toUpperCase().replace(/\s+/g, '-');
    const payload = {
      ...form,
      wardCode,
      bedCount,
      occupiedBeds,
      defaultPrice: Number(form.defaultPrice || 0),
      nurseCount: Number(form.nurseCount || 0),
      hospitalLocationId: form.hospitalLocationId || undefined,
      departmentId: form.departmentId || undefined,
      wardInCharge: form.wardInCharge || undefined,
      assignedDoctor: isObjectId(form.assignedDoctor) ? form.assignedDoctor : undefined,
      lastSanitized: form.lastSanitized || undefined,
    };

    try {
      if (editingItem) {
        await wardApi.update(editingItem._id, payload);
        toast.success('Ward updated successfully.');
      } else {
        await wardApi.create(payload);
        toast.success('Ward created with auto-generated beds.');
      }
      resetForm();
      await loadWards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save ward.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ward) => {
    try {
      await wardApi.toggleActive(ward._id);
      toast.success(`${ward.name} has been ${ward.isActive ? 'deactivated' : 'activated'}.`);
      await loadWards();
      if (selectedWardId === ward._id) {
        await loadWardDetail(ward._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ward status.');
    }
  };

  const availableBeds = Math.max(0, Number(form.bedCount || 0) - Number(form.occupiedBeds || 0));

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Inpatient Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Ward management</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage wards with auto-generated beds, occupancy tracking, department linking, and ward-level configurations.
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setForm(initialForm); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ward
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ward name, number, floor, or block"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(event) => {
            setFilterDepartment(event.target.value);
            setFilterWardId('');
          }}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select
          value={filterWardId}
          onChange={(event) => setFilterWardId(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All wards</option>
          {wardOptions.map((ward) => (
            <option key={ward._id} value={ward._id}>{ward.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadWards}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Ward</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Beds</th>
                  <th className="px-4 py-3 font-medium">Default Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading wards...</td>
                  </tr>
                )}
                {!loading && filteredWards.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No wards found.</td>
                  </tr>
                )}
                {filteredWards.map((ward) => (
                  <tr key={ward._id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <button type="button" className="text-left" onClick={() => setSelectedWardId(ward._id)}>
                        <p className="font-medium text-foreground">{ward.name}</p>
                        <p className="text-xs text-muted-foreground">{ward.wardCode || ward.wardNumber}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{ward.wardType}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="text-xs">{ward.bedSummary?.occupiedBeds || 0} occ</span> / {ward.bedCount || 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">₹{Number(ward.defaultPrice || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ward.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {ward.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(ward);
                            setForm({
                              name: ward.name || '',
                              wardNumber: ward.wardNumber || '',
                              wardCode: ward.wardCode || '',
                              wardType: ward.wardType || 'general',
                              departmentId: ward.departmentId?._id || ward.departmentId || '',
                              floor: ward.floor || '',
                              block: ward.block || '',
                              bedCount: ward.bedCount ?? '',
                              occupiedBeds: ward.occupiedBeds ?? 0,
                              defaultPrice: ward.defaultPrice ?? '',
                              hospitalLocationId: ward.hospitalLocationId?._id || '',
                              wardInCharge: ward.wardInCharge?._id || ward.wardInCharge || '',
                              assignedDoctor: ward.assignedDoctor?._id || ward.assignedDoctor?.id || ward.assignedDoctor || '',
                              nurseCount: ward.nurseCount ?? '',
                              equipment: ward.equipment || [],
                              cleaningStatus: ward.cleaningStatus || 'clean',
                              lastSanitized: ward.lastSanitized ? ward.lastSanitized.slice(0, 10) : '',
                              contactNumber: ward.contactNumber || '',
                            });
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleViewHistory(ward)}>
                          <History className="mr-1 h-3 w-3" /> History
                        </Button>
                        <Button type="button" variant={ward.isActive ? 'destructive' : 'outline'} size="sm" onClick={() => toggleActive(ward)}>
                          {ward.isActive ? <UserX className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                          {ward.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          {!selectedWardDetail && <div className="py-24 text-center text-muted-foreground">Select a ward to review its occupancy and bed setup.</div>}
          {selectedWardDetail && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Ward Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedWardDetail.ward.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedWardDetail.ward.wardCode || selectedWardDetail.ward.wardNumber} • {selectedWardDetail.ward.wardType}
                  {selectedWardDetail.ward.floor ? ` • Floor ${selectedWardDetail.ward.floor}` : ''}
                  {selectedWardDetail.ward.block ? ` • Block ${selectedWardDetail.ward.block}` : ''}
                </p>
                {selectedWardDetail.ward.contactNumber && (
                  <p className="mt-1 text-sm text-muted-foreground">📞 {selectedWardDetail.ward.contactNumber}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <StatCard label="Default price" value={`₹${Number(selectedWardDetail.ward.defaultPrice || 0).toLocaleString()}`} />
                <StatCard label="Total beds" value={selectedWardDetail.ward.bedCount || 0} />
                <StatCard label="Available beds" value={selectedWardDetail.ward.availableBeds ?? (selectedWardDetail.ward.bedSummary?.availableBeds || 0)} />
                <StatCard label="Occupied beds" value={selectedWardDetail.ward.occupiedBeds || selectedWardDetail.ward.bedSummary?.occupiedBeds || 0} />
              </div>

              {(selectedWardDetail.ward.equipment?.length > 0) && (
                <div>
                  <p className="font-semibold text-foreground mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWardDetail.ward.equipment.map((eq) => (
                      <span key={eq} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{eq}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-foreground">Beds in this ward</p>
                <div className="mt-3 space-y-3">
                  {(selectedWardDetail.beds || []).map((bed) => (
                    <div key={bed._id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-medium text-foreground">Bed {bed.bedNumber}</p>
                          <p className="mt-1 text-sm text-muted-foreground capitalize">{bed.status}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Price ₹{Number(bed.effectivePrice || 0).toLocaleString()}
                            {bed.patient ? ` • ${bed.patient.name} (${bed.patient.patientId || 'No ID'})` : ''}
                          </p>
                        </div>
                        {bed.admittedAt && (
                          <span className="text-xs text-muted-foreground">
                            Admitted {new Date(bed.admittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedWardDetail.beds?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No beds are linked to this ward yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Ward Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingItem ? 'Edit Ward' : 'Add Ward'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Ward Name *" error={submitAttempted ? errors.name : null}>
                <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.name) ? 'border-red-500' : 'border-border'}`} required />
              </Field>
              <Field label="Ward Number *" error={submitAttempted ? errors.wardNumber : null}>
                <input type="text" value={form.wardNumber} onChange={(e) => setForm((c) => ({ ...c, wardNumber: e.target.value }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.wardNumber) ? 'border-red-500' : 'border-border'}`} required />
              </Field>
              <Field label="Ward Code (unique)">
                <input type="text" value={form.wardCode} onChange={(e) => setForm((c) => ({ ...c, wardCode: e.target.value.toUpperCase() }))} placeholder="Auto from ward number" className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Total Beds *" error={submitAttempted ? errors.bedCount : null}>
                <input type="number" min="1" value={form.bedCount} onChange={(e) => setForm((c) => ({ ...c, bedCount: e.target.value }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.bedCount) ? 'border-red-500' : 'border-border'}`} required />
              </Field>
              <Field label="Default Bed Price *" error={submitAttempted ? errors.defaultPrice : null}>
                <input type="number" min="0" value={form.defaultPrice} onChange={(e) => setForm((c) => ({ ...c, defaultPrice: e.target.value }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.defaultPrice) ? 'border-red-500' : 'border-border'}`} required />
              </Field>
            </div>

            {/* Bed Prefix Preview */}
            <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/20 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Auto Bed Preview</p>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Live Sync</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {bedPreview.map((id, idx) => (
                  <span key={idx} className="rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] font-bold text-primary shadow-sm">
                    {id}
                  </span>
                ))}
                {parseInt(form.bedCount) > 10 && (
                  <span className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                    ...and {parseInt(form.bedCount) - 10} more
                  </span>
                )}
                {bedPreview.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Enter Ward Number and Total Beds to preview Bed IDs</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * Bed IDs are generated using the pattern: BED-&#123;WARDCODE&#125;-&#123;NUMBER&#125;
              </p>
            </div>

            {/* Capacity Indicator */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
               <div className="flex items-center justify-between bg-muted/30 px-5 py-3 border-b border-border">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Capacity Indicator</p>
                  <div className="flex items-center gap-4">
                     <p className="text-xs font-bold">Occupied: <span className="text-red-500 font-mono">{form.occupiedBeds || 0}</span></p>
                     <p className="text-xs font-bold">Available: <span className="text-emerald-500 font-mono">{availableBeds}</span></p>
                  </div>
               </div>
               <div className="p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                     <span>Capacity Usage</span>
                     <span>{Math.round(((form.occupiedBeds || 0) / (parseInt(form.bedCount) || 1)) * 100)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                     <div 
                        className={`h-full transition-all duration-500 ease-out rounded-full ${availableBeds > 0 ? 'bg-primary' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, ((form.occupiedBeds || 0) / (parseInt(form.bedCount) || 1)) * 100)}%` }}
                     />
                  </div>
               </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Ward Type *">
                <select value={form.wardType} onChange={(e) => setForm((c) => ({ ...c, wardType: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="general">General</option>
                  <option value="semi-private">Semi-private</option>
                  <option value="private">Private</option>
                  <option value="icu">ICU</option>
                  <option value="nicu">NICU</option>
                  <option value="picu">PICU</option>
                  <option value="emergency">Emergency</option>
                  <option value="maternity">Maternity</option>
                  <option value="isolation">Isolation</option>
                </select>
              </Field>
              <Field label="Department">
                <select value={form.departmentId} onChange={(e) => setForm((c) => ({ ...c, departmentId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <select value={form.hospitalLocationId} onChange={(e) => setForm((c) => ({ ...c, hospitalLocationId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>{location.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Floor"><input type="text" value={form.floor} onChange={(e) => setForm((c) => ({ ...c, floor: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Block"><input type="text" value={form.block} onChange={(e) => setForm((c) => ({ ...c, block: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
            </div>

            {/* Available beds readout */}
            <div className="mt-4 flex items-center gap-6 rounded-xl bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Available Beds: <span className="font-bold text-primary">{availableBeds}</span></p>
              <p className="text-sm text-muted-foreground">Occupied: <span className="font-bold text-foreground">{form.occupiedBeds || 0}</span></p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Ward In-Charge">
                <input type="text" value={form.wardInCharge} onChange={(e) => setForm((c) => ({ ...c, wardInCharge: e.target.value }))} placeholder="User ID (optional)" className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
              <Field label="Assigned Doctor">
                <select
                  value={form.assignedDoctor}
                  onChange={(e) => setForm((c) => ({ ...c, assignedDoctor: e.target.value }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id || d.id} value={d._id || d.id || ''}>
                      {d.userId?.name || d.name || d._id}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nurse Count"><input type="number" min="0" value={form.nurseCount} onChange={(e) => setForm((c) => ({ ...c, nurseCount: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Cleaning Status">
                <select value={form.cleaningStatus} onChange={(e) => setForm((c) => ({ ...c, cleaningStatus: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="clean">Clean</option>
                  <option value="dirty">Dirty</option>
                  <option value="inProgress">In Progress</option>
                </select>
              </Field>
              <Field label="Last Sanitized"><input type="date" value={form.lastSanitized} onChange={(e) => setForm((c) => ({ ...c, lastSanitized: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Contact Number" error={submitAttempted ? errors.contactNumber : null}><input type="text" value={form.contactNumber} onChange={(e) => setForm((c) => ({ ...c, contactNumber: e.target.value }))} placeholder="Ward phone" className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.contactNumber) ? 'border-red-500' : 'border-border'}`} /></Field>
            </div>

            {/* Equipment multi-select */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-foreground">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => {
                  const selected = form.equipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      onClick={() => {
                        setForm((c) => ({
                          ...c,
                          equipment: selected ? c.equipment.filter((e) => e !== eq) : [...c.equipment, eq],
                        }));
                      }}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving || (submitAttempted && Object.keys(errors).length > 0)}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Ward'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">Audit History — {historyWardName}</h3>
                <button type="button" onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {historyLoading && <p className="text-center py-8 text-muted-foreground">Loading history...</p>}
              {!historyLoading && historyLogs.length === 0 && <p className="text-center py-8 text-muted-foreground">No history available.</p>}
              {!historyLoading && historyLogs.length > 0 && (
                <div className="space-y-3">
                  {historyLogs.map((log) => (
                    <div key={log._id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground capitalize">{log.action?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {log.actor?.name || 'System'} ({log.actor?.role || 'N/A'})
                          </p>
                          {log.details && (
                            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                              {Object.entries(log.details).map(([key, val]) => (
                                <p key={key}><span className="font-medium">{key}:</span> {typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Field({ children, className = '', label, error }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-[11px] font-bold text-red-500 italic pl-1 flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-red-500" /> {error}
      </p>}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}
