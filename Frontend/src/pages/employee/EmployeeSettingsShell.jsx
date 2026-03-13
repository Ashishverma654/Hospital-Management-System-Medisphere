export default function EmployeeSettingsShell() {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Employee settings</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">Settings placeholder</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Employee preferences, notification settings, and internal app configuration will be attached here in later
          modules.
        </p>
      </div>

      <article className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
        This route is intentionally a shell only for now so the employee app has a stable location for future account
        and workspace settings.
      </article>
    </section>
  );
}
