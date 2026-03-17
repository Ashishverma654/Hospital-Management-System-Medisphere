import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, wardApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

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
  }, [search, filterWard]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Inpatient Operations</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Admissions and occupancy</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
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
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Ward-wise occupancy</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Capacity by ward</h3>
            </div>
            <Button type="button" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {wardRows.map((ward) => (
              <div key={ward._id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{ward.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ward.wardNumber} • {ward.wardType}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{ward.bedSummary?.occupiedBeds || 0}/{ward.bedSummary?.totalBeds || 0} occupied</p>
                    <p>₹{Number(ward.defaultPrice || 0).toLocaleString()} default</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm text-muted-foreground">
                  <p>Available: {ward.bedSummary?.availableBeds || 0}</p>
                  <p>Occupied: {ward.bedSummary?.occupiedBeds || 0}</p>
                  <p>Maintenance: {ward.bedSummary?.maintenanceBeds || 0}</p>
                  <p>Reserved: {ward.bedSummary?.reservedBeds || 0}</p>
                </div>
              </div>
            ))}
            {wardRows.length === 0 && <p className="text-sm text-muted-foreground">No ward occupancy data available.</p>}
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search admitted patient, ward, doctor, or bed" className="w-full rounded-2xl border border-border py-3 pl-9 pr-4 text-sm outline-none focus:border-primary" />
            </div>
            <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
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
              <article key={admission.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{admission.patient?.name || 'Admitted patient'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {admission.patient?.patientId || 'No ID'} • {admission.ward?.name || 'Ward'} • Bed {admission.bedNumber}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Admitted {admission.admittedAt ? new Date(admission.admittedAt).toLocaleString() : 'Unknown'}
                    </p>
                    {admission.doctor?.name && (
                      <p className="mt-1 text-sm text-muted-foreground">Doctor: {admission.doctor.name}</p>
                    )}
                    {admission.admissionRecommendation?.admissionRecommendationNotes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Recommendation: {admission.admissionRecommendation.admissionRecommendationNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-foreground">
                      {admission.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
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
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No current admissions match the selected filters.
              </p>
            )}
          </div>
        </article>
      </div>
    </motion.section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-xl bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold text-foreground">{value}</h3>
    </article>
  );
}
