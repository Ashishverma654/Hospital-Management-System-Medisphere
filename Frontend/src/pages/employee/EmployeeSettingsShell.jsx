export default function EmployeeSettingsShell() {
  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Employee settings</p>
        <h2 className="mt-3 text-3xl font-semibold text-foreground">Settings placeholder</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Employee preferences, notification settings, and internal app configuration will be attached here in later
          modules.
        </p>
      </div>

      <article className="rounded-2xl border border-dashed border-border bg-muted/50 p-6 text-muted-foreground">
        This route is intentionally a shell only for now so the employee app has a stable location for future account
        and workspace settings.
      </article>
    </motion.section>
  );
}
