import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

const typeLabels = {
  registration: 'Registration',
  appointment: 'Appointment',
  prescription: 'Prescription',
  labOrder: 'Lab order',
  labReport: 'Lab report',
  invoice: 'Invoice',
  admission: 'Admission',
  discharge: 'Discharge',
};

const typeLinks = {
  appointment: '/patient/appointments',
  prescription: '/patient/prescriptions',
  labOrder: '/patient/lab-tests',
  labReport: '/patient/lab-reports',
  invoice: '/patient/bills',
};

export default function PatientTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const data = await patientApi.getMyTimeline();
      setTimeline(Array.isArray(data?.timeline) ? data.timeline : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Medical History</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Complete care timeline</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          A unified timeline of appointments, prescriptions, lab work, and billing history in chronological order.
        </p>
      </div>

      <div className="space-y-4">
        {timeline.map((event, index) => (
          <article key={`${event.type}-${event.id || index}`} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={event.type}>{typeLabels[event.type] || event.type}</StatusBadge>
                {typeLinks[event.type] && (
                  <Link to={typeLinks[event.type]} className="text-xs font-semibold text-slate-700 underline">
                    View details
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}

        {!loading && timeline.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            Timeline is empty until you begin consultations or lab work.
          </div>
        )}
      </div>
    </section>
  );
}
