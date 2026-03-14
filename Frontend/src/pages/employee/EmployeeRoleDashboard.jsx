import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';
import {
  EMPLOYEE_DASHBOARD_META,
  STAFF_MANAGEMENT_ROLES,
  getRoleLabel,
} from '../../auth/constants.js';
import { doctorApi } from '../../services/apiServices.js';

export default function EmployeeRoleDashboard({ role }) {
  const user = useSelector((state) => state.auth.user);
  const metadata = EMPLOYEE_DASHBOARD_META[role] || EMPLOYEE_DASHBOARD_META.doctor;
  const canManageUsers = STAFF_MANAGEMENT_ROLES.includes(role);
  const canAccessPatientAdmin = ['superadmin', 'admin'].includes(role);
  const [doctorPreview, setDoctorPreview] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);

  useEffect(() => {
    if (role !== 'subadmin') return;
    const loadDoctors = async () => {
      setDoctorLoading(true);
      try {
        const data = await doctorApi.getAdminAll({ limit: 6 });
        setDoctorPreview(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        setDoctorPreview([]);
      } finally {
        setDoctorLoading(false);
      }
    };
    loadDoctors();
  }, [role]);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="doccure-card p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{metadata.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">{metadata.title}</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">{metadata.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="doccure-chip">Role access</span>
          <span className="doccure-chip">Daily priorities</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Employee" value={user?.name || getRoleLabel(role)} />
        <InfoCard label="Role" value={getRoleLabel(role)} />
        <InfoCard label="Employee ID" value={user?.employeeId || 'Not available'} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metadata.highlights.map((highlight) => (
          <article key={highlight} className="doccure-card-soft p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Future Module</p>
            <h3 className="mt-3 text-lg font-semibold text-foreground">{highlight}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This area is reserved as a secure entry point for upcoming employee workflows.
            </p>
          </article>
        ))}
      </div>

      {role === 'subadmin' && (
        <div className="doccure-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Doctor Cards</p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">Current doctor roster</h3>
            </div>
            <Link to="/employee/doctors" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {doctorLoading && (
              <>
                <div className="doccure-card-soft p-5 animate-pulse"><div className="h-20 rounded-xl bg-muted" /></div>
                <div className="doccure-card-soft p-5 animate-pulse"><div className="h-20 rounded-xl bg-muted" /></div>
                <div className="doccure-card-soft p-5 animate-pulse"><div className="h-20 rounded-xl bg-muted" /></div>
              </>
            )}
            {!doctorLoading && doctorPreview.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No doctor cards to display yet. New doctors will appear here as soon as they are added by admins.
              </div>
            )}
            {!doctorLoading && doctorPreview.map((doctor) => (
              <div key={doctor.id} className="doccure-card-soft p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-border bg-muted/60 flex items-center justify-center font-semibold text-foreground">
                    {doctor.userId?.name?.charAt(0) || 'D'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{doctor.userId?.name || 'Doctor'}</p>
                    <p className="text-xs text-muted-foreground truncate">{doctor.userId?.email || 'No email'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{doctor.departmentId?.name || 'No department'}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${doctor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {doctor.isFeatured && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                      Featured #{doctor.featureOrder || 0}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManageUsers && (
        <article className="rounded-2xl bg-gradient-to-br from-[#0de0fe] via-[#09e5ab] to-[#7c83fd] p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.15em] text-white/80">Access Management</p>
          <h3 className="mt-3 text-2xl font-semibold">Administration shortcuts</h3>
          <p className="mt-2 max-w-2xl text-white/80">
            Open the employee-side governance tools your role is allowed to use without crossing into public or
            patient-facing routes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/employee/manage-roles"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              Open Manage Roles
            </Link>
            {canAccessPatientAdmin && (
              <Link
                to="/employee/patients"
                className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                View Patients
              </Link>
            )}
          </div>
        </article>
      )}
    </motion.section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="doccure-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-foreground">{value}</h3>
    </article>
  );
}
