import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, BriefcaseMedical, GraduationCap, IndianRupee, Trophy } from 'lucide-react';
import { getDoctorPublicById } from '../../services/apiServices.js';

export default function PublicDoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDoctor = async () => {
      setLoading(true);
      try {
        const data = await getDoctorPublicById(id);
        setDoctor(data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Doctor profile not available.');
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  if (loading) {
    return (
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <p className="text-slate-500">Loading doctor profile...</p>
        </div>
      </section>
    );
  }

  if (!doctor) {
    return (
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Doctor profile unavailable</h1>
          <p className="mt-3 text-slate-600">{error || 'This doctor could not be loaded right now.'}</p>
          <Link to="/find-doctors" className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Back to doctors
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link to="/find-doctors" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          Back to Doctor Discovery
        </Link>

        <div className="grid gap-8 rounded-[2.25rem] bg-white p-8 shadow-sm lg:grid-cols-[280px,minmax(0,1fr)]">
          <div className="space-y-4 text-center">
            <img
              src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
              alt={doctor.userId?.name || 'Doctor'}
              className="mx-auto h-56 w-56 rounded-[2rem] object-cover shadow-sm"
            />
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Consultation Fee</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">₹{Number(doctor.consultationFee || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#ee4c35]">Published Doctor Profile</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">{doctor.title} {doctor.userId?.name}</h1>
              <p className="mt-2 text-lg text-slate-600">{doctor.departmentId?.name || 'Clinical Department'}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard icon={BriefcaseMedical} label="Experience" value={`${doctor.experienceYears || 0} years`} />
              <InfoCard icon={GraduationCap} label="Qualifications" value={(doctor.qualifications || []).length || 0} />
              <InfoCard icon={IndianRupee} label="Fee" value={`₹${Number(doctor.consultationFee || 0).toLocaleString()}`} />
            </div>

            <Section title="Specializations">
              <div className="flex flex-wrap gap-2">
                {(doctor.specializationIds || []).map((item) => (
                  <span key={item._id} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="About">
              <p className="text-slate-600">{doctor.about || 'Profile details will be updated by the hospital team soon.'}</p>
            </Section>

            <Section title="Expertise">
              <div className="flex flex-wrap gap-2">
                {(doctor.expertise || []).map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Hospital Locations">
              <div className="space-y-3">
                {(doctor.hospitalLocations || []).map((item) => (
                  <div key={item._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-[#ee4c35]" />
                      {[item.city, item.state, item.address].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {(doctor.awards || []).length > 0 && (
              <Section title="Awards">
                <div className="grid gap-3 md:grid-cols-2">
                  {doctor.awards.map((award) => (
                    <article key={award._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#ee4c35]">
                        <Trophy className="h-4 w-4" />
                        {award.year || 'Recognition'}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{award.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{award.organization}</p>
                      {award.description && <p className="mt-2 text-sm text-slate-500">{award.description}</p>}
                    </article>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Section({ children, title }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="h-4 w-4 text-[#ee4c35]" />
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
    </article>
  );
}
