import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

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
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Assigned Scope</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Assigned patients</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Review your assigned patients, active medication context, allergies, diagnosis notes, lab visibility, and latest vitals.
        </p>
      </div>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patient, ID, doctor, diagnosis, or ward"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Patient Load</p>
          <div className="mt-4 space-y-3">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => setSelectedPatientId(patient.id)}
                className={`w-full rounded-[1.25rem] border p-4 text-left ${
                  selectedPatientId === patient.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{patient.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {patient.patientId || 'No patient ID'} • {patient.age ?? '—'} yrs • {patient.gender || '—'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
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
              <p className="rounded-[1.25rem] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No assigned patients match the current search.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          {!selectedPatient && <div className="py-24 text-center text-slate-500">Select a patient to review their nursing care context.</div>}
          {selectedPatient && (
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Patient Summary</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedPatient.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPatient.patientId || 'No patient ID'} • {selectedPatient.assignedDoctor?.name || 'No assigned doctor visible'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Diagnosis summary</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedPatient.diagnosisSummary || 'No diagnosis summary available.'}</p>
                </article>
                <article className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Ward and bed</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedPatient.ward?.name || 'No ward'}
                    {selectedPatient.bed?.bedNumber ? ` • Bed ${selectedPatient.bed.bedNumber}` : ''}
                  </p>
                </article>
              </div>

              <article className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">Risk and history</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Allergies</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedPatient.allergies?.length ? selectedPatient.allergies.join(', ') : 'No allergies recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Chronic diseases</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedPatient.chronicDiseases?.length ? selectedPatient.chronicDiseases.join(', ') : 'No chronic diseases recorded'}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">Doctor instructions and medications</p>
                <div className="mt-3 space-y-3">
                  {(selectedPatient.medicationSummary || []).map((medicine, index) => (
                    <div key={`${selectedPatient.id}-med-${index}`} className="rounded-xl bg-slate-50 p-4">
                      <p className="font-medium text-slate-900">{medicine.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {medicine.dosage || 'Dose not set'} • {medicine.frequency || 'Frequency not set'} • {medicine.duration || 'Duration not set'}
                      </p>
                      {medicine.instructions && <p className="mt-1 text-sm text-slate-500">{medicine.instructions}</p>}
                    </div>
                  ))}
                  {selectedPatient.medicationSummary?.length === 0 && (
                    <p className="text-sm text-slate-500">No active prescription medicines are visible for this patient.</p>
                  )}
                </div>
                {selectedPatient.activePrescription && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-slate-700">
                    <p><span className="font-semibold">Advice:</span> {selectedPatient.activePrescription.advice || 'No advice recorded.'}</p>
                    <p className="mt-2">
                      <span className="font-semibold">Admission recommendation:</span>{' '}
                      {selectedPatient.activePrescription.admissionRecommended ? 'Recommended' : 'Not marked'}
                    </p>
                  </div>
                )}
              </article>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Pending lab visibility</p>
                  <div className="mt-3 space-y-2">
                    {(selectedPatient.pendingLabOrders || []).map((order) => (
                      <div key={order.id} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-medium text-slate-900">{order.tests.join(', ') || 'Lab order'}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {order.orderNumber || order.id} • {order.status} • {order.urgency || 'routine'}
                        </p>
                      </div>
                    ))}
                    {selectedPatient.pendingLabOrders?.length === 0 && (
                      <p className="text-sm text-slate-500">No pending lab work is visible right now.</p>
                    )}
                  </div>
                </article>

                <article className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Latest vitals</p>
                  {selectedPatient.latestVitals ? (
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p>Recorded: {new Date(selectedPatient.latestVitals.recordedAt).toLocaleString()}</p>
                      <p>BP: {selectedPatient.latestVitals.bloodPressure || '—'}</p>
                      <p>Pulse: {selectedPatient.latestVitals.pulse || '—'}</p>
                      <p>Temperature: {selectedPatient.latestVitals.temperature || '—'}</p>
                      <p>SpO2: {selectedPatient.latestVitals.spo2 || '—'}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">No vitals have been recorded yet.</p>
                  )}
                </article>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
