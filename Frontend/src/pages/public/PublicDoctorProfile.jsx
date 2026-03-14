import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, BriefcaseMedical, GraduationCap, IndianRupee, Trophy, ArrowLeft, Calendar, Video } from 'lucide-react';
import { appointmentApi, getDoctorPublicById, slotApi } from '../../services/apiServices.js';
import { SkeletonCard } from '../../components/ui/skeleton.jsx';
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, staggerItem } from '../../lib/animation-variants.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs.jsx';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

export default function PublicDoctorProfile() {
  const { id } = useParams();
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const isPatient = isAuthenticated && sessionType === 'patient' && user?.role === 'patient';
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bookingRef = useRef(null);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [bookingMode, setBookingMode] = useState('in-person');
  const [bookingLocationId, setBookingLocationId] = useState('');
  const [bookingSaving, setBookingSaving] = useState(false);

  useEffect(() => {
    const loadDoctor = async () => {
      setLoading(true);
      try { setDoctor(await getDoctorPublicById(id)); setError(''); }
      catch (err) { setError(err.response?.data?.message || 'Doctor profile not available.'); }
      finally { setLoading(false); }
    };
    loadDoctor();
  }, [id]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!doctor?._id || !bookingDate) return;
      setSlotLoading(true);
      try {
        const response = await slotApi.getByDoctor(doctor._id, bookingDate);
        setAvailableSlots(response?.availableSlots || []);
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };
    loadSlots();
  }, [doctor?._id, bookingDate]);

  const resolveFee = () => {
    if (!doctor) return 0;
    let fee = doctor.consultationFee || 0;
    if (bookingMode === 'video' && doctor.consultationFeeVideo != null) {
      fee = doctor.consultationFeeVideo;
    }
    if (bookingMode === 'phone' && doctor.consultationFeePhone != null) {
      fee = doctor.consultationFeePhone;
    }
    if (bookingMode === 'in-person' && bookingLocationId) {
      const match = (doctor.locationFees || []).find((item) => item.locationId === bookingLocationId || item.locationId?._id === bookingLocationId);
      if (match?.fee != null) fee = match.fee;
    }
    return fee;
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error('Select a slot to continue.');
      return;
    }
    setBookingSaving(true);
    try {
      await appointmentApi.book({
        doctorId: doctor._id,
        date: bookingDate,
        slot: selectedSlot,
        visitType: 'newConsultation',
        consultationMode: bookingMode,
        hospitalLocationId: bookingMode === 'in-person' ? bookingLocationId || undefined : undefined,
      });
      toast.success('Appointment booked successfully.');
      setSelectedSlot('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to book appointment.');
    } finally {
      setBookingSaving(false);
    }
  };

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

  const specializationList = (doctor.specializationIds || []).map((item) => item.name);
  const expertiseList = doctor.expertise || [];

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div {...fadeInUp}>
          <Link to="/find-doctors" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Doctor Discovery
          </Link>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <motion.div {...fadeInLeft} className="grid gap-6 lg:grid-cols-[240px,1fr]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
                    alt={doctor.userId?.name || 'Doctor'}
                    className="h-56 w-56 rounded-full object-cover ring-4 ring-border shadow-lg"
                  />
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-center">
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">₹{Number(doctor.consultationFee || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Doctor Profile</p>
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{doctor.title} {doctor.userId?.name}</h1>
                <p className="text-lg text-muted-foreground">{doctor.departmentId?.name || 'Clinical Department'}</p>
                <p className="text-sm text-muted-foreground">{doctor.qualifications?.join(' | ') || 'Qualifications to be updated'}</p>
                <p className="text-sm text-muted-foreground">Experience: {doctor.experienceYears || 0}+ years</p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {isPatient ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingMode('in-person');
                          bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-all active:scale-[0.98]"
                      >
                        <Calendar className="h-4 w-4" /> Book in-hospital
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingMode('video');
                          bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                      >
                        <Video className="h-4 w-4" /> Video consult
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/patient/register"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-all active:scale-[0.98]"
                      >
                        <Calendar className="h-4 w-4" /> Register to book
                      </Link>
                      <Link
                        to="/patient/login"
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                      >
                        <Video className="h-4 w-4" /> Patient login
                      </Link>
                    </>
                  )}
                </div>

                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-3 sm:grid-cols-3">
                  <QuickStat icon={BriefcaseMedical} label="Experience" value={`${doctor.experienceYears || 0} years`} />
                  <QuickStat icon={GraduationCap} label="Qualifications" value={(doctor.qualifications || []).length || 0} />
                  <QuickStat icon={IndianRupee} label="Fee" value={`₹${Number(doctor.consultationFee || 0).toLocaleString()}`} />
                </motion.div>
              </div>
            </motion.div>
          </div>

          <motion.div {...fadeInRight} className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" ref={bookingRef}>
            <Tabs defaultValue="inHospital">
              <TabsList>
                <TabsTrigger value="inHospital">In-Hospital</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="inHospital">
                <div className="space-y-4">
                  {(doctor.hospitalLocations || []).map((item) => (
                    <div key={item._id} className="rounded-2xl border border-border p-4 transition-colors hover:bg-muted/30">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Slots available • ₹{Number(doctor.consultationFee || 0).toLocaleString()}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {[item.city, item.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ))}
                  {(doctor.hospitalLocations || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Hospital availability will be updated soon.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video">
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Video consultation slots will appear here when they are published by the hospital team.
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Book an appointment</p>
              {!isPatient && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in as a patient to select a slot and confirm an appointment.
                </p>
              )}
              {isPatient && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Select date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setSelectedSlot('');
                      }}
                      className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                    />
                  </div>
                  {bookingMode === 'in-person' && (doctor.hospitalLocations || []).length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Select location</label>
                      <select
                        value={bookingLocationId}
                        onChange={(e) => setBookingLocationId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Choose hospital location</option>
                        {(doctor.hospitalLocations || []).map((loc) => (
                          <option key={loc._id} value={loc._id}>
                            {loc.name}{loc.city ? ` • ${loc.city}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Available slots</label>
                    <div className="flex flex-wrap gap-2">
                      {slotLoading && <span className="text-sm text-muted-foreground">Loading slots...</span>}
                      {!slotLoading && availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            selectedSlot === slot
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card text-foreground hover:bg-muted'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                      {!slotLoading && availableSlots.length === 0 && (
                        <span className="text-sm text-muted-foreground">No available slots for this date.</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Estimated consultation fee: <span className="font-semibold text-foreground">₹{Number(resolveFee() || 0).toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={!selectedSlot || bookingSaving || (bookingMode === 'in-person' && (doctor.hospitalLocations || []).length > 0 && !bookingLocationId)}
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {bookingSaving ? 'Booking...' : 'Confirm appointment'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Specialization and Expertise</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[...specializationList, ...expertiseList].length === 0 && (
                <p className="text-sm text-muted-foreground">Specializations will be updated by the hospital team soon.</p>
              )}
              {[...specializationList, ...expertiseList].map((item) => (
                <div key={item} className="rounded-xl border border-border px-4 py-3 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">About</p>
            <p className="mt-3 text-muted-foreground leading-relaxed">{doctor.about || 'Profile details will be updated by the hospital team soon.'}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Articles</p>
            <div className="mt-3 space-y-3">
              {(doctor.articles || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Articles will appear here when published.</p>
              )}
              {(doctor.articles || []).map((article, index) => (
                <a key={`article-${index}`} href={article.link || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border border-border p-4 hover:bg-muted/30">
                  <img
                    src={article.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(article.title || 'Article')}`}
                    alt={article.title || 'Article'}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">{article.date || 'Article'}</p>
                    <p className="text-base font-semibold text-foreground">{article.title || 'Article title'}</p>
                    <p className="text-xs text-muted-foreground">By {doctor.userId?.name || 'Doctor'}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Media</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {(doctor.media || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Media will appear here when published.</p>
              )}
              {(doctor.media || []).map((item, index) => (
                <a key={`media-${index}`} href={item.url || '#'} target="_blank" rel="noreferrer" className="rounded-2xl border border-border p-4 hover:bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase">{item.type || 'Media'}</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{item.title || 'Media item'}</p>
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.title || 'Media'} className="mt-3 w-full rounded-xl object-cover" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {(doctor.awards || []).length > 0 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Awards</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          </div>
        )}
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
