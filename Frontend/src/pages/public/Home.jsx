import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#ee4c35] via-[#f26b57] to-[#f8c08f] p-8 text-white shadow-xl sm:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-white/75">Patient + Public App</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Your hospital website and patient portal now start from one clear public entry.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
              Explore care information, discover doctors, or sign in to your personal portal. Employee access stays in
              its own separate hospital system.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/patient/login"
                className="rounded-full bg-white px-6 py-3 font-semibold text-[#ee4c35] transition hover:bg-slate-100"
              >
                Patient Login
              </Link>
              <Link
                to="/patient/register"
                className="rounded-full border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Patient Registration
              </Link>
              <Link
                to="/find-doctors"
                className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Find Doctors
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <FeatureCard
              title="Separate patient routes"
              description="Public pages and patient authentication live under the patient-facing route domain without employee navigation."
            />
            <FeatureCard
              title="Protected patient portal"
              description="Authenticated patients land in a dedicated patient portal shell that is isolated from hospital staff tools."
            />
            <FeatureCard
              title="Future-ready portal foundation"
              description="Appointments, prescriptions, medicine orders, lab reports, billing, profile, and notifications can now grow inside a clean patient route tree."
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SpotlightCard
            title="Personal Health Portal"
            description="A dedicated patient workspace for your care history, documents, and follow-ups."
            ctaLabel="Open patient login"
            ctaTo="/patient/login"
          />
          <SpotlightCard
            title="Doctor Discovery"
            description="A public discovery surface prepared for specialties, doctor profiles, and booking entry points."
            ctaLabel="Browse doctors"
            ctaTo="/find-doctors"
          />
          <SpotlightCard
            title="Trusted Hospital Website"
            description="Ready for public content like awards, branches, departments, and patient guidance."
            ctaLabel="Learn about us"
            ctaTo="/about"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function SpotlightCard({ title, description, ctaLabel, ctaTo }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        to={ctaTo}
        className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
