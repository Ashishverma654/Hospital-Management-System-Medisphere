import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function NursePatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await nurseApi.getAssignedPatients();
        const list = Array.isArray(data) ? data : [];
        setPatients(list);
        if (!selectedPatientId && list.length) {
          setSelectedPatientId(list[0].id);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load assigned patients.');
      }
    };

    load();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.toLowerCase();
    return patients.filter((patient) => {
      const text = [
        patient.name,
        patient.patientId,
        patient.assignedDoctor?.name,
        patient.diagnosisSummary,
        patient.ward?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !query || text.includes(query);
    });
  }, [patients, search]);

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ||
    patients.find((patient) => patient.id === selectedPatientId) ||
    null;

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Assigned Scope</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Assigned patients</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review your assigned patients, active medication context, allergies, diagnosis notes, lab visibility, and latest vitals.
        </p>
      </div>

      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patient, ID, doctor, diagnosis, or ward"
          className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Patient Load</p>
          <div className="mt-4 space-y-3">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => setSelectedPatientId(patient.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedPatientId === patient.id ? 'border-slate-900 bg-muted/50' : 'border-border bg-card hover:border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{patient.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {patient.patientId || 'No patient ID'} • {patient.age ?? '—'} yrs • {patient.gender || '—'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {patient.ward?.name || 'No ward'} {patient.bed?.bedNumber ? `• Bed ${patient.bed.bedNumber}` : ''}
                    </p>
                  </div>
                  {patient.pendingLabOrders?.length > 0 && (
                    <StatusBadge status="urgent">Lab pending</StatusBadge>
                  )}
                </div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No assigned patients match the current search.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          {!selectedPatient && <div className="py-24 text-center text-muted-foreground">Select a patient to review their nursing care context.</div>}
          {selectedPatient && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Patient Summary</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">{selectedPatient.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPatient.patientId || 'No patient ID'} • {selectedPatient.assignedDoctor?.name || 'No assigned doctor visible'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">Diagnosis summary</p>
                  <p className="mt-2 text-sm text-foreground">{selectedPatient.diagnosisSummary || 'No diagnosis summary available.'}</p>
                </article>
                <article className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">Ward and bed</p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedPatient.ward?.name || 'No ward'}
                    {selectedPatient.bed?.bedNumber ? ` • Bed ${selectedPatient.bed.bedNumber}` : ''}
                  </p>
                </article>
              </div>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Risk and history</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Allergies</p>
                    <p className="mt-2 text-sm text-foreground">
                      {selectedPatient.allergies?.length ? selectedPatient.allergies.join(', ') : 'No allergies recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chronic diseases</p>
                    <p className="mt-2 text-sm text-foreground">
                      {selectedPatient.chronicDiseases?.length ? selectedPatient.chronicDiseases.join(', ') : 'No chronic diseases recorded'}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">Doctor instructions and medications</p>
                <div className="mt-3 space-y-3">
                  {(selectedPatient.medicationSummary || []).map((medicine, index) => (
                    <div key={`${selectedPatient.id}-med-${index}`} className="rounded-xl bg-muted/50 p-4">
                      <p className="font-medium text-foreground">{medicine.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {medicine.dosage || 'Dose not set'} • {medicine.frequency || 'Frequency not set'} • {medicine.duration || 'Duration not set'}
                      </p>
                      {medicine.instructions && <p className="mt-1 text-sm text-muted-foreground">{medicine.instructions}</p>}
                    </div>
                  ))}
                  {selectedPatient.medicationSummary?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active prescription medicines are visible for this patient.</p>
                  )}
                </div>
                {selectedPatient.activePrescription && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-foreground">
                    <p><span className="font-semibold">Advice:</span> {selectedPatient.activePrescription.advice || 'No advice recorded.'}</p>
                    <p className="mt-2">
                      <span className="font-semibold">Admission recommendation:</span>{' '}
                      {selectedPatient.activePrescription.admissionRecommended ? 'Recommended' : 'Not marked'}
                    </p>
                  </div>
                )}
              </article>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">Pending lab visibility</p>
                  <div className="mt-3 space-y-2">
                    {(selectedPatient.pendingLabOrders || []).map((order) => (
                      <div key={order.id} className="rounded-xl bg-muted/50 p-3">
                        <p className="text-sm font-medium text-foreground">{order.tests.join(', ') || 'Lab order'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.orderNumber || order.id} • {order.status} • {order.urgency || 'routine'}
                        </p>
                      </div>
                    ))}
                    {selectedPatient.pendingLabOrders?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No pending lab work is visible right now.</p>
                    )}
                  </div>
                </article>

                <article className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">Latest vitals</p>
                  {selectedPatient.latestVitals ? (
                    <div className="mt-3 space-y-2 text-sm text-foreground">
                      <p>Recorded: {new Date(selectedPatient.latestVitals.recordedAt).toLocaleString()}</p>
                      <p>BP: {selectedPatient.latestVitals.bloodPressure || '—'}</p>
                      <p>Pulse: {selectedPatient.latestVitals.pulse || '—'}</p>
                      <p>Temperature: {selectedPatient.latestVitals.temperature || '—'}</p>
                      <p>SpO2: {selectedPatient.latestVitals.spo2 || '—'}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No vitals have been recorded yet.</p>
                  )}
                </article>
              </div>
            </div>
          )}
        </section>
      </div>
    </motion.section>
  );
}
