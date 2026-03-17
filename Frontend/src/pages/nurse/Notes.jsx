import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialNoteForm = {
  patientId: '',
  noteType: 'general',
  content: '',
};

const initialEscalationForm = {
  patientId: '',
  content: '',
};

export default function NurseNotes() {
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [noteForm, setNoteForm] = useState(initialNoteForm);
  const [escalationForm, setEscalationForm] = useState(initialEscalationForm);

  const load = async () => {
    try {
      const [patientData, noteData, escalationData] = await Promise.all([
        nurseApi.getAssignedPatients(),
        nurseApi.getNotes(),
        nurseApi.getEscalations(),
      ]);
      const patientList = Array.isArray(patientData) ? patientData : [];
      setPatients(patientList);
      setNotes(Array.isArray(noteData) ? noteData : []);
      setEscalations(Array.isArray(escalationData) ? escalationData : []);

      if (!noteForm.patientId && patientList.length) {
        setNoteForm((current) => ({ ...current, patientId: patientList[0].id }));
      }
      if (!escalationForm.patientId && patientList.length) {
        setEscalationForm((current) => ({ ...current, patientId: patientList[0].id }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load nursing notes.');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitNote = async (event) => {
    event.preventDefault();
    try {
      await nurseApi.createNote(noteForm);
      toast.success('Nursing note added.');
      setNoteForm((current) => ({ ...initialNoteForm, patientId: current.patientId }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create nursing note.');
    }
  };

  const submitEscalation = async (event) => {
    event.preventDefault();
    try {
      await nurseApi.createEscalation(escalationForm);
      toast.success('Escalation note recorded.');
      setEscalationForm((current) => ({ ...initialEscalationForm, patientId: current.patientId }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create escalation note.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Care Documentation</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Nursing notes and escalations</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Document bedside observations, condition changes, general nursing notes, and urgent doctor-attention flags.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Add Nursing Note</p>
          <form className="mt-4 space-y-4" onSubmit={submitNote}>
            <select value={noteForm.patientId} onChange={(event) => setNoteForm((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId || 'No ID'})
                </option>
              ))}
            </select>
            <select value={noteForm.noteType} onChange={(event) => setNoteForm((current) => ({ ...current, noteType: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="general">General care note</option>
              <option value="condition">Condition note</option>
              <option value="observation">Observation note</option>
              <option value="medication">Medication note</option>
              <option value="incident">Incident note</option>
            </select>
            <textarea value={noteForm.content} onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))} rows={5} placeholder="Write the nursing note" className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
            <Button type="submit" className="w-full" disabled={!noteForm.patientId || !noteForm.content.trim()}>
              Save nursing note
            </Button>
          </form>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Add Escalation</p>
          <form className="mt-4 space-y-4" onSubmit={submitEscalation}>
            <select value={escalationForm.patientId} onChange={(event) => setEscalationForm((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId || 'No ID'})
                </option>
              ))}
            </select>
            <textarea value={escalationForm.content} onChange={(event) => setEscalationForm((current) => ({ ...current, content: event.target.value }))} rows={5} placeholder="Describe why doctor attention is needed" className="w-full rounded-2xl border border-red-200 px-4 py-3 text-sm outline-none focus:border-red-500" />
            <Button type="submit" className="w-full" disabled={!escalationForm.patientId || !escalationForm.content.trim()}>
              Save escalation note
            </Button>
          </form>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Recent Nursing Notes</p>
          <div className="mt-4 space-y-3">
            {notes.map((note) => (
              <article key={note.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{note.patient?.name || 'Assigned patient'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{note.patient?.patientId || 'No patient ID'}</p>
                  </div>
                  <StatusBadge status={note.noteType}>{note.noteType}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-foreground">{note.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</p>
              </article>
            ))}
            {notes.length === 0 && <p className="text-sm text-muted-foreground">No nursing notes have been recorded yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Escalation Flags</p>
          <div className="mt-4 space-y-3">
            {escalations.map((note) => (
              <article key={note.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{note.patient?.name || 'Assigned patient'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{note.patient?.patientId || 'No patient ID'}</p>
                  </div>
                  <StatusBadge status="urgent">Doctor attention</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-foreground">{note.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</p>
              </article>
            ))}
            {escalations.length === 0 && <p className="text-sm text-muted-foreground">No escalation notes are currently logged.</p>}
          </div>
        </section>
      </div>
    </motion.section>
  );
}
