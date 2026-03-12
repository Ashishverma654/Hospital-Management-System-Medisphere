import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/apiServices';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Activity, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, BedDouble, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const patientData = [
  { name: 'Mon', patients: 120 },
  { name: 'Tue', patients: 150 },
  { name: 'Wed', patients: 180 },
  { name: 'Thu', patients: 140 },
  { name: 'Fri', patients: 200 },
  { name: 'Sat', patients: 170 },
  { name: 'Sun', patients: 100 },
];

const revenueData = [
  { name: 'Week 1', revenue: 4000 },
  { name: 'Week 2', revenue: 3000 },
  { name: 'Week 3', revenue: 2000 },
  { name: 'Week 4', revenue: 5000 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    availableBeds: 0,
    totalBeds: 150,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats({
        totalPatients: data.totalPatients || 0,
        todayAppointments: data.todayAppointments || 0,
        availableBeds: data.availableBeds || 0,
        totalBeds: (data.availableBeds || 0) + (data.occupiedBeds || 0),
        totalRevenue: data.totalRevenue || 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Welcome back. Here's a summary of today's hospital metrics.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1 text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments Today</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1 text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Beds</CardTitle>
            <BedDouble className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `${stats.availableBeds} / ${stats.totalBeds || 150}`}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1 text-red-500">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -2% capacity
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `$${stats.totalRevenue}`}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1 text-green-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Patient Influx (Weekly)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #88888833', backgroundColor: 'var(--background)' }} 
                  />
                  <Bar dataKey="patients" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Revenue Trend (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #88888833', backgroundColor: 'var(--background)' }} 
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table (Placeholder snippet) */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Administrative Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                     <Activity className="h-5 w-5 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="text-sm font-medium">New Doctor Registered</p>
                     <p className="text-xs text-muted-foreground">Dr. Sarah Connor joined Cardiology</p>
                   </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {i * 2} hours ago
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
