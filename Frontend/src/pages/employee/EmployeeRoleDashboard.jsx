import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  EMPLOYEE_DASHBOARD_META,
  STAFF_MANAGEMENT_ROLES,
  getRoleLabel,
} from '../../auth/constants.js';

export default function EmployeeRoleDashboard({ role }) {
  const user = useSelector((state) => state.auth.user);
  const metadata = EMPLOYEE_DASHBOARD_META[role] || EMPLOYEE_DASHBOARD_META.doctor;
  const canManageUsers = STAFF_MANAGEMENT_ROLES.includes(role);
  const canAccessPatientAdmin = ['superadmin', 'admin'].includes(role);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{metadata.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">{metadata.title}</h2>
        <p className="mt-3 max-w-3xl text-slate-600">{metadata.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Employee" value={user?.name || getRoleLabel(role)} />
        <InfoCard label="Role" value={getRoleLabel(role)} />
        <InfoCard label="Employee ID" value={user?.employeeId || 'Not available'} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metadata.highlights.map((highlight) => (
          <article key={highlight} className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Future Module</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{highlight}</h3>
            <p className="mt-2 text-sm text-slate-600">
              This area is reserved as a secure entry point for upcoming employee workflows.
            </p>
          </article>
        ))}
      </div>

      {canManageUsers && (
        <article className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Access Management</p>
          <h3 className="mt-3 text-2xl font-semibold">Administration shortcuts</h3>
          <p className="mt-2 max-w-2xl text-slate-300">
            Open the employee-side governance tools your role is allowed to use without crossing into public or
            patient-facing routes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/employee/manage-roles"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Open Manage Roles
            </Link>
            {canAccessPatientAdmin && (
              <Link
                to="/employee/patients"
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Patients
              </Link>
            )}
          </div>
        </article>
      )}
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-[1.75rem] bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">{value}</h3>
    </article>
  );
}
