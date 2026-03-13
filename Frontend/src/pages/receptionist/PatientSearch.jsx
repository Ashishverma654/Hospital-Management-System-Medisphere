import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { receptionistApi } from '../../services/apiServices.js';
import { Search } from 'lucide-react';

export default function PatientSearch() {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await receptionistApi.searchPatients(query);
        setPatients(response.patients || []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Receptionist Workflow</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Search Patients</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Find existing patients quickly before registering duplicates, then jump directly into appointment booking.
        </p>
      </div>

      <article className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by patient name, patient ID, phone, or email"
            className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div className="mt-5 space-y-3">
          {loading && <p className="text-sm text-slate-500">Searching patients...</p>}
          {!loading && patients.length === 0 && query.trim() && <p className="text-sm text-slate-500">No patient matched the search.</p>}
          {patients.map((patient) => (
            <article key={patient.id} className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{patient.name}</p>
                <p className="mt-1 text-sm text-slate-600">{patient.patientId} • {patient.phone} • {patient.email}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/employee/receptionist/appointments?patientId=${patient.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Book Appointment
                </Link>
                <Link to={`/employee/receptionist/register-patient?duplicate=${patient.id}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Review
                </Link>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
