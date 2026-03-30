import { useEffect, useMemo, useState } from 'react';
import { analyticsApi } from '../../services/apiServices.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { LoadingSkeleton, ErrorState } from '../../components/index.js';

const fallbackArray = [];

const unwrap = (payload, fallback = {}) => {
  if (!payload) return fallback;
  if (payload.data !== undefined) return payload.data;
  return payload;
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [revenue, setRevenue] = useState({ totalRevenue: 0, breakdown: [] });
  const [flow, setFlow] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [bed, setBed] = useState({ totalBeds: 0, occupiedBeds: 0, availableBeds: 0, occupancyPercentage: 0 });
  const [lab, setLab] = useState({ totalTests: 0, completed: 0, pending: 0, revenue: 0 });
  const [pharmacy, setPharmacy] = useState({ ordersCount: 0, revenue: 0, topMedicines: [] });

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [revRes, flowRes, docRes, bedRes, labRes, pharmacyRes] = await Promise.all([
        analyticsApi.getRevenue(),
        analyticsApi.getPatientFlow(),
        analyticsApi.getDoctor(),
        analyticsApi.getBedOccupancy(),
        analyticsApi.getLab(),
        analyticsApi.getPharmacy(),
      ]);

      const revenueData = unwrap(revRes, {});
      const flowData = unwrap(flowRes, {});
      const doctorData = unwrap(docRes, {});
      const bedData = unwrap(bedRes, {});
      const labData = unwrap(labRes, {});
      const pharmacyData = unwrap(pharmacyRes, {});

      setRevenue({
        totalRevenue: revenueData.totalRevenue || 0,
        breakdown: revenueData.breakdown || fallbackArray,
      });
      setFlow(flowData.flow || fallbackArray);
      setDoctors(doctorData.doctors || fallbackArray);
      setBed({
        totalBeds: bedData.totalBeds || 0,
        occupiedBeds: bedData.occupiedBeds || 0,
        availableBeds: bedData.availableBeds || 0,
        occupancyPercentage: bedData.occupancyPercentage || 0,
      });
      setLab({
        totalTests: labData.totalTests || 0,
        completed: labData.completed || 0,
        pending: labData.pending || 0,
        revenue: labData.revenue || 0,
      });
      setPharmacy({
        ordersCount: pharmacyData.ordersCount || 0,
        revenue: pharmacyData.revenue || 0,
        topMedicines: pharmacyData.topMedicines || fallbackArray,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const flowStats = useMemo(() => {
    const lookup = {};
    flow.forEach((entry) => {
      lookup[entry.status] = entry.count;
    });
    return lookup;
  }, [flow]);

  if (loading && !hasLoaded) return <LoadingSkeleton />;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Analytics</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Hospital performance overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Read-only summaries across billing, appointments, lab, pharmacy, and bed utilization.
          </p>
        </div>
        <Button variant="outline" onClick={loadAnalytics}>
          Refresh
        </Button>
      </div>

      {error && <ErrorState error={error} onRetry={loadAnalytics} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">₹{formatNumber(revenue.totalRevenue)}</div>
            <p className="mt-2 text-xs text-muted-foreground">Combined consultation, lab, pharmacy & bed.</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{formatNumber(Object.values(flowStats).reduce((a, b) => a + (b || 0), 0))}</div>
            <p className="mt-2 text-xs text-muted-foreground">Across booked → completed.</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Beds occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{formatNumber(bed.occupiedBeds)}</div>
            <p className="mt-2 text-xs text-muted-foreground">{bed.occupancyPercentage}% occupancy</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lab tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{formatNumber(lab.totalTests)}</div>
            <p className="mt-2 text-xs text-muted-foreground">{formatNumber(lab.completed)} completed • {formatNumber(lab.pending)} pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Revenue breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {revenue.breakdown.length === 0 && (
              <p className="text-sm text-muted-foreground sm:col-span-2">No revenue data available yet.</p>
            )}
            {revenue.breakdown.map((entry) => (
              <div key={entry.billType} className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
                <span className="capitalize text-foreground">{entry.billType}</span>
                <span className="font-semibold text-foreground">₹{formatNumber(entry.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Patient flow</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {flow.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-2">No appointments yet.</p>}
            {flow.map((entry) => (
              <div key={entry.status} className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
                <span className="capitalize text-foreground">{entry.status}</span>
                <span className="font-semibold text-foreground">{formatNumber(entry.count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Doctor performance</CardTitle>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No doctor activity yet.</p>
            ) : (
              <div className="space-y-2">
                {doctors.map((doctor) => (
                  <div key={doctor.doctorId} className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{doctor.doctorName || 'Doctor'}</p>
                      <p className="text-xs text-muted-foreground">ID: {doctor.doctorId?.slice(-6) || '—'}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Patients: <strong className="text-foreground">{formatNumber(doctor.totalPatients)}</strong></span>
                      <span>Completed: <strong className="text-foreground">{formatNumber(doctor.completed)}</strong></span>
                      <span>No-show: <strong className="text-foreground">{formatNumber(doctor.noShow)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Bed utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Total beds</span>
              <span className="font-semibold text-foreground">{formatNumber(bed.totalBeds)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Occupied beds</span>
              <span className="font-semibold text-foreground">{formatNumber(bed.occupiedBeds)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Available beds</span>
              <span className="font-semibold text-foreground">{formatNumber(bed.availableBeds)}</span>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Occupancy</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{bed.occupancyPercentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Lab analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Tests total</span>
              <span className="font-semibold text-foreground">{formatNumber(lab.totalTests)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Completed</span>
              <span className="font-semibold text-foreground">{formatNumber(lab.completed)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Pending</span>
              <span className="font-semibold text-foreground">{formatNumber(lab.pending)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Revenue</span>
              <span className="font-semibold text-foreground">₹{formatNumber(lab.revenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Pharmacy analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Orders</span>
              <span className="font-semibold text-foreground">{formatNumber(pharmacy.ordersCount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
              <span>Revenue</span>
              <span className="font-semibold text-foreground">₹{formatNumber(pharmacy.revenue)}</span>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Top medicines</p>
              <div className="mt-2 space-y-2">
                {pharmacy.topMedicines.length === 0 && (
                  <p className="text-xs text-muted-foreground">No dispensing data yet.</p>
                )}
                {pharmacy.topMedicines.map((medicine) => (
                  <div key={medicine.name} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-foreground">{medicine.name || 'Medicine'}</span>
                    <span>{formatNumber(medicine.quantity)} units</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
