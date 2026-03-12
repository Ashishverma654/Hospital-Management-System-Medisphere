import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { STAFF_MANAGEMENT_ROLES, getRoleLabel } from '../../auth/constants.js';

export default function DashboardShell() {
  const user = useSelector((state) => state.auth.user);
  const canManageUsers = STAFF_MANAGEMENT_ROLES.includes(user?.role);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Module 1 foundation</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Employee dashboard shell</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          This isolated employee app is ready for future operational modules. Staff workflows will be added under
          the `/employee/*` route tree without sharing patient navigation or public entry points.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Employee" value={user?.name || 'Employee'} />
        <InfoCard label="Role" value={getRoleLabel(user?.role || 'Unknown')} />
        <InfoCard label="Employee ID" value={user?.employeeId || 'Not available'} />
      </div>

      <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
        Sidebar, navigation groups, and role-specific modules can be layered here in later modules without changing
        the auth contract introduced in Module 1.
      </article>

      {canManageUsers && (
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Staff Control</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">Manage hospital employee access</h3>
          <p className="mt-2 max-w-2xl text-slate-600">
            Open the employee user management screen to create only the staff roles allowed by your hierarchy level.
          </p>
          <Link
            to="/employee/manage-roles"
            className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Manage Roles
          </Link>
        </article>
      )}
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-xl font-semibold capitalize text-slate-900">{value}</h3>
    </article>
  );
}
