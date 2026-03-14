import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Award, Building2, Users, Heart, Shield, Sparkles } from 'lucide-react';
import { getAwards, getLocations } from '../../services/apiServices.js';
import { SkeletonCard } from '../../components/ui/skeleton.jsx';
import { staggerContainer, staggerItem, fadeInUp, fadeInLeft, fadeInRight } from '../../lib/animation-variants.js';

export default function PublicAbout() {
  const [locations, setLocations] = useState([]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [awardData, locationData] = await Promise.all([getAwards(), getLocations()]);
        setAwards(Array.isArray(awardData) ? awardData : []);
        setLocations(Array.isArray(locationData) ? locationData : []);
      } catch { } finally { setLoading(false); }
    };
    loadData();
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 py-16 sm:px-6 lg:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-secondary/5 blur-3xl animate-float delay-200" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> About MediFlow
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              A{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                patient-first
              </span>{' '}
              hospital experience
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              MediFlow connects trust signals, hospital branches, and doctor discovery content from
              the same governance system used by hospital administrators — delivered live to patients and visitors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Value props */}
      <section className="px-4 py-12 sm:px-6 border-y border-border bg-muted/30">
        <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }} className="mx-auto max-w-7xl grid gap-5 md:grid-cols-3">
          <ValueCard icon={Building2} title="Hospital overview" description="Public-facing departments, specialists, and branch information come from live hospital master data." />
          <ValueCard icon={MapPin} title={`${locations.length} Active Locations`} description="Hospital branches available for patients and visitors, managed by the admin team." />
          <ValueCard icon={Award} title={`${awards.length} Awards & Recognition`} description="Trust signals from hospital awards and certifications, displayed for public confidence." />
        </motion.div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeInLeft}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Mission</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Transforming hospital operations</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              MediFlow is an enterprise-grade hospital management platform that unifies patient care,
              clinical workflows, and administrative operations into a single, intuitive system.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, text: 'Multi-role access control' },
                { icon: Heart, text: 'Patient-centered care' },
                { icon: Shield, text: 'Full audit compliance' },
                { icon: Sparkles, text: 'Real-time data feeds' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeInRight} className="grid grid-cols-2 gap-4">
            <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
              <p className="text-4xl font-bold text-primary">8</p>
              <p className="mt-1 text-sm text-muted-foreground">User roles supported</p>
            </motion.div>
            <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
              <p className="text-4xl font-bold text-primary">24/7</p>
              <p className="mt-1 text-sm text-muted-foreground">System availability</p>
            </motion.div>
            <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
              <p className="text-4xl font-bold text-primary">100%</p>
              <p className="mt-1 text-sm text-muted-foreground">Audit traceability</p>
            </motion.div>
            <motion.div variants={staggerItem} className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
              <p className="text-4xl font-bold text-primary">Live</p>
              <p className="mt-1 text-sm text-muted-foreground">Data sync</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Locations & Awards */}
      <section className="px-4 py-16 sm:px-6 bg-muted/30">
        <div className="mx-auto max-w-7xl grid gap-10 lg:grid-cols-2">
          {/* Locations */}
          <motion.div {...fadeInUp}>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Hospital Locations</h2>
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {locations.map((loc) => (
                  <article key={loc._id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/30">
                    <p className="font-semibold text-foreground">{loc.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[loc.city, loc.state].filter(Boolean).join(', ')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{loc.address}</p>
                  </article>
                ))}
                {locations.length === 0 && <p className="text-sm text-muted-foreground">No locations published yet.</p>}
              </div>
            )}
          </motion.div>

          {/* Awards */}
          <motion.div {...fadeInUp}>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-5/10">
                <Award className="h-4 w-4 text-chart-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Awards & Recognition</h2>
            </div>
            {loading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
            ) : (
              <div className="space-y-3">
                {awards.map((award) => (
                  <article key={award._id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{award.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{award.organization}</p>
                        {award.description && <p className="mt-2 text-xs text-muted-foreground">{award.description}</p>}
                      </div>
                      {award.year && (
                        <span className="shrink-0 rounded-full bg-chart-5/10 px-2.5 py-1 text-xs font-semibold text-chart-5">{award.year}</span>
                      )}
                    </div>
                  </article>
                ))}
                {awards.length === 0 && <p className="text-sm text-muted-foreground">No awards published yet.</p>}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description }) {
  return (
    <motion.article variants={staggerItem} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.article>
  );
}
