import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doctorApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { toast } from 'sonner';

export default function DoctorDetail() {
  const { id } = useParams();
  const role = useSelector((state) => state.auth.user?.role);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDoctor = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getById(id);
      setDoctor(data);
    } catch (error) {
      const isNotFound = error?.response?.status === 404;
      const canUseAdmin = role === 'admin' || role === 'superadmin';
      if (isNotFound && canUseAdmin) {
        try {
          const data = await doctorApi.getAdminById(id);
          setDoctor(data);
          return;
        } catch (adminError) {
          toast.error(adminError.response?.data?.message || 'Failed to load doctor profile.');
          return;
        }
      }
      toast.error(error.response?.data?.message || 'Failed to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctor();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading doctor profile...</p>
      </section>
    );
  }

  if (!doctor) {
    return (
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Doctor profile not available.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Doctor Profile</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{doctor.userId?.name || 'Doctor'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {doctor.title || 'Consultant'} • {doctor.departmentId?.name || 'Department pending'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={doctor.isPublished ? 'published' : 'unpublished'}>
              {doctor.isPublished ? 'published' : 'unpublished'}
            </StatusBadge>
            <StatusBadge status={doctor.isActive ? 'active' : 'inactive'}>
              {doctor.isActive ? 'active' : 'inactive'}
            </StatusBadge>
            <Button asChild variant="outline">
              <Link to="/employee/doctors">Back to doctors</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <img
            src={doctor.profileImage || doctor.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
            alt={doctor.userId?.name || 'Doctor'}
            className="h-40 w-full rounded-2xl object-cover"
          />
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-[0.16em]">Email</p>
              <p className="text-foreground">{doctor.userId?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em]">Phone</p>
              <p className="text-foreground">{doctor.userId?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em]">Employee ID</p>
              <p className="text-foreground">{doctor.userId?.employeeId || '—'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Professional Summary</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Detail label="Experience" value={`${doctor.experienceYears || 0} years`} />
              <Detail label="Consultation Fee" value={`₹${Number(doctor.consultationFee || 0).toLocaleString()}`} />
              <Detail label="Video Fee" value={`₹${Number(doctor.consultationFeeVideo || 0).toLocaleString()}`} />
              <Detail label="Phone Fee" value={`₹${Number(doctor.consultationFeePhone || 0).toLocaleString()}`} />
            </div>
            <Detail
              label="Hospital Locations"
              value={Array.isArray(doctor.hospitalLocations) && doctor.hospitalLocations.length
                ? doctor.hospitalLocations.map((loc) => `${loc.name}${loc.city ? ` (${loc.city})` : ''}`).join(', ')
                : '—'}
              className="mt-4"
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <Detail label="Specializations" value={Array.isArray(doctor.specializationIds) && doctor.specializationIds.length ? doctor.specializationIds.map((item) => item.name).join(', ') : '—'} />
            <Detail label="Qualifications" value={Array.isArray(doctor.qualifications) && doctor.qualifications.length ? doctor.qualifications.join(', ') : '—'} />
            <Detail label="Expertise" value={Array.isArray(doctor.expertise) && doctor.expertise.length ? doctor.expertise.join(', ') : '—'} />
            <Detail label="About" value={doctor.about || '—'} />
          </section>

          {(doctor.awards || []).length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Awards</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {doctor.awards.map((award) => (
                  <li key={award._id} className="rounded-xl border border-border bg-background px-4 py-3">
                    <p className="font-semibold text-foreground">{award.title}</p>
                    <p className="text-xs text-muted-foreground">{award.year || '—'} • {award.organization || '—'}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || '—'}</p>
    </div>
  );
}
