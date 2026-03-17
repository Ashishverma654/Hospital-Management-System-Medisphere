import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, Clock, Activity, FileText, AlertCircle, ClipboardList, Stethoscope } from 'lucide-react';
import { LoadingSkeleton, ErrorState } from '../../components';
import { doctorApi, appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatters';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function DoctorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingConsultation, setStartingConsultation] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, todayAppointments] = await Promise.all([
        doctorApi.getDashboard(),
        appointmentApi.getDoctorToday(),
      ]);
      setDashboardData(data);
      setTodayQueue(Array.isArray(todayAppointments) ? todayAppointments : []);
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
  const nextAppointment =
    todayQueue?.find((apt) => ['booked', 'confirmed', 'arrived', 'checked-in', 'inConsultation'].includes(apt.status)) ||
    dashboardData?.upcomingAppointments?.[0];

  const handleStartConsultation = async (appointmentId) => {
    try {
      setStartingConsultation(appointmentId);
      await appointmentApi.startConsultation(appointmentId);
      toast.success('Consultation started');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start consultation');
    } finally {
      setStartingConsultation(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {doctorName}</h2>
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

      <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Clinical Snapshot</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your next appointment and high-priority tasks for today.
            </p>
          </div>
          {nextAppointment && (
            <Button asChild size="sm" variant="outline">
              <Link to="/doctor/appointments">
                <Stethoscope className="mr-2 h-4 w-4" /> View details
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next patient</p>
            <p className="mt-2 text-lg font-semibold">
              {nextAppointment?.patientId?.name || 'No upcoming patients'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextAppointment
                ? `${nextAppointment.slot} • ${nextAppointment.consultationMode || 'In-person'}`
                : 'Your schedule is clear.'}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pending lab orders</p>
            <p className="mt-2 text-lg font-semibold">{dashboardData?.pendingLabOrders?.length || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Results and releases awaiting review.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recent prescriptions</p>
            <p className="mt-2 text-lg font-semibold">{dashboardData?.recentPrescriptions?.length || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Issued in the last few consultations.</p>
          </div>
        </CardContent>
      </Card>

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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Queue */}
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Today's Queue
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/doctor/appointments">Open full queue</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayQueue.length > 0 ? (
                todayQueue.slice(0, 6).map((apt) => (
                  <div
                    key={apt._id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{apt.patientId?.name || 'Patient'}</span>
                      <span className="text-xs text-muted-foreground">
                        {apt.slot} • {apt.consultationMode || 'In-person'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'booked'
                            ? 'bg-blue-500/10 text-blue-600'
                            : apt.status === 'inConsultation'
                              ? 'bg-orange-500/10 text-orange-600'
                              : apt.status === 'completed'
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {apt.status}
                      </span>
                      {['booked', 'confirmed', 'arrived', 'checked-in'].includes(apt.status) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStartConsultation(apt._id)}
                          disabled={startingConsultation === apt._id}
                          className="text-xs"
                        >
                          {startingConsultation === apt._id ? 'Starting...' : 'Start'}
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline" className="text-xs">
                        <Link to={`/doctor/appointments/${apt._id}/summary`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No appointments scheduled for today.
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
                  <Calendar className="mr-2 h-4 w-4" /> Review queue
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/doctor/prescriptions">
                  <FileText className="mr-2 h-4 w-4" /> New prescription
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/doctor/lab-orders">
                  <AlertCircle className="mr-2 h-4 w-4" /> Order lab tests
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/doctor/availability">
                  <Clock className="mr-2 h-4 w-4" /> Manage schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent prescriptions</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/doctor/prescriptions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentPrescriptions && dashboardData.recentPrescriptions.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentPrescriptions.map((prescription) => (
                  <div key={prescription._id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Prescription issued</p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.appointmentId ? formatDate(prescription.appointmentId.date) : 'Appointment pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent prescriptions.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending lab orders</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/doctor/lab-orders">Review inbox</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData?.pendingLabOrders && dashboardData.pendingLabOrders.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.pendingLabOrders.map((order) => (
                  <div key={order._id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.testName || 'Lab order'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status || 'pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No lab orders awaiting action.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
