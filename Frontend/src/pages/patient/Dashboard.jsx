import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, FileText, Activity, CreditCard, ArrowRight, Bell, Pill, FlaskConical } from 'lucide-react';
import { billingApi, notificationsApi, patientApi } from '../../services/apiServices.js';
import { connectSocket } from '../../services/socket.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { SkeletonCard, SkeletonList } from '../../components/ui/skeleton.jsx';
import { toast } from 'sonner';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function PatientDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [overview, setOverview] = useState(null);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [data, notifs] = await Promise.all([
        patientApi.getMyDashboard(),
        notificationsApi.getMy().catch(() => []),
      ]);
      setOverview(data);
      setNotifications(Array.isArray(notifs) ? notifs.slice(0, 5) : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBills = useCallback(async () => {
    try {
      const invoices = await billingApi.getMy({ paymentStatus: 'pending' });
      const total = Array.isArray(invoices) ? invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0) : 0;
      setPendingAmount(total);
    } catch {
      setPendingAmount(0);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadBills();
    const interval = setInterval(() => {
      loadDashboard();
      loadBills();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadBills, loadDashboard]);

  useEffect(() => {
    const patientId = user?.id || user?._id;
    if (!patientId) return undefined;
    const socket = connectSocket({ patientId });
    const handleUpdate = () => {
      loadDashboard();
      loadBills();
    };

    socket.on('queue:update', handleUpdate);
    socket.on('token:generated', handleUpdate);
    socket.on('consultation:started', handleUpdate);
    socket.on('consultation:completed', handleUpdate);

    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('token:generated', handleUpdate);
      socket.off('consultation:started', handleUpdate);
      socket.off('consultation:completed', handleUpdate);
    };
  }, [loadBills, loadDashboard, user?.id, user?._id]);

  const upcomingAppointments = overview?.lists?.upcomingAppointments || [];
  const recentPrescriptions = overview?.lists?.recentPrescriptions || [];
  const activeLabOrders = overview?.lists?.activeLabOrders || [];
  const medicineOrders = overview?.lists?.medicineOrders || [];
  const pendingBills = overview?.lists?.pendingBills || [];

  const readyCards = useMemo(
    () => [
      { label: 'Lab reports ready', count: overview?.highlights?.reportReadyCount || 0, action: '/patient/lab-tests', icon: FlaskConical, variant: 'info' },
      { label: 'Reports released', count: overview?.highlights?.reportReleasedCount || 0, action: '/patient/lab-reports', icon: FileText, variant: 'success' },
      { label: 'Medicines ready', count: overview?.highlights?.medicineReadyCount || 0, action: '/patient/medicine-orders', icon: Pill, variant: 'warning' },
    ],
    [overview]
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div className="doccure-card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Patient Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{greeting}, {user?.name || 'Patient'}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View upcoming appointments, recent prescriptions, lab results, and billing updates in one place.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="doccure-chip">{user?.patientId ? `Patient ID: ${user.patientId}` : 'Patient ID pending'}</span>
              <span className="doccure-chip">Care status</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="px-6">
              <Link to="/patient/appointments" className="inline-flex items-center gap-2 whitespace-nowrap">
                <Calendar className="h-4 w-4" /> My appointments
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-6">
              <Link to="/patient/book-appointment" className="inline-flex items-center gap-2 whitespace-nowrap">
                <Calendar className="h-4 w-4" /> Book appointment
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="px-6">
              <Link to="/patient/bills" className="inline-flex items-center gap-2 whitespace-nowrap">
                <CreditCard className="h-4 w-4" /> Billing & payments
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main stat cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Upcoming visits" value={overview?.summary?.upcomingAppointments || 0} icon={Calendar} variant="default"
            subtitle={upcomingAppointments[0] ? `${upcomingAppointments[0].date} • ${upcomingAppointments[0].slot}` : 'No upcoming visits'}
          />
          <StatCard title="Prescriptions" value={overview?.summary?.prescriptions || 0} icon={FileText} variant="info" subtitle="Latest prescriptions on file" />
          <StatCard title="Active lab tests" value={overview?.summary?.activeLabOrders || 0} icon={Activity} variant="warning" subtitle="Tests currently in progress" />
          <StatCard title="Pending bills" value={pendingAmount} icon={CreditCard} variant="danger" prefix="₹" subtitle={`${pendingBills.length} invoices awaiting payment`} />
        </motion.div>
      )}

      {/* Ready highlight cards */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 md:grid-cols-3">
        {readyCards.map((card) => (
          <motion.div key={card.label} variants={staggerItem}>
            <Card className="border-border hover:shadow-md transition-shadow rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link to={card.action} className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Appointments + Medications */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonList count={2} /> : (
              <>
                {upcomingAppointments.slice(0, 3).map((appt) => (
                  <div key={appt._id} className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">{appt.doctorId?.userId?.name || 'Doctor'}</p>
                      <p className="text-sm text-muted-foreground">{appt.date} • {appt.slot}</p>
                    </div>
                    <StatusBadge status={appt.status}>{appt.status}</StatusBadge>
                  </div>
                ))}
                {upcomingAppointments.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    <p>You have no upcoming appointments scheduled.</p>
                    <Button variant="outline" size="sm" asChild className="mt-4">
                      <Link to="/patient/book-appointment" className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Book an appointment
                      </Link>
                    </Button>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/patient/appointments">Manage appointments</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Active medications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonList count={2} /> : (
              <>
                {recentPrescriptions.slice(0, 3).map((rx) => (
                  <div key={rx._id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                    <p className="font-semibold text-foreground">Rx {String(rx._id).slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{rx.medicines?.[0]?.name || 'Medicines listed'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(rx.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {recentPrescriptions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No prescriptions are currently available.
                  </div>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/patient/prescriptions">View prescriptions</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lab + Medicine orders */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border rounded-2xl">
          <CardHeader><CardTitle className="text-lg">Lab test activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonList count={2} /> : (
              <>
                {activeLabOrders.slice(0, 3).map((order) => (
                  <div key={order._id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                    <p className="font-semibold text-foreground">{order.orderNumber || 'Lab order'}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                ))}
                {activeLabOrders.length === 0 && <EmptyState text="No lab orders found." />}
                <Button variant="outline" size="sm" asChild><Link to="/patient/lab-tests">View lab tests</Link></Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border rounded-2xl">
          <CardHeader><CardTitle className="text-lg">Medicine orders</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <SkeletonList count={2} /> : (
              <>
                {medicineOrders.slice(0, 3).map((order) => (
                  <div key={order._id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Order {String(order._id).slice(-6).toUpperCase()}</p>
                      <StatusBadge status={order.status}>{order.status}</StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">Total ₹{Number(order.total || 0).toLocaleString()}</p>
                  </div>
                ))}
                {medicineOrders.length === 0 && <EmptyState text="No pharmacy orders found." />}
                <Button variant="outline" size="sm" asChild><Link to="/patient/medicine-orders">View pharmacy orders</Link></Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="border-border rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent notifications</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <SkeletonList count={2} /> : (
            <>
              {notifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <p className="font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <StatusBadge status={n.status}>{n.status}</StatusBadge>
                </div>
              ))}
              {notifications.length === 0 && <EmptyState text="You don’t have any notifications yet." />}
              <Button variant="outline" size="sm" asChild><Link to="/patient/notifications">View notifications</Link></Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
