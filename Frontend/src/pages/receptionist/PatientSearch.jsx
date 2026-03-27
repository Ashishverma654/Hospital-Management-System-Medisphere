import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { receptionistApi } from '../../services/apiServices.js';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function PatientSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const goToHistory = (patientId) => {
    if (!patientId) return;
    navigate(`/employee/receptionist/history?patientId=${patientId}`);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await receptionistApi.searchPatients({
          query,
          departmentId: departmentFilter || undefined,
          doctorId: doctorFilter || undefined,
        });
        setPatients(response.patients || []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, departmentFilter, doctorFilter]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await receptionistApi.getBookingOptions();
        setDepartments(Array.isArray(response?.departments) ? response.departments : []);
        setDoctors(Array.isArray(response?.doctors) ? response.doctors : []);
      } catch {
        setDepartments([]);
        setDoctors([]);
      }
    };

    loadFilters();
  }, []);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-semibold text-foreground">Search Patients</h2>
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by patient name, patient ID, phone, or email"
              className="w-full rounded-2xl border border-border py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="w-fit rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
          {showFilters && (
            <>
              <select
                value={departmentFilter}
                onChange={(event) => {
                  setDepartmentFilter(event.target.value);
                  setDoctorFilter('');
                }}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={doctorFilter}
                onChange={(event) => setDoctorFilter(event.target.value)}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">All Doctors</option>
                {doctors
                  .filter((doc) => !departmentFilter || String(doc.departmentId?._id) === String(departmentFilter))
                  .map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.userId?.name || 'Doctor'}
                    </option>
                  ))}
              </select>
            </>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Searching patients...</p>}
          {!loading && patients.length === 0 && query.trim() && <p className="text-sm text-muted-foreground">No patient matched the search.</p>}
          {patients.map((patient) => (
            <article key={patient.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">{patient.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{patient.patientId} • {patient.phone} • {patient.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/employee/receptionist/appointments?patientId=${patient.id}`}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Book Appointment
                </Link>
                <button
                  type="button"
                  onClick={() => goToHistory(patient.id)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  View History
                </button>
                <button
                  type="button"
                  onClick={() => goToHistory(patient.id)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Review
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>
    </motion.section>
  );
}
