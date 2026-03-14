import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PATIENT_PORTAL_NAV_ITEMS } from '../../patient/constants.js';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function PatientSectionPage({ title, eyebrow, description }) {
  const user = useSelector((state) => state.auth.user);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.28em] text-[#ee4c35]">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">{title}</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Patient" value={user?.name || 'Patient'} />
        <InfoCard label="Patient ID" value={user?.patientId || 'Pending assignment'} />
        <InfoCard label="Portal section" value={title} />
      </div>

      <article className="rounded-2xl border border-dashed border-border bg-muted/50 p-6">
        <p className="text-sm font-medium text-foreground">Module placeholder</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          This section is intentionally structured as a shell only. Future patient-facing features will plug in here
          without changing the public site or employee system.
        </p>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PATIENT_PORTAL_NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

function InfoCard({ label, value }) {
  return (
    <article className="rounded-xl bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-xl font-semibold text-foreground">{value}</h3>
    </article>
  );
}
