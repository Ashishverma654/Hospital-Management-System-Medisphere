import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#ee4c35] via-[#f26b57] to-[#f8c08f] p-8 text-white shadow-xl sm:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-white/75">Public + Patient App</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Hospital access for patients and families starts here.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
              Browse the public site, sign in as a patient, or create a new patient account. Employee access is
              intentionally separated into its own application surface.
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
              title="Shared backend API"
              description="Both apps still use the same backend API, but with separate frontend entry points and auth flows."
            />
          </div>
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
