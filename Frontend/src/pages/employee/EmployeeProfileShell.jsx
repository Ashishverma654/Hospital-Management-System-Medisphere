import { useSelector } from 'react-redux';
import { getRoleLabel } from '../../auth/constants.js';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function EmployeeProfileShell() {
  const user = useSelector((state) => state.auth.user);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Employee profile</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">Profile shell</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Profile management will be expanded in a later module. This shell keeps employee account actions inside the
          hospital system namespace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Name" value={user?.name || 'Hospital Employee'} />
        <InfoCard label="Role" value={getRoleLabel(user?.role || 'employee')} />
        <InfoCard label="Email" value={user?.email || 'Not available'} />
      </div>
    </motion.section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-2xl bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{value}</h3>
    </article>
  );
}
