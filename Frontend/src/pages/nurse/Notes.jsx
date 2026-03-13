import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

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
    load();
  }, []);

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
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Care Documentation</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Nursing notes and escalations</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Document bedside observations, condition changes, general nursing notes, and urgent doctor-attention flags.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Add Nursing Note</p>
          <form className="mt-4 space-y-4" onSubmit={submitNote}>
            <select value={noteForm.patientId} onChange={(event) => setNoteForm((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId || 'No ID'})
                </option>
              ))}
            </select>
            <select value={noteForm.noteType} onChange={(event) => setNoteForm((current) => ({ ...current, noteType: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="general">General care note</option>
              <option value="condition">Condition note</option>
              <option value="observation">Observation note</option>
              <option value="medication">Medication note</option>
              <option value="incident">Incident note</option>
            </select>
            <textarea value={noteForm.content} onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))} rows={5} placeholder="Write the nursing note" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <Button type="submit" className="w-full" disabled={!noteForm.patientId || !noteForm.content.trim()}>
              Save nursing note
            </Button>
          </form>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Add Escalation</p>
          <form className="mt-4 space-y-4" onSubmit={submitEscalation}>
            <select value={escalationForm.patientId} onChange={(event) => setEscalationForm((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
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
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Recent Nursing Notes</p>
          <div className="mt-4 space-y-3">
            {notes.map((note) => (
              <article key={note.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{note.patient?.name || 'Assigned patient'}</p>
                    <p className="mt-1 text-sm text-slate-600">{note.patient?.patientId || 'No patient ID'}</p>
                  </div>
                  <StatusBadge status={note.noteType}>{note.noteType}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-slate-700">{note.content}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
              </article>
            ))}
            {notes.length === 0 && <p className="text-sm text-slate-500">No nursing notes have been recorded yet.</p>}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Escalation Flags</p>
          <div className="mt-4 space-y-3">
            {escalations.map((note) => (
              <article key={note.id} className="rounded-[1.25rem] border border-red-200 bg-red-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{note.patient?.name || 'Assigned patient'}</p>
                    <p className="mt-1 text-sm text-slate-600">{note.patient?.patientId || 'No patient ID'}</p>
                  </div>
                  <StatusBadge status="urgent">Doctor attention</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-slate-700">{note.content}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
              </article>
            ))}
            {escalations.length === 0 && <p className="text-sm text-slate-500">No escalation notes are currently logged.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
