import { Link } from 'react-router-dom';

const placeholderDoctors = [
  { name: 'Cardiology', description: 'Heart specialists and preventive cardiac care.' },
  { name: 'General Medicine', description: 'Everyday health concerns, follow-ups, and adult care.' },
  { name: 'Dermatology', description: 'Skin, hair, and allergy-related consultations.' },
];

export default function FindDoctors() {
  return (
    <section className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2.25rem] bg-gradient-to-br from-sky-900 via-cyan-900 to-teal-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-100">Doctor Discovery</p>
          <h1 className="mt-3 text-4xl font-semibold">Find the right specialist with confidence</h1>
          <p className="mt-4 max-w-3xl text-cyan-50/90">
            This public discovery shell is ready for doctor profiles, specializations, locations, and booking entry
            points in a later module.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/patient/register"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-slate-100"
            >
              Create Patient Account
            </Link>
            <Link
              to="/patient/login"
              className="rounded-full border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {placeholderDoctors.map((item) => (
            <article key={item.name} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Specialty</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
