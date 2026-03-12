import { Outlet } from 'react-router-dom';
import PublicSiteNavbar from './PublicSiteNavbar.jsx';

export default function PublicPatientLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicSiteNavbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
