import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Heart, Mail, Phone, MapPin } from 'lucide-react';
import PublicSiteNavbar from './PublicSiteNavbar.jsx';
import { pageVariants } from '../../lib/animation-variants.js';

export default function PublicPatientLayout() {
  return (
    <div className="min-h-screen gradient-mesh">
      <PublicSiteNavbar />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="min-h-[calc(100vh-64px)]"
      >
        <Outlet />
      </motion.main>

      {/* Enterprise footer */}
      <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand column */}
            <div className="md:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  MediFlow
                </span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Enterprise-grade hospital management platform delivering modern healthcare experiences.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">For Patients</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/find-doctors" className="hover:text-foreground transition-colors">Find Doctors</Link></li>
                <li><Link to="/patient/login" className="hover:text-foreground transition-colors">Patient Login</Link></li>
                <li><Link to="/patient/register" className="hover:text-foreground transition-colors">Register</Link></li>
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>General Medicine</li>
                <li>Laboratory & Diagnostics</li>
                <li>Pharmacy Services</li>
                <li>Emergency Care</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Contact</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" /> +91 1800-XXX-XXXX
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" /> info@mediflow.care
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary mt-0.5" /> Healthcare Complex, India
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} MediFlow Healthcare. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
              <Link to="/employee/login" className="hover:text-foreground transition-colors">Staff Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
