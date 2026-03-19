import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientApi } from '../../services/apiServices.js';
import { Button } from '../../components/ui/button.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPatient = async () => {
    setLoading(true);
    try {
      const response = await patientApi.getById(id);
      const data = response?.data || response;
      setPatient(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load patient detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading patient detail...</p>
      </section>
    );
  }

  if (!patient) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Patient record not available.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Patient Detail</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{patient.userId?.name || 'Patient'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {patient.userId?.patientId || 'Patient ID pending'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={patient.isActive ? 'active' : 'inactive'}>
              {patient.isActive ? 'active' : 'inactive'}
            </StatusBadge>
            <Button asChild variant="outline">
              <Link to="/employee/patients">Back to patients</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Core Information</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Detail label="Email" value={patient.userId?.email || '—'} />
            <Detail label="Phone" value={patient.userId?.phone || '—'} />
            <Detail label="Gender" value={patient.gender || patient.userId?.gender || '—'} />
            <Detail label="Date of Birth" value={formatDate(patient.dateOfBirth || patient.userId?.dob)} />
            <Detail label="Blood Group" value={patient.bloodGroup || '—'} />
            <Detail label="Address" value={patient.userId?.address || '—'} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Clinical Flags</h3>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <Detail label="Allergies" value={Array.isArray(patient.allergies) && patient.allergies.length ? patient.allergies.join(', ') : '—'} />
            <Detail label="Chronic Diseases" value={Array.isArray(patient.chronicDiseases) && patient.chronicDiseases.length ? patient.chronicDiseases.join(', ') : '—'} />
            <Detail label="Insurance Provider" value={patient.insuranceProvider || '—'} />
            <Detail label="Insurance Number" value={patient.insuranceNumber || '—'} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || '—'}</p>
    </div>
  );
}
