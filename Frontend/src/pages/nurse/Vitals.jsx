import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedPatientId) return;
    loadHistory(selectedPatientId).catch((error) => {
      toast.error(error.response?.data?.message || 'Failed to load vitals history.');
    });
  }, [selectedPatientId]);

  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const sanitizeNumber = (value, { maxLength = 5, allowDecimal = false } = {}) => {
    const raw = `${value || ''}`;
    const cleaned = allowDecimal
      ? raw.replace(/[^0-9.]/g, '')
      : raw.replace(/[^0-9]/g, '');
    if (allowDecimal) {
      const parts = cleaned.split('.');
      const merged = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];
      return merged.slice(0, maxLength);
    }
    return cleaned.slice(0, maxLength);
  };

  const validateRanges = (payload) => {
    const ranges = [
      ['systolicBp', 40, 260],
      ['diastolicBp', 30, 180],
      ['pulse', 30, 220],
      ['temperature', 90, 110],
      ['spo2', 70, 100],
      ['respirationRate', 6, 60],
      ['bloodSugar', 40, 600],
      ['weight', 1, 300],
    ];
    for (const [key, min, max] of ranges) {
      const value = payload[key];
      if (value === undefined) continue;
      if (Number.isFinite(value) && (value < min || value > max)) {
        return `Invalid ${key}. Expected range ${min}-${max}.`;
      }
    }
    return null;
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        patientId: selectedPatientId,
        systolicBp: toNumber(form.systolicBp),
        diastolicBp: toNumber(form.diastolicBp),
        pulse: toNumber(form.pulse),
        temperature: toNumber(form.temperature),
        spo2: toNumber(form.spo2),
        respirationRate: toNumber(form.respirationRate),
        bloodSugar: toNumber(form.bloodSugar),
        weight: toNumber(form.weight),
        notes: form.notes,
      };
      const rangeError = validateRanges(payload);
      if (rangeError) {
        toast.error(rangeError);
        return;
      }
      setSaving(true);
      await nurseApi.recordVitals(payload);
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
              <input
                value={form.systolicBp}
                onChange={(event) => setForm((current) => ({ ...current, systolicBp: sanitizeNumber(event.target.value, { maxLength: 3 }) }))}
                placeholder="Systolic BP"
                inputMode="numeric"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.diastolicBp}
                onChange={(event) => setForm((current) => ({ ...current, diastolicBp: sanitizeNumber(event.target.value, { maxLength: 3 }) }))}
                placeholder="Diastolic BP"
                inputMode="numeric"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.pulse}
                onChange={(event) => setForm((current) => ({ ...current, pulse: sanitizeNumber(event.target.value, { maxLength: 3 }) }))}
                placeholder="Pulse"
                inputMode="numeric"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.temperature}
                onChange={(event) => setForm((current) => ({ ...current, temperature: sanitizeNumber(event.target.value, { maxLength: 5, allowDecimal: true }) }))}
                placeholder="Temperature"
                inputMode="decimal"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.spo2}
                onChange={(event) => setForm((current) => ({ ...current, spo2: sanitizeNumber(event.target.value, { maxLength: 3 }) }))}
                placeholder="Oxygen saturation"
                inputMode="numeric"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.respirationRate}
                onChange={(event) => setForm((current) => ({ ...current, respirationRate: sanitizeNumber(event.target.value, { maxLength: 3 }) }))}
                placeholder="Respiratory rate"
                inputMode="numeric"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.bloodSugar}
                onChange={(event) => setForm((current) => ({ ...current, bloodSugar: sanitizeNumber(event.target.value, { maxLength: 4 }) }))}
                placeholder="Sugar level"
                inputMode="numeric"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.weight}
                onChange={(event) => setForm((current) => ({ ...current, weight: sanitizeNumber(event.target.value, { maxLength: 4, allowDecimal: true }) }))}
                placeholder="Weight"
                inputMode="decimal"
                className="rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
              />
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
