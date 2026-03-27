import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import StaffDutyWidget from '../../components/StaffDutyWidget.jsx';
import StaffDutyCalendar from '../../components/StaffDutyCalendar.jsx';
import { billingApi, receptionistApi } from '../../services/apiServices.js';
import { Calendar, CreditCard, FilePlus, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function ReceptionistDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await receptionistApi.getDashboard();
      setDashboard(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load receptionist dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleInitiateBilling = async (appointmentId) => {
    try {
      await billingApi.initiateForAppointment(appointmentId);
      toast.success('Consultation billing initiated.');
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to initiate billing.');
    }
  };

  const stats = [
    { title: "Today's Appointments", icon: Calendar, value: dashboard?.stats?.todayAppointments ?? 0 },
    { title: 'Waiting / Checked In', icon: Users, value: dashboard?.stats?.waitingPatients ?? 0 },
    { title: 'Arrived Today', icon: Users, value: dashboard?.stats?.arrivedPatients ?? 0 },
    { title: 'Admitted Today', icon: Users, value: dashboard?.stats?.admittedPatients ?? 0 },
    { title: 'Registrations Today', icon: FilePlus, value: dashboard?.stats?.registrationsToday ?? 0 },
    { title: 'Pending Billing', icon: CreditCard, value: dashboard?.stats?.pendingBillingActions ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Front Desk Dashboard</h2>
          <p className="text-muted-foreground">Operate today&apos;s queue, patient onboarding, and appointment flow from one receptionist workspace.</p>
        </div>
        <div className="flex w-full flex-wrap gap-3 md:w-auto">
          <Button asChild className="h-11 min-w-[180px] justify-center whitespace-nowrap">
            <Link to="/employee/receptionist/register-patient" className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Register Patient
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-11 min-w-[180px] justify-center whitespace-nowrap">
            <Link to="/employee/receptionist/appointments" className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-11 min-w-[180px] justify-center whitespace-nowrap">
            <Link to="/employee/receptionist/queue" className="inline-flex items-center gap-2">
              Open Today&apos;s Queue
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-11 min-w-[180px] justify-center whitespace-nowrap">
            <Link to="/employee/receptionist/patients" className="inline-flex items-center gap-2">
              Search Patient
            </Link>
          </Button>
        </div>
      </div>

      <StaffDutyWidget />
      <StaffDutyCalendar />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.title} className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <stat.icon className="h-4 w-4 text-[#ee4c35]" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-foreground">{loading ? '...' : stat.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Today&apos;s Queue</p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">Active front-desk flow</h3>
            </div>
            <Button variant="outline" asChild>
              <Link to="/employee/receptionist/queue">Manage Queue</Link>
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {(dashboard?.queue || []).slice(0, 8).map((appointment) => (
              <article key={appointment._id} className={`rounded-xl border p-4 ${appointment.admissionRecommended ? 'border-amber-400/60 bg-amber-50/30' : 'border-border'}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.patientId?.name || 'Patient'}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.doctorId?.userId?.name || 'Doctor'} • {appointment.slot}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Token {appointment.tokenNumber || '—'} {appointment.queuePosition ? `• #${appointment.queuePosition}` : ''}
                    </p>
                    {appointment.admissionRecommended && (
                      <p className="mt-2 inline-flex items-center rounded-full bg-amber-200/40 px-3 py-1 text-xs font-semibold text-amber-800">
                        Admission recommended
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    {appointment.status}
                  </span>
                </div>
              </article>
            ))}
            {!loading && (dashboard?.queue || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments in today&apos;s queue yet.</p>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">New Registrations</p>
            <div className="mt-4 space-y-3">
              {(dashboard?.registrations || []).slice(0, 5).map((patient) => (
                <article key={patient._id} className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">{patient.userId?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{patient.userId?.patientId} • {patient.userId?.phone}</p>
                </article>
              ))}
              {!loading && (dashboard?.registrations || []).length === 0 && <p className="text-sm text-muted-foreground">No new registrations today.</p>}
            </div>
          </section>

          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Pending Billing Actions</p>
            <div className="mt-4 space-y-3">
              {(dashboard?.pendingBillingAppointments || []).slice(0, 5).map((appointment) => (
                <article key={appointment._id} className="rounded-xl border border-border p-4">
                  <p className="font-semibold text-foreground">{appointment.patientId?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{appointment.doctorId?.userId?.name || 'Doctor'} • {appointment.slot}</p>
                  <Button className="mt-3" size="sm" onClick={() => handleInitiateBilling(appointment._id)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Initiate Bill
                  </Button>
                </article>
              ))}
              {!loading && (dashboard?.pendingBillingAppointments || []).length === 0 && <p className="text-sm text-muted-foreground">No pending billing actions right now.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
