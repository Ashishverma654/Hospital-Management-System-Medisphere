import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function SubadminDashboard() {
  const user = useSelector((state) => state.auth.user);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Sub Admin Workspace</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Subadmin dashboard placeholder</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          This shell is reserved for the delegated staff-management and operational tools that subadmins are allowed
          to access in later modules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Employee" value={user?.name || 'Sub Admin'} />
        <InfoCard label="Role" value="Sub Admin" />
        <InfoCard label="Allowed staff creation" value="Nurse, Receptionist, Lab Technician, Pharmacist" />
      </div>

      <article className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Access Control</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-900">User management is available here</h3>
        <p className="mt-2 max-w-2xl text-slate-600">
          Subadmins can open the employee user-management screen, but backend permissions still restrict creation to
          nurse, receptionist, lab technician, and pharmacist accounts only.
        </p>
        <Link
          to="/employee/manage-roles"
          className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Open Manage Roles
        </Link>
      </article>
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-900">{value}</h3>
    </article>
  );
}
