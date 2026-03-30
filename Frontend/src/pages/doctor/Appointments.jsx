import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog.jsx';
import { StatusBadge, DataTable, LoadingSkeleton, ErrorState } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Calendar, Clock, Play, Eye, Stethoscope, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useDoctorVideoCall } from '../../context/DoctorVideoCallContext.jsx';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [startingConsultation, setStartingConsultation] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewData, setQuickViewData] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const { openVideoCall } = useDoctorVideoCall();
  const [viewMode, setViewMode] = useState('today');

  const slotToMinutes = useCallback((slot = '') => {
    const trimmed = `${slot}`.trim();
    const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const [rawHours, rawMinutes] = trimmed.split(':');
    const hours = Number(rawHours);
    const minutes = Number(rawMinutes);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  }, []);

  const buildSlotDateTime = useCallback(
    (date, slot) => {
      if (!date || !slot) return null;
      const minutes = slotToMinutes(slot);
      if (minutes == null) return null;
      const base = new Date(`${date}T00:00:00`);
      if (Number.isNaN(base.getTime())) return null;
      base.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return base;
    },
    [slotToMinutes]
  );

  const isSlotFuture = (appointment) => {
    const slotDateTime = buildSlotDateTime(appointment.date, appointment.slot);
    if (!slotDateTime) return false;
    return slotDateTime.getTime() > Date.now();
  };

  const isPrescriptionWindowClosed = useCallback((appointment) => {
    if (!appointment) return false;
    if (appointment.status !== 'completed') return false;
    const completedAt = appointment.updatedAt ? new Date(appointment.updatedAt).getTime() : null;
    if (!completedAt || Number.isNaN(completedAt)) return false;
    return Date.now() - completedAt > 10 * 60 * 1000;
  }, []);

  const sortBySlotDateTime = useCallback(
    (a, b) => {
      const aTime = buildSlotDateTime(a.date, a.slot)?.getTime() ?? 0;
      const bTime = buildSlotDateTime(b.date, b.slot)?.getTime() ?? 0;
      return aTime - bTime;
    },
    [buildSlotDateTime]
  );

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = viewMode === 'today'
        ? await appointmentApi.getDoctorToday()
        : await appointmentApi.getDoctorAll();
      const normalized = Array.isArray(response) ? response : response?.data || [];
      if (viewMode === 'upcoming') {
        const now = new Date();
        const upcoming = normalized.filter((appt) => {
          const slotDateTime = buildSlotDateTime(appt?.date, appt?.slot);
          return slotDateTime ? slotDateTime.getTime() > now.getTime() : false;
        });
        setTodayAppointments(upcoming.sort(sortBySlotDateTime));
      } else {
        setTodayAppointments(Array.isArray(normalized) ? normalized : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [viewMode, buildSlotDateTime, sortBySlotDateTime]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStartConsultation = async (appointment) => {
    try {
      const appointmentId = appointment?._id || appointment;
      setStartingConsultation(appointmentId);
      await appointmentApi.startConsultation(appointmentId);
      if (appointment?.consultationMode === 'video') {
        openVideoCall(appointment);
      }
      toast.success('Consultation started');
      fetchAppointments();
      // Redirect to patient summary
      navigate(`/doctor/appointments/${appointmentId}/summary`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start consultation');
    } finally {
      setStartingConsultation(null);
    }
  };


  const openQuickView = async (appointment) => {
    try {
      setQuickViewLoading(true);
      setQuickViewOpen(true);
      const summary = await appointmentApi.getPatientSummary(appointment.patientId?._id || appointment.patientId);
      setQuickViewData({ appointment, summary });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load patient quick view');
      setQuickViewData(null);
    } finally {
      setQuickViewLoading(false);
    }
  };

  const closeQuickView = () => {
    setQuickViewOpen(false);
    setQuickViewData(null);
  };

  const buildTriageFlags = (summary) => {
    const patient = summary?.patient;
    const flags = [];
    if (!patient) return flags;
    if (patient.allergies?.length) flags.push({ label: 'Allergy risk', tone: 'bg-orange-500/10 text-orange-600' });
    if (patient.chronicDiseases?.length) flags.push({ label: 'Chronic conditions', tone: 'bg-amber-500/10 text-amber-600' });
    if (patient.latestVitals) {
      const { temperature, spo2, pulse, bloodPressure } = patient.latestVitals;
      const highTemp = temperature && Number(temperature) >= 100;
      const lowSpo2 = spo2 && Number(spo2) < 94;
      const highPulse = pulse && Number(pulse) > 100;
      const highBp = bloodPressure && bloodPressure.split('/').some((val) => Number(val) >= 140);
      if (highTemp || lowSpo2 || highPulse || highBp) {
        flags.push({ label: 'Vitals need review', tone: 'bg-red-500/10 text-red-600' });
      }
    }
    return flags;
  };

  const isImageReport = (url = '') => /\.(png|jpe?g|gif|webp)$/i.test(url);

  const columns = [
    {
      key: 'slot',
      label: 'Time',
      sortable: true,
      render: (slot) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {slot}
        </div>
      ),
    },
    {
      key: 'patientId',
      label: 'Patient',
      sortable: true,
      render: (patient) => (
        <div className="flex flex-col">
          <span className="font-medium">{patient?.name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{patient?.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'patientProfileId',
      label: 'Age / Gender',
      render: (profile) => (
        <div className="text-sm">
          {profile?.age ? `${profile.age}y` : 'N/A'} / {profile?.gender || 'N/A'}
        </div>
      ),
    },
    {
      key: 'consultationMode',
      label: 'Mode',
      render: (mode) => (
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
          {mode || 'In-person'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {['booked', 'confirmed', 'arrived', 'checked-in'].includes(row.status) && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStartConsultation(row)}
              disabled={startingConsultation === row._id || (!row.earlyCheckInBy && !row.earlyCheckInAt && !row.earlyCheckInReason && isSlotFuture(row))}
              className="text-xs"
              title={
                !row.earlyCheckInBy && !row.earlyCheckInAt && !row.earlyCheckInReason && isSlotFuture(row)
                  ? 'This appointment is scheduled later.'
                  : undefined
              }
            >
              <Play className="h-3 w-3 mr-1" />
              {startingConsultation === row._id ? 'Starting...' : 'Start'}
            </Button>
          )}
          {row.status !== 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openQuickView(row)}
              className="text-xs"
            >
              <Stethoscope className="h-3 w-3 mr-1" /> Quick view
            </Button>
          )}
          {row.consultationMode === 'video' && row.status === 'inConsultation' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openVideoCall(row)}
              className="text-xs"
            >
              <Stethoscope className="h-3 w-3 mr-1" /> Join call
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/doctor/appointments/${row._id}/summary`)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/doctor/prescriptions?appointmentId=${row._id}`)}
            className="text-xs"
            disabled={isPrescriptionWindowClosed(row)}
            title={isPrescriptionWindowClosed(row) ? 'Prescription window closed (10 minutes after completion).' : undefined}
          >
            <FileText className="h-3 w-3 mr-1" /> Prescription
          </Button>
        </div>
      ),
    },
  ];

  if (loading && !hasLoaded) return <LoadingSkeleton />;

  const _completed = todayAppointments.filter((a) => a.status === 'completed').length;
  const _pending = todayAppointments.filter((a) =>
    ['booked', 'confirmed'].includes(a.status)
  ).length;
  const upcomingAppointments = todayAppointments
    .filter(
      (appointment) =>
        !['completed', 'cancelled', 'no-show'].includes(appointment.status) &&
        ['booked', 'confirmed', 'arrived', 'checked-in', 'inConsultation'].includes(appointment.status)
    )
    .sort(sortBySlotDateTime);
  const completedAppointments = todayAppointments
    .filter((appointment) => appointment.status === 'completed')
    .sort(sortBySlotDateTime);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {viewMode === 'today' ? "Today's Appointments" : viewMode === 'upcoming' ? 'Upcoming Appointments' : 'All Appointments'}
          </h2>
          <p className="text-muted-foreground">
            {viewMode === 'today'
              ? new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : viewMode === 'upcoming'
                ? 'Future scheduled visits'
                : 'All scheduled visits'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('today')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewMode === 'today'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setViewMode('upcoming')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewMode === 'upcoming'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewMode === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          <Button variant="outline" onClick={fetchAppointments}>
            <Calendar className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{_pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{_completed}</div>
          </CardContent>
        </Card>
      </div>

      {error && <ErrorState error={error} onRetry={fetchAppointments} />}

      {/* Upcoming Queue */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Upcoming appointments ({upcomingAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No upcoming appointments in this view</p>
            </div>
          ) : (
            <DataTable
              data={upcomingAppointments}
              columns={columns}
              keyField="_id"
            />
          )}
        </CardContent>
      </Card>

      {/* Completed Appointments */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> Completed appointments ({completedAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No completed appointments in this view</p>
            </div>
          ) : (
            <DataTable
              data={completedAppointments}
              columns={columns}
              keyField="_id"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={quickViewOpen} onOpenChange={closeQuickView}>
        <DialogContent className="h-[100dvh] max-w-2xl rounded-none sm:rounded-l-3xl sm:rounded-r-none sm:ml-auto sm:mr-0 sm:w-[42rem] sm:max-w-[42rem]">
          <DialogHeader>
            <DialogTitle>Patient chart drawer</DialogTitle>
            <DialogDescription>Full chart snapshot with labs and prescription history.</DialogDescription>
          </DialogHeader>
          {quickViewLoading && (
            <div className="py-10 text-center text-muted-foreground">Loading patient summary…</div>
          )}
          {!quickViewLoading && quickViewData && (
            <div className="space-y-5 overflow-y-auto pr-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patient</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {quickViewData.summary?.patient?.name || 'Patient'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {quickViewData.summary?.patient?.patientId || 'No ID'} • {quickViewData.summary?.patient?.age || '—'}y • {quickViewData.summary?.patient?.gender || '—'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {buildTriageFlags(quickViewData.summary).map((flag) => (
                  <span key={flag.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${flag.tone}`}>
                    {flag.label}
                  </span>
                ))}
                {buildTriageFlags(quickViewData.summary).length === 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                    No high-risk flags detected
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Allergies & Conditions
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Allergies: {quickViewData.summary?.patient?.allergies?.length ? quickViewData.summary.patient.allergies.join(', ') : 'None reported'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chronic: {quickViewData.summary?.patient?.chronicDiseases?.length ? quickViewData.summary.patient.chronicDiseases.join(', ') : 'None listed'}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Latest vitals
                  </p>
                  {quickViewData.summary?.patient?.latestVitals ? (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <p>BP: {quickViewData.summary.patient.latestVitals.bloodPressure || '—'}</p>
                      <p>Pulse: {quickViewData.summary.patient.latestVitals.pulse || '—'}</p>
                      <p>Temp: {quickViewData.summary.patient.latestVitals.temperature || '—'}</p>
                      <p>SpO2: {quickViewData.summary.patient.latestVitals.spo2 || '—'}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No vitals recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">Lab orders needing attention</p>
                  <div className="mt-2 space-y-2">
                    {(quickViewData.summary?.recentLabOrders || []).map((order) => (
                      <div key={order._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <span>{order.orderNumber || 'Lab order'} • {order.status}</span>
                        <span className="text-xs text-muted-foreground">{order.paymentStatus || 'pending'}</span>
                      </div>
                    ))}
                    {(quickViewData.summary?.recentLabOrders || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No lab orders in the recent list.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">Prescription history</p>
                  <div className="mt-2 space-y-2">
                    {(quickViewData.summary?.recentPrescriptions || []).map((prescription) => (
                      <div key={prescription._id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <p className="font-medium text-foreground">{prescription.diagnosis || 'Prescription'}</p>
                        <p className="text-xs text-muted-foreground">
                          {prescription.medicines?.map((med) => med.name).filter(Boolean).join(', ') || 'No medicines listed'}
                        </p>
                      </div>
                    ))}
                    {(quickViewData.summary?.recentPrescriptions || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent prescriptions on record.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Lab report previews</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(quickViewData.summary?.recentLabReports || []).map((report) => (
                    <div key={report._id} className="rounded-lg border border-border/60 bg-muted/40 p-3">
                      <p className="font-medium text-foreground">{report.reportName || 'Lab report'}</p>
                      <p className="text-xs text-muted-foreground">{report.reportType || 'Diagnostic report'}</p>
                      {report.reportFile && isImageReport(report.reportFile) && (
                        <img src={report.reportFile} alt={report.reportName} className="mt-2 h-32 w-full rounded-lg object-cover" />
                      )}
                      {report.reportFile && (
                        <a
                          href={report.reportFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
                        >
                          Open report file
                        </a>
                      )}
                    </div>
                  ))}
                  {(quickViewData.summary?.recentLabReports || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No lab reports available yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeQuickView}>Close</Button>
            {quickViewData?.appointment?._id && (
              <Button onClick={() => navigate(`/doctor/appointments/${quickViewData.appointment._id}/summary`)}>
                Full summary
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
