import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

const initialForm = {
  wardId: '',
  patientId: '',
  priority: 'medium',
  summary: '',
};

export default function NurseHandover() {
  const [assignments, setAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    try {
      const [assignmentData, patientData, handoverData] = await Promise.all([
        nurseApi.getAssignments(),
        nurseApi.getAssignedPatients(),
        nurseApi.getHandover(),
      ]);
      const assignmentList = Array.isArray(assignmentData) ? assignmentData : [];
      const patientList = Array.isArray(patientData) ? patientData : [];
      setAssignments(assignmentList);
      setPatients(patientList);
      setNotes(Array.isArray(handoverData) ? handoverData : []);

      if (!form.wardId && assignmentList.length) {
        const firstWard = assignmentList.find((assignment) => assignment.ward?.id)?.ward?.id || '';
        setForm((current) => ({ ...current, wardId: firstWard }));
      }
      if (!form.patientId && patientList.length) {
        setForm((current) => ({ ...current, patientId: patientList[0].id }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load handover notes.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await nurseApi.createHandover(form);
      toast.success('Handover note saved.');
      setForm((current) => ({ ...current, summary: '' }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create handover note.');
    }
  };

  const uniqueWards = Array.from(
    new Map(
      assignments
        .filter((assignment) => assignment.ward?.id)
        .map((assignment) => [assignment.ward.id, assignment.ward])
    ).values()
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Shift Continuity</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Handover notes</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Record shift summaries for wards and patients so the incoming nurse has clear bedside context.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">New Handover</p>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <select value={form.wardId} onChange={(event) => setForm((current) => ({ ...current, wardId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="">Select ward</option>
              {uniqueWards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name} {ward.wardNumber ? `(${ward.wardNumber})` : ''}
                </option>
              ))}
            </select>
            <select value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="">Optional patient context</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.patientId || 'No ID'})
                </option>
              ))}
            </select>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <textarea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} rows={6} placeholder="Summarize condition, pending actions, medication timing, and watch-outs for the next shift" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <Button type="submit" className="w-full" disabled={!form.summary.trim()}>
              Save handover note
            </Button>
          </form>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Recent Handover Feed</p>
          <div className="mt-4 space-y-3">
            {notes.map((note) => (
              <article key={note.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {note.ward?.name || 'Ward handover'} {note.patient?.name ? `• ${note.patient.name}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      From {note.fromNurse?.name || 'Nurse'} {note.toNurse?.name ? `to ${note.toNurse.name}` : 'to next shift'}
                    </p>
                  </div>
                  <StatusBadge status={note.priority}>{note.priority}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-slate-700">{note.summary}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</p>
              </article>
            ))}
            {notes.length === 0 && (
              <p className="rounded-[1.25rem] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No handover notes are available yet for your current scope.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
