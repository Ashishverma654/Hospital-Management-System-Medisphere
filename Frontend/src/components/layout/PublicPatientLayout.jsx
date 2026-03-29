import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import logoNameImg from '../../assets/logoName.png';
import PublicSiteNavbar from './PublicSiteNavbar.jsx';
import { pageVariants } from '../../lib/animation-variants.js';

export default function PublicPatientLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

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
      <footer className="relative border-t border-border bg-card/90 backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            {/* Brand + Quick actions */}
            <div className="space-y-6">
              <Link to="/" className="inline-flex items-center">
                <img src={logoNameImg} alt="Medisphere" className="h-6 w-auto" />
              </Link>
              <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
                Enterprise-grade hospital management platform delivering modern healthcare experiences with
                always-on care access, transparent records, and trusted specialists.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/find-doctors" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  Find Doctors
                </Link>
                <Link to="/patient/login" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  Patient Login
                </Link>
                <Link to="/patient/register" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-lg hover:brightness-110">
                  Create Account
                </Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  24/7 Support
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  HIPAA Ready
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  Secure Records
                </span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="rounded-2xl border border-border bg-background/80 p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-foreground">Get care updates</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Monthly health tips, new specialist launches, and clinic announcements.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
                >
                  Subscribe
                </button>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">For Patients</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
                <li><Link to="/find-doctors" className="hover:text-foreground transition-colors">Find Doctors</Link></li>
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/find-doctors" className="hover:text-foreground transition-colors">Book Appointment</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/find-doctors?service=general-medicine" className="hover:text-foreground transition-colors">General Medicine</Link></li>
                <li><Link to="/find-doctors?service=diagnostics" className="hover:text-foreground transition-colors">Laboratory & Diagnostics</Link></li>
                <li><Link to="/find-doctors?service=pharmacy" className="hover:text-foreground transition-colors">Pharmacy Services</Link></li>
                <li><Link to="/find-doctors?service=emergency" className="hover:text-foreground transition-colors">Emergency Care</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Contact</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <a href="tel:+911800000000" className="hover:text-foreground transition-colors">+91 1800-XXX-XXXX</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <a href="mailto:info@medisphere.tech" className="hover:text-foreground transition-colors">info@medisphere.tech</a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary mt-0.5" /> Healthcare Complex, India
                </li>
              </ul>
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/20">
                <iframe
                  title="Medisphere Hospital Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=78.4500%2C17.3600%2C78.5200%2C17.4200&layer=mapnik&marker=17.3850%2C78.4867"
                  className="h-36 w-full"
                  loading="lazy"
                />
              </div>
              <a
                href="https://www.openstreetmap.org/?mlat=17.3850&mlon=78.4867#map=13/17.3850/78.4867"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
              >
                Open map →
              </a>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Connect</h4>
              <div className="flex flex-wrap gap-2">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Follow for health updates and events.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Medisphere Healthcare. All rights reserved.
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


