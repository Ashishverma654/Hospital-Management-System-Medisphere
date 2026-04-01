import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, wardApi, departmentApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function AdmissionManagement() {
  const [summary, setSummary] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const admissionsRef = useRef(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [beds, setBeds] = useState([]);
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    departmentId: '',
    wardId: '',
    bedId: '',
    reason: '',
    notes: '',
  });
  const [transferForm, setTransferForm] = useState({
    fromBedId: '',
    toWardId: '',
    toBedId: '',
    notes: '',
  });

  const load = useCallback(async () => {
    try {
      const [summaryData, admissionsData, wardsData, departmentsData] = await Promise.all([
        wardApi.getSummary(),
        bedApi.getCurrentAdmissions({
          search: search || undefined,
          wardId: filterWard || undefined,
        }),
        wardApi.getAll({}),
        departmentApi.getAll({ isActive: true }),
      ]);
      setSummary(summaryData);
      setAdmissions(Array.isArray(admissionsData) ? admissionsData : []);
      setWards(Array.isArray(wardsData) ? wardsData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load occupancy dashboard.');
    }
  }, [filterWard, search]);

  const loadBedsForWard = useCallback(async (wardId) => {
    if (!wardId) {
      setBeds([]);
      return;
    }
    try {
      const data = await bedApi.getAll({ wardId });
      setBeds(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load beds.');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBedsForWard(admitForm.wardId);
  }, [admitForm.wardId, loadBedsForWard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBedsForWard(transferForm.toWardId);
  }, [transferForm.toWardId, loadBedsForWard]);

  const wardRows = useMemo(() => summary?.wards || [], [summary]);

  const discharge = async (admission) => {
    try {
      await bedApi.discharge(admission.id);
      toast.success('Patient discharged successfully.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to discharge patient.');
    }
  };

  const loadCandidates = async () => {
    try {
      const data = await bedApi.getAdmissionCandidates();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admission candidates.');
    }
  };

  const openAdmit = async () => {
    setAdmitForm({
      patientId: '',
      departmentId: '',
      wardId: '',
      bedId: '',
      reason: '',
      notes: '',
    });
    setBeds([]);
    await loadCandidates();
    setShowAdmitForm(true);
  };

  const submitAdmission = async (autoAssign = false) => {
    try {
      if (!admitForm.patientId || !admitForm.wardId) {
        return toast.error('Patient and ward are required.');
      }
      if (!autoAssign && !admitForm.bedId) {
        return toast.error('Select a bed or use auto assign.');
      }
      if (autoAssign) {
        await bedApi.assignAuto({
          patientId: admitForm.patientId,
          wardId: admitForm.wardId,
          departmentId: admitForm.departmentId || undefined,
          reason: admitForm.reason || undefined,
          notes: admitForm.notes || undefined,
        });
      } else {
        await bedApi.assign(admitForm.bedId, {
          patientId: admitForm.patientId,
          wardId: admitForm.wardId,
          departmentId: admitForm.departmentId || undefined,
          reason: admitForm.reason || undefined,
          notes: admitForm.notes || undefined,
        });
      }
      toast.success('Patient admitted successfully.');
      setShowAdmitForm(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to admit patient.');
    }
  };

  const openTransfer = async (admission) => {
    setTransferForm({
      fromBedId: admission.id,
      toWardId: '',
      toBedId: '',
      notes: '',
    });
    setBeds([]);
    setShowTransferForm(true);
  };

  const submitTransfer = async () => {
    try {
      if (!transferForm.fromBedId || !transferForm.toBedId) {
        return toast.error('Select a target bed to transfer.');
      }
      await bedApi.transfer({
        fromBedId: transferForm.fromBedId,
        toBedId: transferForm.toBedId,
        notes: transferForm.notes || undefined,
      });
      toast.success('Patient transferred successfully.');
      setShowTransferForm(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to transfer patient.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Inpatient Operations</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Admissions and occupancy</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Monitor ward occupancy, current admissions, available capacity, and doctor-linked admission recommendations in one operational view.
        </p>
        <div className="mt-4">
          <Button onClick={openAdmit}>
            <Plus className="mr-2 h-4 w-4" />
            Admit Patient
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total wards" value={summary?.totalWards ?? 0} />
        <SummaryCard label="Total beds" value={summary?.totalBeds ?? 0} />
        <SummaryCard label="Available" value={summary?.availableBeds ?? 0} />
        <SummaryCard label="Occupied" value={summary?.occupiedBeds ?? 0} />
        <SummaryCard label="Maintenance" value={summary?.maintenanceBeds ?? 0} />
        <SummaryCard label="Reserved" value={summary?.reservedBeds ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Ward-wise occupancy</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Capacity by ward</h3>
            </div>
            <Button type="button" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {wardRows.map((ward) => (
              <button
                key={ward._id}
                type="button"
                onClick={() => {
                  setFilterWard(ward._id);
                  requestAnimationFrame(() => {
                    admissionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }}
                className="w-full rounded-xl border border-border p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{ward.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ward.wardNumber} • {ward.wardType}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{ward.bedSummary?.occupiedBeds || 0}/{ward.bedSummary?.totalBeds || 0} occupied</p>
                    <p>₹{Number(ward.defaultPrice || 0).toLocaleString()} default</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm text-muted-foreground">
                  <p>Available: {ward.bedSummary?.availableBeds || 0}</p>
                  <p>Occupied: {ward.bedSummary?.occupiedBeds || 0}</p>
                  <p>Maintenance: {ward.bedSummary?.maintenanceBeds || 0}</p>
                  <p>Reserved: {ward.bedSummary?.reservedBeds || 0}</p>
                </div>
              </button>
            ))}
            {wardRows.length === 0 && <p className="text-sm text-muted-foreground">No ward occupancy data available.</p>}
          </div>
        </article>

        <article ref={admissionsRef} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search admitted patient, ward, doctor, or bed" className="w-full rounded-2xl border border-border py-3 pl-9 pr-4 text-sm outline-none focus:border-primary" />
            </div>
            <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All wards</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {admissions.map((admission) => (
              <article key={admission.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{admission.patient?.name || 'Admitted patient'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {admission.patient?.patientId || 'No ID'} • {admission.ward?.name || 'Ward'} • Bed {admission.bedNumber}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Admitted {admission.admittedAt ? new Date(admission.admittedAt).toLocaleString() : 'Unknown'}
                    </p>
                    {admission.doctor?.name && (
                      <p className="mt-1 text-sm text-muted-foreground">Doctor: {admission.doctor.name}</p>
                    )}
                    {admission.admissionRecommendation?.admissionRecommendationNotes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Recommendation: {admission.admissionRecommendation.admissionRecommendationNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-foreground">
                      {admission.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ₹{Number(admission.effectivePrice || 0).toLocaleString()}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => openTransfer(admission)}>
                      Transfer
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => discharge(admission)}>
                      Discharge
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {admissions.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No current admissions match the selected filters.
              </p>
            )}
          </div>
        </article>
      </div>

      {showAdmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Admit patient</h3>
              <button type="button" onClick={() => setShowAdmitForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Patient">
                <select value={admitForm.patientId} onChange={(e) => setAdmitForm((c) => ({ ...c, patientId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select patient</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.patientId || 'No ID'})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Department">
                <select value={admitForm.departmentId} onChange={(e) => setAdmitForm((c) => ({ ...c, departmentId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ward">
                <select
                  value={admitForm.wardId}
                  onChange={(e) => setAdmitForm((c) => ({ ...c, wardId: e.target.value, bedId: '' }))}
                  className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary"
                >
                  <option value="">Select ward</option>
                  {wards
                    .filter((ward) => !admitForm.departmentId || String(ward.departmentId?._id || ward.departmentId) === String(admitForm.departmentId))
                    .map((ward) => (
                      <option key={ward._id} value={ward._id}>{ward.name}</option>
                    ))}
                </select>
              </Field>
              <Field label="Bed (manual)">
                <select value={admitForm.bedId} onChange={(e) => setAdmitForm((c) => ({ ...c, bedId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select bed</option>
                  {beds.map((bed) => (
                    <option key={bed._id} value={bed._id} disabled={bed.status !== 'available'}>
                      {bed.bedNumber} {bed.status !== 'available' ? '(occupied)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reason">
                <input type="text" value={admitForm.reason} onChange={(e) => setAdmitForm((c) => ({ ...c, reason: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
              <Field label="Notes">
                <input type="text" value={admitForm.notes} onChange={(e) => setAdmitForm((c) => ({ ...c, notes: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Available beds: {beds.filter((bed) => bed.status === 'available').length} / {beds.length}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdmitForm(false)}>Cancel</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => submitAdmission(true)}>Auto Assign Bed</Button>
              <Button type="button" className="flex-1" onClick={() => submitAdmission(false)}>Admit Patient</Button>
            </div>
          </div>
        </div>
      )}

      {showTransferForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Transfer patient</h3>
              <button type="button" onClick={() => setShowTransferForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Target Ward">
                <select value={transferForm.toWardId} onChange={(e) => setTransferForm((c) => ({ ...c, toWardId: e.target.value, toBedId: '' }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>{ward.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Target Bed">
                <select value={transferForm.toBedId} onChange={(e) => setTransferForm((c) => ({ ...c, toBedId: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="">Select bed</option>
                  {beds.map((bed) => (
                    <option key={bed._id} value={bed._id} disabled={bed.status !== 'available'}>
                      {bed.bedNumber} {bed.status !== 'available' ? '(occupied)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Transfer Notes">
                <input type="text" value={transferForm.notes} onChange={(e) => setTransferForm((c) => ({ ...c, notes: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowTransferForm(false)}>Cancel</Button>
              <Button type="button" className="flex-1" onClick={submitTransfer}>Transfer Patient</Button>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-xl bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold text-foreground">{value}</h3>
    </article>
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
