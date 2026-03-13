import { useSelector } from 'react-redux';
import { getRoleLabel } from '../../auth/constants.js';

export default function EmployeeProfileShell() {
  const user = useSelector((state) => state.auth.user);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Employee profile</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Profile shell</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Profile management will be expanded in a later module. This shell keeps employee account actions inside the
          hospital system namespace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Name" value={user?.name || 'Hospital Employee'} />
        <InfoCard label="Role" value={getRoleLabel(user?.role || 'employee')} />
        <InfoCard label="Email" value={user?.email || 'Not available'} />
      </div>
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">{value}</h3>
    </article>
  );
}
