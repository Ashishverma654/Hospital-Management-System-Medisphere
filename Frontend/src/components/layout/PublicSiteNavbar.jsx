import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Menu, X } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { PUBLIC_NAV_ITEMS } from '../../patient/constants.js';

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'text-primary font-semibold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full'
    : 'text-muted-foreground hover:text-foreground transition-colors relative';

export default function PublicSiteNavbar() {
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const portalRoute =
    sessionType === 'patient' && user?.role === 'patient'
      ? '/patient/dashboard'
      : '/patient/login';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={false}
        animate={scrolled ? 'solid' : 'transparent'}
        variants={{
          transparent: { backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' },
          solid: { backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' },
        }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 border-b border-border/50"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img
              src={logoImg}
              alt="MediFlow"
              className="h-9 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                MediFlow
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-0.5">
                Healthcare Platform
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
            <NavLink to={portalRoute} className={navLinkClass}>
              {isAuthenticated && sessionType === 'patient' ? 'My Portal' : 'Patient Login'}
            </NavLink>
            <NavLink
              to="/patient/register"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.97]"
            >
              Register
            </NavLink>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[57px] z-40 border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`
                  }
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to={portalRoute}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                {isAuthenticated && sessionType === 'patient' ? 'My Portal' : 'Patient Login'}
              </NavLink>
              <NavLink
                to="/patient/register"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Register
              </NavLink>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
