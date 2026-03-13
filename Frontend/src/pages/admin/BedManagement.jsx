import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, wardApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search } from 'lucide-react';

const initialBedForm = {
  wardId: '',
  bedNumber: '',
  status: 'available',
  customPriceOverride: '',
};

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState('');
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

  const loadBeds = async () => {
    try {
      const data = await bedApi.getAll({
        search,
        wardId: filterWard || undefined,
        status: filterStatus || undefined,
      });
      setBeds(Array.isArray(data) ? data : []);
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
  }, []);

  useEffect(() => {
    loadBeds();
  }, [search, filterWard, filterStatus]);

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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Inpatient Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Bed management</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bed number or ward" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900" />
        </div>
        <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
          <option value="">All wards</option>
          {wards.map((ward) => (
            <option key={ward._id} value={ward._id}>
              {ward.name}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
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

      <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
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
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No beds found for the selected filters.</td>
                </tr>
              )}
              {beds.map((bed) => (
                <tr key={bed._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{bed.bedNumber}</p>
                    <p className="text-xs text-slate-500 capitalize">{bed.type}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {bed.wardId?.name || bed.ward} {bed.wardId?.wardNumber ? `• ${bed.wardId.wardNumber}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{bed.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {bed.patient ? (
                      <>
                        <p>{bed.patient.name}</p>
                        <p className="text-xs text-slate-500">{bed.patient.patientId || 'No patient ID'}</p>
                      </>
                    ) : (
                      'Vacant'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">₹{Number(bed.effectivePrice || 0).toLocaleString()}</td>
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
          <form onSubmit={submitBed} className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{editingBed ? 'Edit Bed' : 'Add Bed'}</h3>
              <button type="button" onClick={() => setShowBedForm(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Ward">
                <select value={bedForm.wardId} onChange={(event) => setBedForm((current) => ({ ...current, wardId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required>
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>
                      {ward.name} ({ward.wardNumber})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bed number">
                <input type="text" value={bedForm.bedNumber} onChange={(event) => setBedForm((current) => ({ ...current, bedNumber: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" required />
              </Field>
              <Field label="Status">
                <select value={bedForm.status} onChange={(event) => setBedForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </Field>
              <Field label="Custom price override">
                <input type="number" min="0" value={bedForm.customPriceOverride} onChange={(event) => setBedForm((current) => ({ ...current, customPriceOverride: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
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
          <form onSubmit={submitAdmission} className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Admit patient to Bed {selectedBed.bedNumber}</h3>
              <button type="button" onClick={() => setShowAdmitForm(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <div className="mt-4">
              <input type="text" value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="Search patient by name, ID, phone, or email" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900" />
            </div>

            <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={candidate.isCurrentlyAdmitted}
                  onClick={() => setAdmissionForm({ patientId: candidate.id, prescriptionId: candidate.admissionRecommendation?.prescriptionId || '' })}
                  className={`w-full rounded-[1.25rem] border p-4 text-left ${candidate.isCurrentlyAdmitted ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-70' : admissionForm.patientId === candidate.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{candidate.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {candidate.patientId || 'No patient ID'} • {candidate.phone || 'No phone'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {candidate.isCurrentlyAdmitted ? 'Already admitted' : 'Not currently admitted'}
                      </p>
                    </div>
                    {candidate.admissionRecommendation && (
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-slate-700">
                        <p className="font-semibold">Doctor recommendation visible</p>
                        <p className="mt-1">{candidate.admissionRecommendation.doctor?.name || 'Doctor'} recommended admission.</p>
                      </div>
                    )}
                  </div>
                  {candidate.admissionRecommendation?.admissionRecommendationNotes && (
                    <p className="mt-3 text-sm text-slate-600">{candidate.admissionRecommendation.admissionRecommendationNotes}</p>
                  )}
                </button>
              ))}
              {candidates.length === 0 && <p className="text-sm text-slate-500">No admission candidates found.</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdmitForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={!admissionForm.patientId}>Confirm Admission</Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
