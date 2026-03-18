import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, wardApi, departmentApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialBedForm = {
  wardId: '',
  bedNumber: '',
  status: 'available',
  customPriceOverride: '',
};

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showBedForm, setShowBedForm] = useState(false);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [bedForm, setBedForm] = useState(initialBedForm);
  const [editingBed, setEditingBed] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [admissionForm, setAdmissionForm] = useState({ patientId: '', prescriptionId: '' });
  const [saving, setSaving] = useState(false);

  const loadWards = async () => {
    try {
      const data = await wardApi.getAll({ isActive: true });
      setWards(Array.isArray(data) ? data : []);
    } catch {
      setWards([]);
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

  const loadBeds = async () => {
    try {
      const data = await bedApi.getAll({
        search,
        wardId: filterWard || undefined,
        status: filterStatus || undefined,
      });
      let list = Array.isArray(data) ? data : [];
      if (filterDepartment && !filterWard) {
        const wardIdSet = new Set(wardOptions.map((ward) => ward._id));
        list = list.filter((bed) => wardIdSet.has(bed.wardId?._id || bed.wardId));
      }
      setBeds(list);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load beds.');
    }
  };

  const loadCandidates = async (searchValue = '') => {
    try {
      const data = await bedApi.getAdmissionCandidates({ search: searchValue || undefined });
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admission candidates.');
    }
  };

  useEffect(() => {
    loadWards();
    loadDepartments();
  }, []);

  useEffect(() => {
    loadBeds();
  }, [search, filterWard, filterStatus, filterDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDepartmentId = (ward) => ward.departmentId?._id || ward.departmentId || '';
  const wardOptions = filterDepartment
    ? wards.filter((ward) => getDepartmentId(ward) === filterDepartment)
    : wards;

  useEffect(() => {
    if (filterWard && !wardOptions.some((ward) => ward._id === filterWard)) {
      setFilterWard('');
    }
  }, [filterDepartment, wards]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showAdmitForm) {
      loadCandidates(candidateSearch);
    }
  }, [showAdmitForm, candidateSearch]);

  const openCreate = () => {
    setEditingBed(null);
    setBedForm(initialBedForm);
    setShowBedForm(true);
  };

  const openEdit = (bed) => {
    setEditingBed(bed);
    setBedForm({
      wardId: bed.wardId?._id || '',
      bedNumber: bed.bedNumber || '',
      status: bed.status || 'available',
      customPriceOverride: bed.customPriceOverride ?? '',
    });
    setShowBedForm(true);
  };

  const openAdmit = (bed) => {
    setSelectedBed(bed);
    setAdmissionForm({ patientId: '', prescriptionId: '' });
    setShowAdmitForm(true);
    setCandidateSearch('');
  };

  const submitBed = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...bedForm,
      customPriceOverride: bedForm.customPriceOverride === '' ? undefined : Number(bedForm.customPriceOverride),
    };

    try {
      if (editingBed) {
        await bedApi.update(editingBed._id, payload);
        toast.success('Bed updated successfully.');
      } else {
        await bedApi.add(payload);
        toast.success('Bed created successfully.');
      }
      setShowBedForm(false);
      setBedForm(initialBedForm);
      setEditingBed(null);
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bed.');
    } finally {
      setSaving(false);
    }
  };

  const submitAdmission = async (event) => {
    event.preventDefault();
    if (!selectedBed) return;

    try {
      await bedApi.assign(selectedBed._id, admissionForm);
      toast.success('Patient admitted successfully.');
      setShowAdmitForm(false);
      setSelectedBed(null);
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to admit patient.');
    }
  };

  const discharge = async (bed) => {
    try {
      await bedApi.discharge(bed._id);
      toast.success('Patient discharged successfully.');
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to discharge patient.');
    }
  };

  const updateStatus = async (bed, status) => {
    try {
      await bedApi.update(bed._id, { status });
      toast.success('Bed status updated.');
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bed status.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Inpatient Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Bed management</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage beds by ward, update operational status, assign patients to available beds, and discharge admitted patients safely.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bed
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bed number or ward" className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select
          value={filterDepartment}
          onChange={(event) => {
            setFilterDepartment(event.target.value);
            setFilterWard('');
          }}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All wards</option>
          {wardOptions.map((ward) => (
            <option key={ward._id} value={ward._id}>
              {ward.name}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
        <Button type="button" variant="outline" onClick={loadBeds}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Bed</th>
                <th className="px-4 py-3 font-medium">Ward</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Effective Price</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {beds.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No beds found for the selected filters.</td>
                </tr>
              )}
              {beds.map((bed) => (
                <tr key={bed._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{bed.bedNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{bed.type}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bed.wardId?.name || bed.ward} {bed.wardId?.wardNumber ? `• ${bed.wardId.wardNumber}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-foreground">{bed.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bed.patient ? (
                      <>
                        <p>{bed.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{bed.patient.patientId || 'No patient ID'}</p>
                      </>
                    ) : (
                      'Vacant'
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">₹{Number(bed.effectivePrice || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(bed)}>Edit</Button>
                      {bed.status === 'available' && <Button size="sm" onClick={() => openAdmit(bed)}>Admit</Button>}
                      {bed.status === 'occupied' && <Button size="sm" variant="destructive" onClick={() => discharge(bed)}>Discharge</Button>}
                      {bed.status !== 'occupied' && bed.status !== 'maintenance' && <Button size="sm" variant="outline" onClick={() => updateStatus(bed, 'maintenance')}>Maintenance</Button>}
                      {bed.status !== 'occupied' && bed.status !== 'reserved' && <Button size="sm" variant="outline" onClick={() => updateStatus(bed, 'reserved')}>Reserve</Button>}
                      {bed.status !== 'occupied' && bed.status !== 'available' && <Button size="sm" variant="outline" onClick={() => updateStatus(bed, 'available')}>Mark Available</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {showBedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitBed} className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingBed ? 'Edit Bed' : 'Add Bed'}</h3>
              <button type="button" onClick={() => setShowBedForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Ward">
                <select value={bedForm.wardId} onChange={(event) => {
                  const selectedWard = wards.find(w => w._id === event.target.value);
                  setBedForm((current) => ({ ...current, wardId: event.target.value, _wardCode: selectedWard?.wardCode || selectedWard?.wardNumber || '' }));
                }} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>
                      {ward.name} ({ward.wardCode || ward.wardNumber})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Bed Number ${editingBed ? '' : '(optional – auto-generated if empty)'}`}>
                <input type="text" value={bedForm.bedNumber} onChange={(event) => setBedForm((current) => ({ ...current, bedNumber: event.target.value }))} placeholder={bedForm._wardCode ? `e.g. BED-${bedForm._wardCode}-N` : 'Auto-generated'} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
              <Field label="Status">
                <select value={bedForm.status} onChange={(event) => setBedForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </Field>
              <Field label="Custom price override">
                <input type="number" min="0" value={bedForm.customPriceOverride} onChange={(event) => setBedForm((current) => ({ ...current, customPriceOverride: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBedForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingBed ? 'Save Changes' : 'Create Bed'}</Button>
            </div>
          </form>
        </div>
      )}

      {showAdmitForm && selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitAdmission} className="w-full max-w-3xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Admit patient to Bed {selectedBed.bedNumber}</h3>
              <button type="button" onClick={() => setShowAdmitForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-4">
              <input type="text" value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="Search patient by name, ID, phone, or email" className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
            </div>

            <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={candidate.isCurrentlyAdmitted}
                  onClick={() => setAdmissionForm({ patientId: candidate.id, prescriptionId: candidate.admissionRecommendation?.prescriptionId || '' })}
                  className={`w-full rounded-xl border p-4 text-left ${candidate.isCurrentlyAdmitted ? 'cursor-not-allowed border-border bg-muted opacity-70' : admissionForm.patientId === candidate.id ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.patientId || 'No patient ID'} • {candidate.phone || 'No phone'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.isCurrentlyAdmitted ? 'Already admitted' : 'Not currently admitted'}
                      </p>
                    </div>
                    {candidate.admissionRecommendation && (
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-foreground">
                        <p className="font-semibold">Doctor recommendation visible</p>
                        <p className="mt-1">{candidate.admissionRecommendation.doctor?.name || 'Doctor'} recommended admission.</p>
                      </div>
                    )}
                  </div>
                  {candidate.admissionRecommendation?.admissionRecommendationNotes && (
                    <p className="mt-3 text-sm text-muted-foreground">{candidate.admissionRecommendation.admissionRecommendationNotes}</p>
                  )}
                </button>
              ))}
              {candidates.length === 0 && <p className="text-sm text-muted-foreground">No admission candidates found.</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdmitForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={!admissionForm.patientId}>Confirm Admission</Button>
            </div>
          </form>
        </div>
      )}
    </motion.section>
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
