import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BriefcaseMedical, GraduationCap, IndianRupee, Trophy, ArrowLeft, Calendar } from 'lucide-react';
import { getDoctorPublicById } from '../../services/apiServices.js';
import { SkeletonCard } from '../../components/ui/skeleton.jsx';
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, staggerItem } from '../../lib/animation-variants.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.jsx';

export default function PublicDoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDoctor = async () => {
      setLoading(true);
      try { setDoctor(await getDoctorPublicById(id)); setError(''); }
      catch (err) { setError(err.response?.data?.message || 'Doctor profile not available.'); }
      finally { setLoading(false); }
    };
    loadDoctor();
  }, [id]);

  if (loading) {
    return (
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[280px,1fr]">
          <SkeletonCard className="h-80" />
          <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        </div>
      </section>
    );
  }

  if (!doctor) {
    return (
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">Profile unavailable</h1>
          <p className="mt-3 text-muted-foreground">{error || 'This doctor could not be loaded.'}</p>
          <Link to="/find-doctors" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to doctors
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back */}
        <motion.div {...fadeInUp}>
          <Link to="/find-doctors" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Doctor Discovery
          </Link>
        </motion.div>

        {/* Main card */}
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:grid-cols-[280px,minmax(0,1fr)]">
          {/* Left column */}
          <motion.div {...fadeInLeft} className="space-y-4 text-center">
            <img
              src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
              alt={doctor.userId?.name || 'Doctor'}
              className="mx-auto h-56 w-56 rounded-3xl object-cover ring-4 ring-border shadow-md"
            />
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Consultation Fee</p>
              <p className="mt-1 text-3xl font-bold text-foreground">₹{Number(doctor.consultationFee || 0).toLocaleString()}</p>
            </div>
            <Link
              to="/patient/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-all active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4" /> Book Appointment
            </Link>
          </motion.div>

          {/* Right column */}
          <motion.div {...fadeInRight} className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Published Doctor Profile</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{doctor.title} {doctor.userId?.name}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{doctor.departmentId?.name || 'Clinical Department'}</p>
            </div>

            {/* Quick stats */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3 sm:grid-cols-3">
              <QuickStat icon={BriefcaseMedical} label="Experience" value={`${doctor.experienceYears || 0} years`} />
              <QuickStat icon={GraduationCap} label="Qualifications" value={(doctor.qualifications || []).length || 0} />
              <QuickStat icon={IndianRupee} label="Fee" value={`₹${Number(doctor.consultationFee || 0).toLocaleString()}`} />
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="specializations">
              <TabsList>
                <TabsTrigger value="specializations">Specializations</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                {(doctor.awards || []).length > 0 && <TabsTrigger value="awards">Awards</TabsTrigger>}
              </TabsList>

              <TabsContent value="specializations">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(doctor.specializationIds || []).map((item) => (
                      <span key={item._id} className="rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm font-medium text-foreground">{item.name}</span>
                    ))}
                  </div>
                  {(doctor.expertise || []).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {doctor.expertise.map((item) => (
                          <span key={item} className="rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-sm text-primary">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about">
                <p className="text-muted-foreground leading-relaxed">{doctor.about || 'Profile details will be updated by the hospital team soon.'}</p>
              </TabsContent>

              <TabsContent value="locations">
                <div className="space-y-3">
                  {(doctor.hospitalLocations || []).map((item) => (
                    <div key={item._id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {[item.city, item.state, item.address].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ))}
                  {(doctor.hospitalLocations || []).length === 0 && <p className="text-sm text-muted-foreground">Location details coming soon.</p>}
                </div>
              </TabsContent>

              {(doctor.awards || []).length > 0 && (
                <TabsContent value="awards">
                  <div className="grid gap-3 md:grid-cols-2">
                    {doctor.awards.map((award) => (
                      <article key={award._id} className="rounded-xl border border-border p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-chart-5">
                          <Trophy className="h-4 w-4" /> {award.year || 'Recognition'}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">{award.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{award.organization}</p>
                        {award.description && <p className="mt-2 text-xs text-muted-foreground">{award.description}</p>}
                      </article>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function QuickStat({ icon: Icon, label, value }) {
  return (
    <motion.article variants={staggerItem} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
    </motion.article>
  );
}
