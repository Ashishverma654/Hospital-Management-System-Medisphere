export default function PublicAbout() {
  return (
    <section className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2.25rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-[#ee4c35]">About MediFlow</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">A patient-first hospital experience</h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            This public shell is ready for hospital story, departments, branches, awards, and care-quality content in
            later modules. For now it establishes a clean patient-facing website separate from the staff workspace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title="Hospital overview" description="Reserved for mission, values, services, and care programs." />
          <InfoCard title="Locations" description="Ready for branches, floor maps, and contact details." />
          <InfoCard title="Trust signals" description="Prepared for awards, accreditations, and outcome summaries." />
        </div>
      </div>
    </section>
  );
}

function InfoCard({ title, description }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
