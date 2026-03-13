import { Outlet } from 'react-router-dom';
import PublicSiteNavbar from './PublicSiteNavbar.jsx';

export default function PublicPatientLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(238,76,53,0.12),_transparent_32%),linear-gradient(180deg,_#fff_0%,_#f8fafc_100%)]">
      <PublicSiteNavbar />
      <main className="min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>MediFlow patient app shell for public access and future patient services.</p>
          <p>Employee tools remain in the separate hospital staff system.</p>
        </div>
      </footer>
    </div>
  );
}
