import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

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
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Medical History</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Complete care timeline</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          A unified timeline of appointments, prescriptions, lab work, and billing history in chronological order.
        </p>
      </div>

      <div className="space-y-4">
        {timeline.map((event, index) => (
          <article key={`${event.type}-${event.id || index}`} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{event.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={event.type}>{typeLabels[event.type] || event.type}</StatusBadge>
                {typeLinks[event.type] && (
                  <Link to={typeLinks[event.type]} className="text-xs font-semibold text-foreground underline">
                    View details
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}

        {!loading && timeline.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            Timeline is empty until you begin consultations or lab work.
          </div>
        )}
      </div>
    </motion.section>
  );
}
