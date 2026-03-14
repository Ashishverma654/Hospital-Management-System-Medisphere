import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function PortalShell() {
  const user = useSelector((state) => state.auth.user);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-3xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Module 1 foundation</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">Patient portal shell</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          This is the isolated patient app surface. Future appointment, billing, prescriptions, and records
          modules can plug into this route tree without mixing with employee navigation or authentication.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Patient" value={user?.name || 'Patient'} />
        <InfoCard label="Patient ID" value={user?.patientId || 'Pending assignment'} />
        <InfoCard label="Session" value="Patient-only" />
      </div>
    </motion.section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-3xl bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-foreground">{value}</h3>
    </article>
  );
}
