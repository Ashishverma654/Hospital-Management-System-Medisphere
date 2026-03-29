import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Award, MapPin, Stethoscope, ArrowRight, Users, Building2, Heart, Clock, Shield, Sparkles } from 'lucide-react';
import { getHomepageContent } from '../../services/apiServices.js';
import { staggerContainer, staggerItem, fadeInUp, fadeInLeft } from '../../lib/animation-variants.js';
import { SkeletonCard } from '../../components/ui/skeleton.jsx';

export default function Home() {
  const [content, setContent] = useState({
    featuredDepartments: [],
    featuredDoctors: [],
    locations: [],
    awards: [],
    specializations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fallbackLocationImage = 'https://images.unsplash.com/photo-1504814532849-9271f9d406ac?q=80&w=1200&auto=format&fit=crop';
  const assetBase = (() => {
    const raw = import.meta.env.VITE_API_URL;
    if (!raw) return '';
    const trimmed = raw.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
  })();
  const resolveLocationImage = (url) => {
    if (!url) return fallbackLocationImage;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/') && assetBase) return `${assetBase}${url}`;
    return url;
  };

  useEffect(() => {
    const loadHomepage = async () => {
      setLoading(true);
      try {
        const data = await getHomepageContent();
        setContent({
          featuredDepartments: data.featuredDepartments || [],
          featuredDoctors: data.featuredDoctors || [],
          locations: data.locations || [],
          awards: data.awards || [],
          specializations: data.specializations || [],
        });
        setError('');
      } catch (err) {
        console.error('Homepage Load Error:', err);
        setError(err.response?.data?.message || 'Unable to connect to the healthcare server. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    loadHomepage();
  }, []);

  return (
    <div className="overflow-hidden">
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-3.5 text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative min-h-[100svh] px-4 py-16 sm:px-6 lg:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-75 contrast-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-background/70" />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-secondary/5 blur-3xl animate-float delay-200" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left content */}
            <motion.div {...fadeInLeft}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Enterprise Healthcare Platform
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Modern healthcare,{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  delivered digitally
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground leading-relaxed">
                Explore featured specialists, departments, and hospital locations. Book appointments, track prescriptions, and manage your health — all from one platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/patient/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.97]"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/find-doctors"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.97]"
                >
                  Find Doctors
                </Link>
                <Link
                  to="/patient/login"
                  className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Patient Login →
                </Link>
              </div>
            </motion.div>

            {/* Right stats cards */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="rounded-3xl p-4 sm:p-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{loading ? '...' : content.featuredDoctors.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Featured Doctors</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-primary/60" />
                </div>
              </motion.div>

                <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                  <Building2 className="h-5 w-5 text-secondary" />
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{loading ? '...' : content.featuredDepartments.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Departments</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-1/2 rounded-full bg-secondary/60" />
                </div>
              </motion.div>

                <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{loading ? '...' : content.locations.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Locations</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-5/6 rounded-full bg-accent/60" />
                </div>
              </motion.div>

                <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/10">
                  <Award className="h-5 w-5 text-chart-5" />
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{loading ? '...' : content.awards.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Awards Won</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-1/3 rounded-full bg-chart-5/60" />
                </div>
              </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> HIPAA Compliant</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 24/7 Support</span>
            <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Trusted by patients</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Enterprise Grade</span>
          </div>
        </div>
      </section>

      {/* ── Spotlight Cards ───────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why Medisphere</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Everything you need, in one place</h2>
          </motion.div>

          <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true, margin: '-80px' }} className="grid gap-5 md:grid-cols-3">
            <SpotlightCard
              icon={Heart}
              title="Personal Health Portal"
              description="A dedicated patient workspace for your care history, documents, and follow-ups."
              ctaLabel="Open patient login"
              ctaTo="/patient/login"
            />
            <SpotlightCard
              icon={Stethoscope}
              title="Doctor Discovery"
              description="Browse live published doctor profiles, departments, and hospital branches."
              ctaLabel="Browse doctors"
              ctaTo="/find-doctors"
            />
            <SpotlightCard
              icon={Shield}
              title="Hospital Trust Signals"
              description="Awards, branches, and clinical specialties driven by admin-managed data."
              ctaLabel="Learn about us"
              ctaTo="/about"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Featured Doctors ──────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Team</span>
              <h2 className="mt-2 text-3xl font-bold text-foreground">Meet our specialists</h2>
            </div>
            <Link
              to="/find-doctors"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : content.featuredDoctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              Featured doctors will appear here once published by the admin team.
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {content.featuredDoctors.slice(0, 6).map((doctor) => (
                <motion.div key={doctor._id} variants={staggerItem}>
                  <Link
                    to={`/find-doctors/${doctor._id}`}
                    className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary/30"
                  >
                    <div className="flex gap-4">
                      <img
                        src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
                        alt={doctor.userId?.name || 'Doctor'}
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {doctor.title} {doctor.userId?.name}
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-primary">{doctor.departmentId?.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {(doctor.specializationIds || []).map((item) => item.name).join(', ') || 'Specialist'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {doctor.experienceYears || 0} years experience
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">View profile</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link to="/find-doctors" className="text-sm font-semibold text-primary hover:underline">
              View all doctors →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Departments ─────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10">
            {/* Departments */}
            <motion.div {...fadeInLeft}>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Clinical</span>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Departments</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {content.featuredDepartments.map((dept) => (
                  <div key={dept._id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Stethoscope className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.description || 'Clinical department'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && content.featuredDepartments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Departments will appear here once published.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Awards & Locations ────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 bg-muted/30">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Awards */}
          <motion.div {...fadeInUp}>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-5/10">
                <Award className="h-4 w-4 text-chart-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-chart-5">Recognition</span>
                <h2 className="text-2xl font-bold text-foreground">Hospital Awards</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {content.awards.map((award) => (
                <div key={award._id} className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-chart-5/30">
                  <div className="flex gap-4">
                    {award.image && (
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        <img 
                          src={award.image} 
                          alt={award.title} 
                          className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{award.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm text-muted-foreground">{award.organization}</p>
                        {award.issuedByType && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {award.issuedByType}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-primary font-medium">{award.category}</p>
                        {award.year && <span className="text-xs text-muted-foreground">•</span>}
                        {award.year && <span className="text-xs text-muted-foreground">{award.year}</span>}
                      </div>
                      {award.description && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{award.description}</p>
                      )}
                      {award.certificateUrl && (
                        <a 
                          href={award.certificateUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-chart-5 hover:underline"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && content.awards.length === 0 && (
                <p className="text-sm text-muted-foreground">Awards will appear here once published.</p>
              )}
            </div>
          </motion.div>

          {/* Locations */}
          <motion.div {...fadeInUp}>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Branches</span>
                <h2 className="text-2xl font-bold text-foreground">Hospital Locations</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {content.locations.map((location) => (
                <div key={location._id} className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/30">
                  <div className="h-32 w-full bg-muted">
                    <img
                      src={resolveLocationImage(location.image)}
                      alt={location.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.src = fallbackLocationImage; }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-foreground">{location.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[location.city, location.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{location.address}</p>
                  </div>
                </div>
              ))}
              {!loading && content.locations.length === 0 && (
                <p className="text-sm text-muted-foreground">Locations will appear once configured.</p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

function SpotlightCard({ icon: Icon, title, description, ctaLabel, ctaTo }) { // eslint-disable-line no-unused-vars
  return (
    <motion.article
      variants={staggerItem}
      className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      <Link
        to={ctaTo}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        {ctaLabel} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.article>
  );
}

