import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, FileText, Activity, CreditCard } from 'lucide-react';
import { billingApi, notificationsApi, patientApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

export default function PatientDashboard() {
  const [overview, setOverview] = useState(null);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await patientApi.getMyDashboard();
        setOverview(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard.');
      }
    };

    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.getMy();
        setNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load notifications.');
      }
    };

    const loadPendingBills = async () => {
      try {
        const invoices = await billingApi.getMy({ paymentStatus: 'pending' });
        const total = Array.isArray(invoices)
          ? invoices.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
          : 0;
        setPendingAmount(total);
      } catch {
        setPendingAmount(0);
      }
    };

    loadOverview();
    loadNotifications();
    loadPendingBills();
  }, []);

  const upcomingAppointments = overview?.lists?.upcomingAppointments || [];
  const recentPrescriptions = overview?.lists?.recentPrescriptions || [];
  const activeLabOrders = overview?.lists?.activeLabOrders || [];
  const medicineOrders = overview?.lists?.medicineOrders || [];
  const pendingBills = overview?.lists?.pendingBills || [];

  const readyCards = useMemo(
    () => [
      {
        label: 'Lab report ready',
        count: overview?.highlights?.reportReadyCount || 0,
        action: '/patient/lab-tests',
      },
      {
        label: 'Lab report released',
        count: overview?.highlights?.reportReleasedCount || 0,
        action: '/patient/lab-reports',
      },
      {
        label: 'Medicines ready',
        count: overview?.highlights?.medicineReadyCount || 0,
        action: '/patient/medicine-orders',
      },
    ],
    [overview]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Patient dashboard</h2>
          <p className="text-slate-500 mt-1">Your live care status, payments, and recent activity.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild>
            <Link to="/patient/appointments">
              <Calendar className="mr-2 h-4 w-4" /> View appointments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/patient/bills">
              <CreditCard className="mr-2 h-4 w-4" /> Pay bills
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/patient/appointments">
          <Card className="border-slate-200 hover:border-slate-300 transition-all duration-300 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Upcoming visits</CardTitle>
              <Calendar className="h-5 w-5 text-slate-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{overview?.summary?.upcomingAppointments || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {upcomingAppointments[0]
                  ? `${upcomingAppointments[0].date} • ${upcomingAppointments[0].slot}`
                  : 'No upcoming visit'}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/patient/prescriptions">
          <Card className="border-slate-200 hover:border-slate-300 transition-all duration-300 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Prescriptions</CardTitle>
              <FileText className="h-5 w-5 text-slate-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{overview?.summary?.prescriptions || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Recent prescriptions in portal</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/patient/lab-tests">
          <Card className="border-slate-200 hover:border-slate-300 transition-all duration-300 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Active lab tests</CardTitle>
              <Activity className="h-5 w-5 text-slate-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{overview?.summary?.activeLabOrders || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Orders in progress</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/patient/bills">
          <Card className="border-slate-200 hover:border-slate-300 transition-all duration-300 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Pending bills</CardTitle>
              <CreditCard className="h-5 w-5 text-slate-900" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₹{Number(pendingAmount || 0).toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">{pendingBills.length} invoices awaiting payment</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {readyCards.map((card) => (
          <Card key={card.label} className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base text-slate-700">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{card.count}</div>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to={card.action}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Recent appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.slice(0, 3).map((appointment) => (
              <div key={appointment._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{appointment.doctorId?.userId?.name || 'Doctor'}</p>
                  <p className="text-sm text-slate-600">{appointment.date} • {appointment.slot}</p>
                </div>
                <StatusBadge status={appointment.status}>{appointment.status}</StatusBadge>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No upcoming appointments yet.
              </div>
            )}
            <Button variant="outline" asChild>
              <Link to="/patient/appointments">View all appointments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Active medications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPrescriptions.slice(0, 3).map((prescription) => (
              <div key={prescription._id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">Prescription {String(prescription._id).slice(-6).toUpperCase()}</p>
                <p className="text-sm text-slate-600">{prescription.medicines?.[0]?.name || 'Medicines listed'}</p>
                <p className="text-xs text-slate-500">{new Date(prescription.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {recentPrescriptions.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No prescriptions yet.
              </div>
            )}
            <Button variant="outline" asChild>
              <Link to="/patient/prescriptions">View all prescriptions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Lab test activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeLabOrders.slice(0, 3).map((order) => (
              <div key={order._id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{order.orderNumber || 'Lab order'}</p>
                <p className="text-sm text-slate-600">{order.status}</p>
              </div>
            ))}
            {activeLabOrders.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No lab orders yet.
              </div>
            )}
            <Button variant="outline" asChild>
              <Link to="/patient/lab-tests">View lab tests</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Medicine orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {medicineOrders.slice(0, 3).map((order) => (
              <div key={order._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Order {String(order._id).slice(-6).toUpperCase()}</p>
                  <StatusBadge status={order.status}>{order.status}</StatusBadge>
                </div>
                <p className="text-sm text-slate-600">Total ₹{Number(order.total || 0).toLocaleString()}</p>
              </div>
            ))}
            {medicineOrders.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No medicine orders yet.
              </div>
            )}
            <Button variant="outline" asChild>
              <Link to="/patient/medicine-orders">View medicine orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Recent notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-slate-900">{notification.title}</p>
                <p className="text-sm text-slate-600">{notification.message}</p>
              </div>
              <StatusBadge status={notification.status}>{notification.status}</StatusBadge>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
          <Button variant="outline" asChild>
            <Link to="/patient/notifications">View all notifications</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
