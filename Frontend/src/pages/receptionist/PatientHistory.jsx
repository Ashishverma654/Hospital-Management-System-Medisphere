import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { receptionistApi } from '../../services/apiServices.js';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import { toast } from 'sonner';

export default function PatientHistory() {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [autoResolved, setAutoResolved] = useState(false);

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const presetPatientId =
    searchParams.get('patientId') ||
    location.state?.patientId ||
    location.state?.userId ||
    location.state?.patientCode ||
    '';

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const response = await receptionistApi.searchPatients(query);
        setPatients(response.patients || []);
      } catch {
        setPatients([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!presetPatientId) return;
    setSelectedPatientId(presetPatientId);
    if (!searchParams.get('patientId')) {
      setSearchParams({ patientId: presetPatientId });
    }
    loadHistory(
      presetPatientId,
      location.state?.userId,
      location.state?.patientCode
    );
  }, [presetPatientId, location.state?.patientCode, location.state?.userId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!presetPatientId || autoResolved || loadingHistory || history) return;
    if (!patients.length) return;
    const match = patients.find(
      (patient) =>
        [patient.id, patient.userId, patient._id, patient.patientId]
          .filter(Boolean)
          .some((value) => String(value) === String(presetPatientId))
    );
    if (!match) return;
    const resolvedId = match.id || match.userId || match._id || match.patientId;
    if (!resolvedId || String(resolvedId) === String(presetPatientId)) {
      setAutoResolved(true);
      return;
    }
    setAutoResolved(true);
    loadHistory(resolvedId, match.userId, match.patientId);
  }, [autoResolved, history, loadingHistory, patients, presetPatientId]);

  const showPicker = !presetPatientId;

  const loadHistory = async (patientId, fallbackId, fallbackCode) => {
    if (!patientId) return;
    setLoadingHistory(true);
    try {
      const response = await receptionistApi.getPatientHistory(patientId);
      setHistory(response);
    } catch (error) {
      const shouldRetry = (fallbackId && fallbackId !== patientId) || (fallbackCode && fallbackCode !== patientId);
      if (shouldRetry) {
        const nextId = fallbackId && fallbackId !== patientId ? fallbackId : fallbackCode;
        if (nextId) {
          try {
            const retryResponse = await receptionistApi.getPatientHistory(nextId);
            setHistory(retryResponse);
            setSelectedPatientId(nextId);
            return;
          } catch (retryError) {
            toast.error(retryError.response?.data?.message || 'Failed to load patient history.');
            setHistory(null);
          }
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to load patient history.');
        setHistory(null);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setSearchParams({ patientId });
    loadHistory(patientId);
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Receptionist Workflow</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Patient History</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review appointments, admissions, prescriptions, lab activity, and pharmacy orders for a patient (read-only).
        </p>
      </div>

      {showPicker && (
        <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by patient name, patient ID, phone, or email"
            className="w-full rounded-2xl border border-border py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-5 space-y-3">
          {loadingSearch && <p className="text-sm text-muted-foreground">Searching patients...</p>}
          {!loadingSearch && patients.length === 0 && query.trim() && <p className="text-sm text-muted-foreground">No patient matched the search.</p>}
          {patients.map((patient) => {
            const resolvedId = patient.id || patient.userId || patient._id || patient.patientId;
            return (
            <button
              key={resolvedId || patient.id || patient.patientId || patient.email}
              type="button"
              onClick={() => handleSelect(resolvedId)}
              className={`flex w-full flex-col gap-2 rounded-xl border border-border p-4 text-left transition ${
                selectedPatientId === resolvedId ? 'bg-muted/50' : 'hover:bg-muted/30'
              }`}
            >
              <p className="font-semibold text-foreground">{patient.name}</p>
              <p className="text-sm text-muted-foreground">{patient.patientId} • {patient.phone} • {patient.email}</p>
            </button>
          )})}
        </div>
      </article>
      )}

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        {loadingHistory && <p className="text-sm text-muted-foreground">Loading history...</p>}
        {!loadingHistory && !history && (
          <p className="text-sm text-muted-foreground">
            {showPicker ? 'Select a patient to view history.' : 'Loading patient history...'}
          </p>
        )}
        {!loadingHistory && history && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Patient Summary</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{history.patient?.name}</p>
              <p className="text-sm text-muted-foreground">
                {history.patient?.patientId} • {history.patient?.phone} • {history.patient?.email}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {history.patient?.gender || '—'} • {history.patient?.age || '—'} yrs • {history.patient?.bloodGroup || '—'}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-xl border border-border p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Appointments</p>
                <div className="mt-3 space-y-2">
                  {(history.appointments || []).slice(0, 10).map((appt) => (
                    <div key={appt._id} className="rounded-lg border border-border p-3">
                      <p className="font-semibold text-foreground">{appt.date} • {appt.slot}</p>
                      <p className="text-sm text-muted-foreground">{appt.doctorId?.userId?.name || 'Doctor'} • {appt.status}</p>
                    </div>
                  ))}
                  {(history.appointments || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No appointment history found.</p>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admissions</p>
                <div className="mt-3 space-y-2">
                  {(history.admissions || []).slice(0, 10).map((admission) => (
                    <div key={admission._id} className="rounded-lg border border-border p-3">
                      <p className="font-semibold text-foreground">{admission.wardId?.name || 'Ward'} • Bed {admission.bedId?.bedNumber || '—'}</p>
                      <p className="text-sm text-muted-foreground">
                        {admission.status} • {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : '—'}
                      </p>
                      {admission.dischargeDate && (
                        <p className="text-xs text-muted-foreground">Discharged: {new Date(admission.dischargeDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                  {(history.admissions || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No admission history found.</p>
                  )}
                </div>
              </article>
            </div>

            <article className="rounded-xl border border-border p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Prescriptions Summary</p>
              <div className="mt-3 space-y-2">
                {(history.prescriptions || []).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <p className="font-semibold text-foreground">{item.doctor}</p>
                    <p className="text-sm text-muted-foreground">{item.diagnosis || 'No diagnosis'} • {item.status}</p>
                    {item.admissionRecommended && <p className="text-xs text-amber-700">Admission recommended</p>}
                    {item.medicines?.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Medicines: {item.medicines.slice(0, 3).map((med) => med.name).join(', ')}
                        {item.medicines.length > 3 ? '…' : ''}
                      </p>
                    )}
                  </div>
                ))}
                {(history.prescriptions || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No prescription history found.</p>
                )}
              </div>
            </article>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-xl border border-border p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Lab Orders</p>
                <div className="mt-3 space-y-2">
                  {(history.labOrders || []).map((order) => (
                    <div key={order.id} className="rounded-lg border border-border p-3">
                      <p className="font-semibold text-foreground">{order.orderNumber || 'Lab Order'}</p>
                      <p className="text-sm text-muted-foreground">{order.status} • {order.doctor || 'Doctor'}</p>
                    </div>
                  ))}
                  {(history.labOrders || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No lab orders found.</p>
                  )}
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Lab Reports</p>
                <div className="mt-3 space-y-2">
                  {(history.labReports || []).map((report) => (
                    <div key={report.id} className="rounded-lg border border-border p-3">
                      <p className="font-semibold text-foreground">{report.reportName || 'Lab Report'}</p>
                      <p className="text-sm text-muted-foreground">{report.status} • {report.doctor || 'Doctor'}</p>
                    </div>
                  ))}
                  {(history.labReports || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No lab reports found.</p>
                  )}
                </div>
              </article>
            </div>

            <article className="rounded-xl border border-border p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Medicine Orders</p>
              <div className="mt-3 space-y-2">
                {(history.pharmacyOrders || []).map((order) => (
                  <div key={order.id} className="rounded-lg border border-border p-3">
                    <p className="font-semibold text-foreground">
                      {order.items?.length || 0} items • ₹{order.total ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.status} • {order.paymentStatus}</p>
                  </div>
                ))}
                {(history.pharmacyOrders || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No pharmacy orders found.</p>
                )}
              </div>
            </article>
          </div>
        )}
      </section>
    </motion.section>
  );
}
