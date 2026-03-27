import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { MapPin, Search, ArrowRight, Sparkles } from 'lucide-react';
import { getDepartments, getDoctors, getLocations } from '../../services/apiServices.js';
import { SkeletonCard } from '../../components/ui/skeleton.jsx';
import { staggerContainer, staggerItem, fadeInUp } from '../../lib/animation-variants.js';

export default function FindDoctors() {
  const { isAuthenticated, sessionType, user } = useSelector((state) => state.auth);
  const isPatient = isAuthenticated && sessionType === 'patient' && user?.role === 'patient';
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    const loadMasterData = async () => {
      const [deptData, locationData] = await Promise.all([getDepartments(), getLocations()]);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
    };
    loadMasterData();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      try {
        const data = await getDoctors({ departmentId: departmentId || undefined, locationId: locationId || undefined });
        setDoctors(Array.isArray(data) ? data : []);
      } finally { setLoading(false); }
    };
    loadDoctors();
  }, [departmentId, locationId]);

  const visibleDoctors = useMemo(() => {
    if (!search.trim()) return doctors;
    const query = search.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const name = doctor.userId?.name?.toLowerCase() || '';
      const dept = doctor.departmentId?.name?.toLowerCase() || '';
      const specs = (doctor.specializationIds || []).map((i) => i.name.toLowerCase()).join(' ');
      return name.includes(query) || dept.includes(query) || specs.includes(query);
    });
  }, [doctors, search]);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 py-14 sm:px-6 lg:py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-secondary/5 blur-3xl animate-float" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <motion.div {...fadeInUp}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> Doctor Discovery
            </span>
            <h1 className="mt-5 text-4xl font-bold text-foreground sm:text-5xl">
              Find your{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">specialist</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Browse published doctor profiles, filter by department, and view live availability from the hospital directory.
            </p>
            <div className="mt-6 flex gap-3">
              {isPatient ? (
                <>
                  <Link to="/patient/appointments" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-all">My Appointments</Link>
                  <Link to="/patient/dashboard" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Go to Portal</Link>
                </>
              ) : (
                <>
                  <Link to="/patient/register" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-all">Register to Book</Link>
                  <Link to="/patient/login" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Patient Login</Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 md:items-center">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doctors, departments, or specialties"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); }}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">All Departments</option>
                {departments.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">All Locations</option>
                {locations.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : visibleDoctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">No published doctors matched the current filters.</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleDoctors.map((doctor) => (
                <motion.div key={doctor._id} variants={staggerItem}>
                  <Link to={`/find-doctors/${doctor._id}`}
                    className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
                        alt={doctor.userId?.name || 'Doctor'}
                        className="h-20 w-20 rounded-2xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{doctor.departmentId?.name}</p>
                        <h2 className="mt-1 text-lg font-semibold text-foreground truncate">{doctor.title} {doctor.userId?.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{(doctor.specializationIds || []).map((i) => i.name).join(', ') || 'Specialist'}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                      <p>{doctor.experienceYears || 0} years experience • ₹{Number(doctor.consultationFee || 0).toLocaleString()}</p>
                      <p className="line-clamp-1">{doctor.about || (doctor.expertise || []).join(', ') || 'Profile details available'}</p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {(doctor.hospitalLocations || []).map((i) => i.name).join(', ') || 'Hospital locations'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">View full profile</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
