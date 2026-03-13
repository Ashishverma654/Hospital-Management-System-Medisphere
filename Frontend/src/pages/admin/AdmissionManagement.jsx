import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, wardApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { RefreshCw, Search } from 'lucide-react';

export default function AdmissionManagement() {
  const [summary, setSummary] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState('');
  const [filterWard, setFilterWard] = useState('');

  const load = async () => {
    try {
      const [summaryData, admissionsData, wardsData] = await Promise.all([
        wardApi.getSummary(),
        bedApi.getCurrentAdmissions({
          search: search || undefined,
          wardId: filterWard || undefined,
        }),
        wardApi.getAll({}),
      ]);
      setSummary(summaryData);
      setAdmissions(Array.isArray(admissionsData) ? admissionsData : []);
      setWards(Array.isArray(wardsData) ? wardsData : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load occupancy dashboard.');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [search, filterWard]);

  const wardRows = useMemo(() => summary?.wards || [], [summary]);

  const discharge = async (admission) => {
    try {
      await bedApi.discharge(admission.id);
      toast.success('Patient discharged successfully.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to discharge patient.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Inpatient Operations</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Admissions and occupancy</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Monitor ward occupancy, current admissions, available capacity, and doctor-linked admission recommendations in one operational view.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total wards" value={summary?.totalWards ?? 0} />
        <SummaryCard label="Total beds" value={summary?.totalBeds ?? 0} />
        <SummaryCard label="Available" value={summary?.availableBeds ?? 0} />
        <SummaryCard label="Occupied" value={summary?.occupiedBeds ?? 0} />
        <SummaryCard label="Maintenance" value={summary?.maintenanceBeds ?? 0} />
        <SummaryCard label="Reserved" value={summary?.reservedBeds ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Ward-wise occupancy</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Capacity by ward</h3>
            </div>
            <Button type="button" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {wardRows.map((ward) => (
              <div key={ward._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{ward.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {ward.wardNumber} • {ward.wardType}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{ward.bedSummary?.occupiedBeds || 0}/{ward.bedSummary?.totalBeds || 0} occupied</p>
                    <p>₹{Number(ward.defaultPrice || 0).toLocaleString()} default</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm text-slate-600">
                  <p>Available: {ward.bedSummary?.availableBeds || 0}</p>
                  <p>Occupied: {ward.bedSummary?.occupiedBeds || 0}</p>
                  <p>Maintenance: {ward.bedSummary?.maintenanceBeds || 0}</p>
                  <p>Reserved: {ward.bedSummary?.reservedBeds || 0}</p>
                </div>
              </div>
            ))}
            {wardRows.length === 0 && <p className="text-sm text-slate-500">No ward occupancy data available.</p>}
          </div>
        </article>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search admitted patient, ward, doctor, or bed" className="w-full rounded-2xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-slate-900" />
            </div>
            <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900">
              <option value="">All wards</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {admissions.map((admission) => (
              <article key={admission.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{admission.patient?.name || 'Admitted patient'}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {admission.patient?.patientId || 'No ID'} • {admission.ward?.name || 'Ward'} • Bed {admission.bedNumber}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Admitted {admission.admittedAt ? new Date(admission.admittedAt).toLocaleString() : 'Unknown'}
                    </p>
                    {admission.doctor?.name && (
                      <p className="mt-1 text-sm text-slate-600">Doctor: {admission.doctor.name}</p>
                    )}
                    {admission.admissionRecommendation?.admissionRecommendationNotes && (
                      <p className="mt-2 text-sm text-slate-600">
                        Recommendation: {admission.admissionRecommendation.admissionRecommendationNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {admission.status}
                    </span>
                    <span className="text-sm text-slate-600">
                      ₹{Number(admission.effectivePrice || 0).toLocaleString()}
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => discharge(admission)}>
                      Discharge
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {admissions.length === 0 && (
              <p className="rounded-[1.25rem] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No current admissions match the selected filters.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-[1.5rem] bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold text-slate-900">{value}</h3>
    </article>
  );
}
