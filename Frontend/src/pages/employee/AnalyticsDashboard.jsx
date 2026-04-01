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

const asCurrency = (value) => `₹${formatNumber(value)}`;

const buildSeries = (items, fallbackLabels) => {
  const mapped = (items || []).map((item) => ({
    label: item.label || item.billType || item.status || item.name || item.type || 'Unknown',
    value: Number(item.total || item.count || item.value || 0),
  }));
  if (mapped.length) return mapped;
  return fallbackLabels.map((label) => ({ label, value: 0 }));
};

const normalizeStatusKey = (value) => {
  if (!value) return 'unknown';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
};

const flowLabelMap = {
  booked: 'Booked',
  confirmed: 'Confirmed',
  arrived: 'Arrived',
  'checked-in': 'Checked-in',
  'in-consultation': 'In consultation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  'no-show': 'No-show',
  noshow: 'No-show',
  unknown: 'Unknown',
};

const buildFlowSeries = (items) => {
  const order = [
    'booked',
    'confirmed',
    'arrived',
    'checked-in',
    'in-consultation',
    'completed',
    'cancelled',
    'no-show',
  ];
  const buckets = new Map();
  (items || []).forEach((item) => {
    const key = normalizeStatusKey(item.status || item.label || item.name || item.type);
    const value = Number(item.total || item.count || item.value || 0);
    buckets.set(key, (buckets.get(key) || 0) + value);
  });

  const ordered = order.map((key) => ({
    label: flowLabelMap[key] || key,
    value: buckets.get(key) || 0,
  }));

  const extras = Array.from(buckets.entries())
    .filter(([key]) => !order.includes(key))
    .map(([key, value]) => ({
      label: flowLabelMap[key] || key,
      value,
    }));

  return [...ordered, ...extras];
};

const chartPalette = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

function Sparkline({ data = [] }) {
  const points = data.length
    ? data
    : [5, 7, 6, 8, 10, 9, 12, 11];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const height = 40;
  const width = 140;
  const step = width / (points.length - 1);
  const path = points
    .map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * height;
      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="140" height="40" viewBox={`0 0 ${width} ${height}`} className="text-primary">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.label} className="group space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{item.label}</span>
            <span className="font-semibold text-foreground">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                backgroundImage: `linear-gradient(90deg, ${chartPalette[index % chartPalette.length]} 0%, hsl(var(--primary)) 100%)`,
              }}
            />
            <div className="pointer-events-none relative">
              <div className="absolute -top-10 right-0 hidden rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm group-hover:block">
                {item.label}: {formatNumber(item.value)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ value, total, label }) {
  const safeTotal = total || 1;
  const percent = Math.min(100, Math.round((value / safeTotal) * 100));
  const circumference = 2 * Math.PI * 44;
  const dash = (percent / 100) * circumference;
  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="44" stroke="hsl(var(--border))" strokeWidth="12" fill="none" />
        <circle
          cx="60"
          cy="60"
          r="44"
          stroke="hsl(var(--primary))"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="58" textAnchor="middle" className="fill-foreground text-lg font-semibold">
          {percent}%
        </text>
        <text x="60" y="76" textAnchor="middle" className="fill-muted-foreground text-xs">
          {label}
        </text>
      </svg>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">Occupied</p>
        <p className="text-xl font-semibold text-foreground">{formatNumber(value)}</p>
        <p className="text-xs text-muted-foreground">Total beds {formatNumber(total)}</p>
      </div>
    </div>
  );
}

function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = 0;
  const radius = 58;
  const center = 72;
  const toRadians = (deg) => (Math.PI / 180) * deg;
  const segments = data.map((item) => {
    const value = (item.value / total) * 360;
    const x1 = center + radius * Math.cos(toRadians(start));
    const y1 = center + radius * Math.sin(toRadians(start));
    const x2 = center + radius * Math.cos(toRadians(start + value));
    const y2 = center + radius * Math.sin(toRadians(start + value));
    const largeArc = value > 180 ? 1 : 0;
    const path = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;
    start += value;
    return { path, label: item.label, value: item.value };
  });

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center">
      <svg width="144" height="144" viewBox="0 0 144 144">
        {segments.map((segment, index) => (
          <path
            key={segment.label}
            d={segment.path}
            fill={chartPalette[index % chartPalette.length]}
            title={`${segment.label}: ${formatNumber(segment.value)}`}
          />
        ))}
      </svg>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
              <span className="capitalize text-muted-foreground">{item.label}</span>
            </div>
            <span className="font-semibold text-foreground">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBar({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {data.map((item, index) => {
          const width = Math.max(2, Math.round((item.value / total) * 100));
          return (
            <div
              key={item.label}
              className="group relative h-full"
              style={{
                width: `${width}%`,
                backgroundImage: `linear-gradient(90deg, ${chartPalette[index % chartPalette.length]} 0%, hsl(var(--primary)) 100%)`,
              }}
            >
              <div className="pointer-events-none absolute -top-9 left-0 hidden rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm group-hover:block">
                {item.label}: {formatNumber(item.value)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
              <span className="capitalize text-muted-foreground">{item.label}</span>
            </div>
            <span className="font-semibold text-foreground">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const appointmentTotal = useMemo(() => Object.values(flowStats).reduce((a, b) => a + (b || 0), 0), [flowStats]);
  const avgRevenuePerAppointment = appointmentTotal
    ? Math.round((revenue.totalRevenue || 0) / appointmentTotal)
    : 0;
  const revenueSeries = useMemo(
    () => buildSeries(revenue.breakdown, ['consultation', 'lab', 'pharmacy', 'ward']),
    [revenue.breakdown]
  );
  const flowSeries = useMemo(() => buildFlowSeries(flow), [flow]);
  const labSeries = useMemo(
    () => buildSeries([
      { label: 'completed', value: lab.completed },
      { label: 'pending', value: lab.pending },
    ], ['completed', 'pending']),
    [lab.completed, lab.pending]
  );
  const pharmacySeries = useMemo(
    () => buildSeries(pharmacy.topMedicines, ['top medicine A', 'top medicine B', 'top medicine C']),
    [pharmacy.topMedicines]
  );

  if (loading && !hasLoaded) return <LoadingSkeleton />;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Analytics</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Hospital analytics command center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revenue, patient flow, lab throughput, pharmacy velocity, and bed utilization in one real-time view.
          </p>
        </div>
        <Button variant="outline" onClick={loadAnalytics}>
          Refresh insights
        </Button>
      </div>

      {error && <ErrorState error={error} onRetry={loadAnalytics} />}

      <div className="grid gap-4 lg:grid-cols-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{asCurrency(revenue.totalRevenue)}</div>
              <p className="mt-2 text-xs text-muted-foreground">All services combined.</p>
            </div>
            <Sparkline data={revenueSeries.map((item) => item.value)} />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Appointments</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{formatNumber(appointmentTotal)}</div>
              <p className="mt-2 text-xs text-muted-foreground">Booked through completed.</p>
            </div>
            <Sparkline data={flowSeries.map((item) => item.value)} />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Revenue / visit</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{asCurrency(avgRevenuePerAppointment)}</div>
              <p className="mt-2 text-xs text-muted-foreground">Average per appointment.</p>
            </div>
            <Sparkline data={[avgRevenuePerAppointment, revenue.totalRevenue, appointmentTotal]} />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lab tests</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{formatNumber(lab.totalTests)}</div>
              <p className="mt-2 text-xs text-muted-foreground">{formatNumber(lab.completed)} completed • {formatNumber(lab.pending)} pending</p>
            </div>
            <Sparkline data={[lab.completed, lab.pending, lab.totalTests]} />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bed occupancy</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{formatNumber(bed.occupiedBeds)}</div>
              <p className="mt-2 text-xs text-muted-foreground">{bed.occupancyPercentage}% occupancy</p>
            </div>
            <Sparkline data={[bed.availableBeds, bed.occupiedBeds, bed.totalBeds]} />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pharmacy orders</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{formatNumber(pharmacy.ordersCount)}</div>
              <p className="mt-2 text-xs text-muted-foreground">{asCurrency(pharmacy.revenue)} revenue</p>
            </div>
            <Sparkline data={[pharmacy.ordersCount, pharmacy.revenue]} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Revenue mix by service line</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={revenueSeries} />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Patient flow split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Appointments segmented by status to show throughput.</p>
            <StackedBar data={flowSeries} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Doctor performance snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctors.length === 0 && <p className="text-sm text-muted-foreground">No doctor activity yet.</p>}
            {doctors.map((doctor) => (
              <div key={doctor.doctorId} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{doctor.doctorName || 'Doctor'}</p>
                    <p className="text-xs text-muted-foreground">ID: {doctor.doctorId?.slice(-6) || '—'}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Patients <span className="font-semibold text-foreground">{formatNumber(doctor.totalPatients)}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    Completed <span className="font-semibold text-foreground">{formatNumber(doctor.completed)}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    No-show <span className="font-semibold text-foreground">{formatNumber(doctor.noShow)}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    Active <span className="font-semibold text-foreground">{formatNumber(doctor.totalPatients - doctor.noShow)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Bed utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart value={bed.occupiedBeds} total={bed.totalBeds} label="occupied" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Total beds <span className="font-semibold text-foreground">{formatNumber(bed.totalBeds)}</span>
              </div>
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Available <span className="font-semibold text-foreground">{formatNumber(bed.availableBeds)}</span>
              </div>
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Occupancy <span className="font-semibold text-foreground">{bed.occupancyPercentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Lab throughput</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarChart data={labSeries} />
            <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Revenue <span className="font-semibold text-foreground">{asCurrency(lab.revenue)}</span>
              </div>
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Total tests <span className="font-semibold text-foreground">{formatNumber(lab.totalTests)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Pharmacy velocity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarChart data={pharmacySeries.slice(0, 4)} />
            <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Orders <span className="font-semibold text-foreground">{formatNumber(pharmacy.ordersCount)}</span>
              </div>
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2">
                Revenue <span className="font-semibold text-foreground">{asCurrency(pharmacy.revenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
