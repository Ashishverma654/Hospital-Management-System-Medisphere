import { useSelector } from 'react-redux';

export default function PortalShell() {
  const user = useSelector((state) => state.auth.user);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Module 1 foundation</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Patient portal shell</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          This is the isolated patient app surface. Future appointment, billing, prescriptions, and records
          modules can plug into this route tree without mixing with employee navigation or authentication.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Patient" value={user?.name || 'Patient'} />
        <InfoCard label="Patient ID" value={user?.patientId || 'Pending assignment'} />
        <InfoCard label="Session" value="Patient-only" />
      </div>
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">{value}</h3>
    </article>
  );
}
