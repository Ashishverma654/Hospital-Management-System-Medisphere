import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { getDepartments, getDoctors, getLocations, getSpecializations } from '../../services/apiServices.js';

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    const loadMasterData = async () => {
      const [deptData, locationData, specializationData] = await Promise.all([
        getDepartments(),
        getLocations(),
        getSpecializations(),
      ]);

      setDepartments(Array.isArray(deptData) ? deptData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
      setSpecializations(Array.isArray(specializationData) ? specializationData : []);
    };

    loadMasterData();
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      try {
        const data = await getDoctors({
          departmentId: departmentId || undefined,
          specializationId: specializationId || undefined,
          locationId: locationId || undefined,
        });
        setDoctors(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [departmentId, specializationId, locationId]);

  const visibleDoctors = useMemo(() => {
    if (!search.trim()) {
      return doctors;
    }

    const query = search.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const name = doctor.userId?.name?.toLowerCase() || '';
      const dept = doctor.departmentId?.name?.toLowerCase() || '';
      const specs = (doctor.specializationIds || []).map((item) => item.name.toLowerCase()).join(' ');
      return name.includes(query) || dept.includes(query) || specs.includes(query);
    });
  }, [doctors, search]);

  return (
    <section className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2.25rem] bg-gradient-to-br from-sky-900 via-cyan-900 to-teal-700 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-100">Doctor Discovery</p>
          <h1 className="mt-3 text-4xl font-semibold">Browse published specialists from the live hospital directory</h1>
          <p className="mt-4 max-w-3xl text-cyan-50/90">
            Doctor profiles, departments, specializations, and branch assignments are now driven directly by the
            hospital administration system.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/patient/register" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-slate-100">
              Create Patient Account
            </Link>
            <Link to="/patient/login" className="rounded-full border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Sign In to Portal
            </Link>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),220px,240px,220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search doctors, departments, or specialties"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900"
            />
          </div>
          <select value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setSpecializationId(''); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
            <option value="">All Departments</option>
            {departments.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
          <select value={specializationId} onChange={(event) => setSpecializationId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
            <option value="">All Specializations</option>
            {specializations
              .filter((item) => !departmentId || item.departmentId?._id === departmentId)
              .map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
          </select>
          <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
            <option value="">All Locations</option>
            {locations.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading && <p className="text-sm text-slate-500">Loading published doctors...</p>}
          {!loading && visibleDoctors.length === 0 && (
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              No published doctors matched the current filters.
            </article>
          )}
          {visibleDoctors.map((doctor) => (
            <Link key={doctor._id} to={`/find-doctors/${doctor._id}`} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <img
                  src={doctor.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
                  alt={doctor.userId?.name || 'Doctor'}
                  className="h-20 w-20 rounded-[1.25rem] object-cover"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[#ee4c35]">{doctor.departmentId?.name}</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{doctor.title} {doctor.userId?.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{(doctor.specializationIds || []).map((item) => item.name).join(', ') || 'Specialist profile'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <p>{doctor.experienceYears || 0} years experience</p>
                <p>Consultation fee: ₹{Number(doctor.consultationFee || 0).toLocaleString()}</p>
                <p className="line-clamp-2">{doctor.about || (doctor.expertise || []).join(', ') || 'Profile summary coming soon.'}</p>
                <p className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4 text-[#ee4c35]" />
                  {(doctor.hospitalLocations || []).map((item) => item.name).join(', ') || 'Hospital locations'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
