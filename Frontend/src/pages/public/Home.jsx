import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, MapPin, Stethoscope } from 'lucide-react';
import { getHomepageContent } from '../../services/apiServices.js';

export default function Home() {
  const [content, setContent] = useState({
    featuredDepartments: [],
    featuredDoctors: [],
    locations: [],
    awards: [],
    specializations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepage = async () => {
      setLoading(true);
      try {
        const data = await getHomepageContent();
        setContent({
          featuredDepartments: data.featuredDepartments || [],
          featuredDoctors: data.featuredDoctors || [],
          locations: data.locations || [],
          awards: data.awards || [],
          specializations: data.specializations || [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadHomepage();
  }, []);

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#ee4c35] via-[#f26b57] to-[#f8c08f] p-8 text-white shadow-xl sm:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-white/75">Patient + Public App</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Hospital discovery now runs on real doctors, departments, awards, and branch content.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
              Explore featured specialists, departments, and hospital locations from the same source of truth used by
              the internal admin team.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/patient/login" className="rounded-full bg-white px-6 py-3 font-semibold text-[#ee4c35] transition hover:bg-slate-100">
                Patient Login
              </Link>
              <Link to="/patient/register" className="rounded-full border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                Patient Registration
              </Link>
              <Link to="/find-doctors" className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                Find Doctors
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <StatCard title="Featured Doctors" value={loading ? '...' : content.featuredDoctors.length} description="Published doctor profiles curated by the hospital team." />
            <StatCard title="Featured Departments" value={loading ? '...' : content.featuredDepartments.length} description="Public-facing specialties pulled from live department management." />
            <StatCard title="Active Locations" value={loading ? '...' : content.locations.length} description="Branches and hospital addresses shown from the admin-managed location catalog." />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SpotlightCard title="Personal Health Portal" description="A dedicated patient workspace for your care history, documents, and follow-ups." ctaLabel="Open patient login" ctaTo="/patient/login" />
          <SpotlightCard title="Doctor Discovery" description="Browse live published doctor profiles, departments, and hospital branches." ctaLabel="Browse doctors" ctaTo="/find-doctors" />
          <SpotlightCard title="Hospital Trust Signals" description="Awards, branches, and public clinical specialties are now driven by admin-managed data." ctaLabel="Learn about us" ctaTo="/about" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Featured Doctors</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Meet our published specialists</h2>
              </div>
              <Link to="/find-doctors" className="text-sm font-semibold text-[#ee4c35]">
                View all
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {content.featuredDoctors.map((doctor) => (
                <Link key={doctor._id} to={`/find-doctors/${doctor._id}`} className="rounded-[1.5rem] border border-slate-200 p-4 transition hover:border-[#ee4c35] hover:shadow-sm">
                  <div className="flex gap-4">
                    <img
                      src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
                      alt={doctor.userId?.name || 'Doctor'}
                      className="h-20 w-20 rounded-[1.25rem] object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{doctor.title} {doctor.userId?.name}</h3>
                      <p className="mt-1 text-sm text-[#ee4c35]">{doctor.departmentId?.name}</p>
                      <p className="mt-2 text-sm text-slate-600">{(doctor.specializationIds || []).map((item) => item.name).join(', ') || 'Specialist profile'}</p>
                      <p className="mt-2 text-sm text-slate-500">{doctor.experienceYears || 0} years experience</p>
                    </div>
                  </div>
                </Link>
              ))}
              {!loading && content.featuredDoctors.length === 0 && (
                <p className="text-sm text-slate-500">Featured doctors will appear here once the admin team publishes them.</p>
              )}
            </div>
          </article>

          <article className="space-y-6">
            <Panel title="Featured Departments" icon={Stethoscope}>
              <div className="grid gap-3">
                {content.featuredDepartments.map((department) => (
                  <div key={department._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{department.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{department.description || 'Clinical department profile ready for public discovery.'}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Hospital Awards" icon={Award}>
              <div className="space-y-3">
                {content.awards.map((award) => (
                  <div key={award._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">{award.year || 'Recognition'}</p>
                    <p className="mt-1 font-semibold text-slate-900">{award.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{award.organization}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <Panel title="Popular Specializations" icon={Stethoscope}>
            <div className="flex flex-wrap gap-2">
              {content.specializations.map((item) => (
                <span key={item._id} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {item.name}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Hospital Locations" icon={MapPin}>
            <div className="grid gap-3 md:grid-cols-2">
              {content.locations.map((location) => (
                <div key={location._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{location.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{[location.city, location.state].filter(Boolean).join(', ')}</p>
                  <p className="mt-2 text-sm text-slate-500">{location.address}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function SpotlightCard({ title, description, ctaLabel, ctaTo }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link to={ctaTo} className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
        {ctaLabel}
      </Link>
    </article>
  );
}

function StatCard({ title, value, description }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <h2 className="mt-3 text-4xl font-semibold text-slate-900">{value}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function Panel({ children, icon: Icon, title }) {
  return (
    <article className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[#fff1ee] p-3 text-[#ee4c35]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Public Content</p>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}
