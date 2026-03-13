import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, Users, Clock, Activity, FileText, AlertCircle } from 'lucide-react';
import { LoadingSkeleton, ErrorState } from '../../components';
import { doctorApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatters';

export default function DoctorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) return <ErrorState error={error} onRetry={fetchDashboard} />;

  const stats = dashboardData?.todayStats || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  };

  const doctorName = dashboardData?.doctor?.userId?.name || 'Doctor';
  const departmentName = dashboardData?.doctor?.departmentId?.name || 'Department';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hi, {doctorName}! 👋</h2>
          <p className="text-muted-foreground">
            {departmentName} • {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/doctor/appointments">
              <Calendar className="mr-2 h-4 w-4" /> View Queue
            </Link>
          </Button>
          <Button asChild>
            <Link to="/doctor/availability">
              <Clock className="mr-2 h-4 w-4" /> Schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pending} pending • {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.completed / stats.total) * 100) || 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Prescriptions
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.recentPrescriptions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recent creations</p>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lab Orders
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.pendingLabOrders?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending test results</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Today's Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
                dashboardData.upcomingAppointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt._id}
                    className="flex justify-between items-center border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-medium text-sm">
                        {apt.patientId?.name || 'Patient'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {apt.slot} • {apt.consultationMode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'booked'
                            ? 'bg-blue-500/10 text-blue-600'
                            : apt.status === 'inConsultation'
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {apt.status}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        asChild
                      >
                        <Link to={`/doctor/appointments/${apt._id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No appointments today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 flex flex-col">
              <Button asChild className="w-full" variant="default">
                <Link to="/doctor/appointments">
                  <Calendar className="mr-2 h-4 w-4" /> View Full Queue
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/doctor/prescriptions">
                  <FileText className="mr-2 h-4 w-4" /> Create Prescription
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/doctor/lab-orders">
                  <AlertCircle className="mr-2 h-4 w-4" /> Order Lab Tests
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/doctor/availability">
                  <Clock className="mr-2 h-4 w-4" /> Manage Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.recentPrescriptions && dashboardData.recentPrescriptions.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentPrescriptions.map((prescription) => (
                <div key={prescription._id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Prescription issued for appointment
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prescription.appointmentId && formatDate(prescription.appointmentId.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent prescriptions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
