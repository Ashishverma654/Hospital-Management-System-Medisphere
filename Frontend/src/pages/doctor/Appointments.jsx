import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog.jsx';
import VideoCall from '../../components/VideoCall.jsx';
import { StatusBadge, DataTable, LoadingSkeleton, ErrorState } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Calendar, Clock, Play, Eye, Stethoscope, AlertTriangle, FileText, Video } from 'lucide-react';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingConsultation, setStartingConsultation] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewData, setQuickViewData] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoAppointment, setVideoAppointment] = useState(null);
  const [endingCall, setEndingCall] = useState(false);
  const [viewMode, setViewMode] = useState('today');

  useEffect(() => {
    fetchAppointments();
  }, [viewMode]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = viewMode === 'today'
        ? await appointmentApi.getDoctorToday()
        : await appointmentApi.getDoctorAll();
      const normalized = Array.isArray(response) ? response : response?.data || [];
      setTodayAppointments(Array.isArray(normalized) ? normalized : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      setStartingConsultation(appointmentId);
      await appointmentApi.startConsultation(appointmentId);
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

  const handleStartVideo = async (appointment) => {
    if (!appointment) return;
    try {
      if (appointment.status !== 'inConsultation') {
        await appointmentApi.startConsultation(appointment._id);
      }
      setVideoAppointment(appointment);
      setVideoOpen(true);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start video call');
    }
  };

  const handleEndCall = async () => {
    if (!videoAppointment) return;
    try {
      setEndingCall(true);
      await appointmentApi.complete(videoAppointment._id);
      toast.success('Consultation completed');
      setVideoOpen(false);
      setVideoAppointment(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setEndingCall(false);
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
              onClick={() => handleStartConsultation(row._id)}
              disabled={startingConsultation === row._id}
              className="text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              {startingConsultation === row._id ? 'Starting...' : 'Start'}
            </Button>
          )}
          {row.consultationMode === 'video' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStartVideo(row)}
              className="text-xs"
            >
              <Video className="h-3 w-3 mr-1" /> Start video
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => openQuickView(row)}
            className="text-xs"
          >
            <Stethoscope className="h-3 w-3 mr-1" /> Quick view
          </Button>
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
          >
            <FileText className="h-3 w-3 mr-1" /> Prescription
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  const _completed = todayAppointments.filter((a) => a.status === 'completed').length;
  const _inProgress = todayAppointments.filter((a) =>
    ['arrived', 'checked-in', 'inConsultation'].includes(a.status)
  ).length;
  const _pending = todayAppointments.filter((a) =>
    ['booked', 'confirmed'].includes(a.status)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Today's Appointments</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
            <div className="text-2xl font-bold text-blue-600">{_pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{_completed}</div>
          </CardContent>
        </Card>
      </div>

      {error && <ErrorState error={error} onRetry={fetchAppointments} />}

      {/* Appointments Table */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Appointments Queue ({todayAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No appointments scheduled for today</p>
            </div>
          ) : (
            <DataTable
              data={todayAppointments}
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

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Video Consultation</DialogTitle>
            <DialogDescription>
              Appointment {videoAppointment?._id?.slice(-6)} • {videoAppointment?.patientId?.name || 'Patient'}
            </DialogDescription>
          </DialogHeader>
          {videoAppointment && (
            <VideoCall
              appointmentId={videoAppointment._id}
              role="doctor"
              onEnd={handleEndCall}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoOpen(false)} disabled={endingCall}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleEndCall} disabled={endingCall}>
              {endingCall ? 'Ending...' : 'End consultation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
