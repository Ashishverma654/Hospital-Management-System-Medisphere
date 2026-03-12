import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { adminApi } from '../../services/apiServices';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Activity, Calendar, DollarSign, ArrowUpRight, BedDouble, Shield, Stethoscope, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load superadmin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpiCards = [
    { title: "Total Doctors", value: stats?.totalDoctors ?? 0, icon: Stethoscope, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
    { title: "Total Patients", value: stats?.totalPatients ?? 0, icon: Users, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950" },
    { title: "Today's Appointments", value: stats?.todayAppointments ?? 0, icon: Calendar, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
    { title: "Available Beds", value: `${stats?.availableBeds ?? 0}`, icon: BedDouble, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950" },
    { title: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { title: "Total Nurses", value: stats?.totalNurses ?? 0, icon: UserCheck, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950" },
  ];

  const quickActions = [
    { label: "Manage Users", path: "/superadmin/users", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Manage Doctors", path: "/superadmin/doctors", color: "bg-teal-600 hover:bg-teal-700" },
    { label: "Departments", path: "/superadmin/departments", color: "bg-purple-600 hover:bg-purple-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
          </div>
          <p className="text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>. You have full system access.</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Employee ID</span>
          <span className="font-mono text-sm font-bold text-primary">{user?.employeeId || 'EMP-000001'}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(card => (
          <Card key={card.title} className="hover:shadow-md transition-shadow border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <div className="h-7 w-16 bg-muted rounded animate-pulse" /> : card.value}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1 text-green-500">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Live from database
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white py-3 px-4 rounded-xl text-sm font-bold transition-colors shadow-sm`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "Receptionists", value: stats?.totalReceptionists ?? '...' },
              { label: "Pharmacists", value: stats?.totalPharmacists ?? '...' },
              { label: "Lab Technicians", value: stats?.totalLabTechs ?? '...' },
              { label: "Cancelled Today", value: stats?.cancelledAppointments ?? '...' },
            ].map(item => (
              <div key={item.label} className="p-4 bg-muted/40 rounded-xl">
                <div className="text-2xl font-bold">{loading ? '...' : item.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
