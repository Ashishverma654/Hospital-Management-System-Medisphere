import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialForm = {
  patientId: '',
  systolicBp: '',
  diastolicBp: '',
  pulse: '',
  temperature: '',
  spo2: '',
  respirationRate: '',
  bloodSugar: '',
  weight: '',
  notes: '',
};

export default function NurseVitals() {
  const [patients, setPatients] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    const patientData = await nurseApi.getAssignedPatients();
    const patientList = Array.isArray(patientData) ? patientData : [];
    setPatients(patientList);
    if (!selectedPatientId && patientList.length) {
      setSelectedPatientId(patientList[0].id);
      setForm((current) => ({ ...current, patientId: patientList[0].id }));
    }
    return patientList;
  };

  const loadHistory = async (patientId) => {
    if (!patientId) {
      setEntries([]);
      return;
    }
    const history = await nurseApi.getPatientVitalsHistory(patientId);
    setEntries(Array.isArray(history) ? history : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const patientList = await loadPatients();
        if (patientList.length) {
          await loadHistory(patientList[0].id);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load vitals workspace.');
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    loadHistory(selectedPatientId).catch((error) => {
      toast.error(error.response?.data?.message || 'Failed to load vitals history.');
    });
  }, [selectedPatientId]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await nurseApi.recordVitals({
        ...form,
        patientId: selectedPatientId,
      });
      toast.success('Vitals recorded successfully.');
      setForm((current) => ({ ...initialForm, patientId: current.patientId }));
      await loadHistory(selectedPatientId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record vitals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Patient Monitoring</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Vitals recording</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Record bedside vitals for assigned patients and review recent vitals history for follow-up care.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Record New Vitals</p>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <select
              value={selectedPatientId}
              onChange={(event) => {
                setSelectedPatientId(event.target.value);
                setForm((current) => ({ ...current, patientId: event.target.value }));
              }}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId || 'No ID'})
                </option>
              ))}
            </select>

            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.systolicBp} onChange={(event) => setForm((current) => ({ ...current, systolicBp: event.target.value }))} placeholder="Systolic BP" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.diastolicBp} onChange={(event) => setForm((current) => ({ ...current, diastolicBp: event.target.value }))} placeholder="Diastolic BP" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.pulse} onChange={(event) => setForm((current) => ({ ...current, pulse: event.target.value }))} placeholder="Pulse" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.temperature} onChange={(event) => setForm((current) => ({ ...current, temperature: event.target.value }))} placeholder="Temperature" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.spo2} onChange={(event) => setForm((current) => ({ ...current, spo2: event.target.value }))} placeholder="Oxygen saturation" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.respirationRate} onChange={(event) => setForm((current) => ({ ...current, respirationRate: event.target.value }))} placeholder="Respiratory rate" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.bloodSugar} onChange={(event) => setForm((current) => ({ ...current, bloodSugar: event.target.value }))} placeholder="Sugar level" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
              <input value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} placeholder="Weight" className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>

            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              placeholder="Observation notes"
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <Button type="submit" disabled={saving || !selectedPatientId} className="w-full">
              {saving ? 'Saving vitals...' : 'Record vitals'}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Recent History</p>
          <div className="mt-4 space-y-3">
            {entries.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{entry.patientName || 'Assigned patient'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      BP {entry.systolicBp || '—'}/{entry.diastolicBp || '—'} • Pulse {entry.pulse || '—'} • Temp {entry.temperature || '—'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      SpO2 {entry.spo2 || '—'} • Resp {entry.respirationRate || '—'} • Sugar {entry.bloodSugar || '—'} • Weight {entry.weight || '—'}
                    </p>
                    {entry.notes && <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : 'No timestamp'}
                  </span>
                </div>
              </article>
            ))}
            {entries.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No vitals history is available for the selected patient.
              </p>
            )}
          </div>
        </section>
      </div>
    </motion.section>
  );
}
