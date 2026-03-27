import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Calendar, Clock, Activity, FileText, AlertCircle, ClipboardList, Stethoscope } from 'lucide-react';
import { LoadingSkeleton, ErrorState } from '../../components';
import StaffDutyWidget from '../../components/StaffDutyWidget.jsx';
import StaffDutyCalendar from '../../components/StaffDutyCalendar.jsx';
import { admissionApi, appointmentApi, doctorApi, pharmacyApi, prescriptionApi } from '../../services/apiServices';
import { connectSocket } from '../../services/socket.js';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatters';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const INITIAL_PRESCRIPTION_FORM = {
  appointmentId: '',
  symptoms: '',
  diagnosis: '',
  advice: '',
  clinicalNotes: '',
  followUpDate: '',
  admissionRecommended: false,
  admissionRecommendationNotes: '',
  medicines: [],
};

export default function DoctorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingConsultation, setStartingConsultation] = useState(null);
  const [completingConsultation, setCompletingConsultation] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [patientSummary, setPatientSummary] = useState(null);
  const [admissionHistory, setAdmissionHistory] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [recommendNotes, setRecommendNotes] = useState('');
  const [savingRecommendation, setSavingRecommendation] = useState(false);
  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [draftPrescriptions, setDraftPrescriptions] = useState([]);

  const [prescriptionForm, setPrescriptionForm] = useState(INITIAL_PRESCRIPTION_FORM);
  const [medicineInput, setMedicineInput] = useState({
    medicineId: '',
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    unit: '',
    instructions: '',
  });

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, todayAppointments, prescriptions] = await Promise.all([
        doctorApi.getDashboard(),
        appointmentApi.getDoctorToday(),
        prescriptionApi.getMy(),
      ]);
      setDashboardData(data);
      setTodayQueue(Array.isArray(todayAppointments) ? todayAppointments : []);
      const draftList = Array.isArray(prescriptions)
        ? prescriptions.filter((item) => item.status === 'draft')
        : [];
      setDraftPrescriptions(draftList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 20000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const data = await pharmacyApi.getAll();
        setPharmacyMedicines(Array.isArray(data) ? data : []);
      } catch {
        setPharmacyMedicines([]);
      }
    };
    loadMedicines();
  }, []);

  useEffect(() => {
    const doctorId = dashboardData?.doctor?._id;
    if (!doctorId) return undefined;

    const socket = connectSocket({ doctorId });
    const handleQueueUpdate = () => fetchDashboard();

    socket.on('queue:update', handleQueueUpdate);
    socket.on('token:generated', handleQueueUpdate);
    socket.on('consultation:started', handleQueueUpdate);
    socket.on('consultation:completed', handleQueueUpdate);

    return () => {
      socket.off('queue:update', handleQueueUpdate);
      socket.off('token:generated', handleQueueUpdate);
      socket.off('consultation:started', handleQueueUpdate);
      socket.off('consultation:completed', handleQueueUpdate);
    };
  }, [dashboardData?.doctor?._id, fetchDashboard]);

  const stats = dashboardData?.todayStats || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  };

  const doctorName = dashboardData?.doctor?.userId?.name || 'Doctor';
  const departmentName = dashboardData?.doctor?.departmentId?.name || 'Department';
  const activeQueue = todayQueue?.filter((apt) => ['booked', 'confirmed', 'arrived', 'checked-in', 'inConsultation'].includes(apt.status)) || [];
  const currentPatient = activeQueue.find((apt) => apt.status === 'inConsultation') || activeQueue[0];
  const nextPatient = currentPatient
    ? activeQueue.find((apt) => apt._id !== currentPatient._id)
    : activeQueue[0];
  const visitLabel = (visitType) => {
    if (!visitType) return 'Appointment';
    if (visitType === 'walkIn') return 'Walk-in';
    if (visitType === 'followUp') return 'Follow-up';
    if (visitType === 'newConsultation') return 'New consult';
    return visitType;
  };

  const priorityTone = (priority) => (
    priority === 'Emergency'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-primary/10 text-primary'
  );

  useEffect(() => {
    if (!todayQueue.length) {
      setSelectedAppointmentId(null);
      setPatientSummary(null);
      setAdmissionHistory([]);
      setPrescriptionForm(INITIAL_PRESCRIPTION_FORM);
      return;
    }
    if (!selectedAppointmentId || !todayQueue.some((apt) => apt._id === selectedAppointmentId)) {
      setSelectedAppointmentId(currentPatient?._id || todayQueue[0]._id);
    }
  }, [todayQueue, selectedAppointmentId, currentPatient]);

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

  const handleCompleteConsultation = async (appointmentId) => {
    try {
      setCompletingConsultation(appointmentId);
      await appointmentApi.complete(appointmentId);
      toast.success('Consultation completed');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setCompletingConsultation(null);
    }
  };

  const loadPatientPanel = async (appointment) => {
    if (!appointment?.patientId?._id) return;
    setLoadingSummary(true);
    try {
      const [summary, admissions] = await Promise.all([
        appointmentApi.getPatientSummary(appointment.patientId._id),
        admissionApi.getAll({ patientId: appointment.patientId._id, page: 1, limit: 5 }),
      ]);
      setPatientSummary(summary || null);
      setAdmissionHistory(Array.isArray(admissions?.items) ? admissions.items : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load patient details');
      setPatientSummary(null);
      setAdmissionHistory([]);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    const selected = todayQueue.find((apt) => apt._id === selectedAppointmentId) || currentPatient;
    if (selected) {
      setRecommendNotes(selected.admissionRecommendationNotes || '');
      loadPatientPanel(selected);
      setPrescriptionForm((prev) => ({
        ...INITIAL_PRESCRIPTION_FORM,
        appointmentId: selected._id,
        admissionRecommended: Boolean(selected.admissionRecommended),
        admissionRecommendationNotes: selected.admissionRecommendationNotes || '',
        followUpDate: prev.appointmentId === selected._id ? prev.followUpDate : '',
      }));
    }
  }, [selectedAppointmentId, todayQueue, currentPatient]);

  const handleRecommendAdmission = async () => {
    const selected = todayQueue.find((apt) => apt._id === selectedAppointmentId) || currentPatient;
    if (!selected) return;
    try {
      setSavingRecommendation(true);
      await appointmentApi.recommendAdmission(selected._id, {
        admissionRecommended: true,
        admissionRecommendationNotes: recommendNotes,
      });
      toast.success('Admission recommendation saved');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save recommendation');
    } finally {
      setSavingRecommendation(false);
    }
  };

  const buildInstructionNote = (quantity, unit, instructions) => {
    const parts = [];
    if (quantity || unit) {
      parts.push(`Qty: ${quantity || ''} ${unit || ''}`.trim());
    }
    if (instructions) {
      parts.push(instructions);
    }
    return parts.join(' • ');
  };

  const handleAddMedicine = () => {
    const name =
      medicineInput.name ||
      pharmacyMedicines.find((med) => med._id === medicineInput.medicineId)?.name ||
      '';
    if (!name) {
      toast.error('Select a medicine or enter a name.');
      return;
    }
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicineId: medicineInput.medicineId || undefined,
          name,
          dosage: medicineInput.dosage,
          frequency: medicineInput.frequency,
          duration: medicineInput.duration,
          quantity: medicineInput.quantity ? Number(medicineInput.quantity) : undefined,
          unit: medicineInput.unit || undefined,
          instructions: buildInstructionNote(medicineInput.quantity, medicineInput.unit, medicineInput.instructions),
        },
      ],
    }));
    setMedicineInput({
      medicineId: '',
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      unit: '',
      instructions: '',
    });
  };

  const handleRemoveMedicine = (index) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, idx) => idx !== index),
    }));
  };

  const submitPrescription = async (status) => {
    if (!prescriptionForm.appointmentId) {
      toast.error('Select a patient from the queue first.');
      return;
    }
    if (status !== 'draft') {
      if (!prescriptionForm.diagnosis) {
        toast.error('Diagnosis is required to finalize a prescription.');
        return;
      }
      if (prescriptionForm.medicines.length === 0) {
        toast.error('Add at least one medicine before finalizing.');
        return;
      }
    }

    try {
      setSavingPrescription(true);
      await prescriptionApi.create({
        appointmentId: prescriptionForm.appointmentId,
        diagnosis: prescriptionForm.diagnosis,
        clinicalNotes: prescriptionForm.clinicalNotes,
        advice: prescriptionForm.advice,
        medicines: prescriptionForm.medicines,
        notes: prescriptionForm.symptoms,
        followUpDate: prescriptionForm.followUpDate || undefined,
        admissionRecommended: prescriptionForm.admissionRecommended,
        admissionRecommendationNotes: prescriptionForm.admissionRecommendationNotes,
        status,
      });
      toast.success(status === 'draft' ? 'Draft saved.' : 'Prescription created.');
      fetchDashboard();
      if (status !== 'draft') {
        setPrescriptionForm(INITIAL_PRESCRIPTION_FORM);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription.');
    } finally {
      setSavingPrescription(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) return <ErrorState error={error} onRetry={fetchDashboard} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          <div className="flex flex-wrap gap-2">
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
      </div>

      <StaffDutyWidget />
      <StaffDutyCalendar />

      <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Clinical Snapshot</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your next appointment and high-priority tasks for today.
            </p>
          </div>
          {currentPatient && (
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
              {currentPatient?.patientId?.name || 'No current patients'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPatient
                ? `Token ${currentPatient.tokenNumber || '—'} • ${currentPatient.slot}`
                : 'Your schedule is clear.'}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next patient</p>
            <p className="mt-2 text-lg font-semibold">{nextPatient?.patientId?.name || 'No next patient'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextPatient ? `Token ${nextPatient.tokenNumber || '—'} • ${nextPatient.slot}` : 'Queue is clear.'}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pending lab orders</p>
            <p className="mt-2 text-lg font-semibold">{dashboardData?.pendingLabOrders?.length || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Results and releases awaiting review.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Current Patient Card</CardTitle>
            <p className="text-sm text-muted-foreground">Token, arrival time, and consult actions.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Patient</p>
            <p className="mt-2 text-lg font-semibold">{currentPatient?.patientId?.name || 'No current patient'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Token {currentPatient?.tokenNumber || '—'} • {currentPatient?.queuePosition ? `#${currentPatient.queuePosition}` : '—'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                {visitLabel(currentPatient?.visitType)}
              </span>
              {currentPatient?.priority && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${priorityTone(currentPatient.priority)}`}>
                  {currentPatient.priority}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Details</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {currentPatient?.patientProfileId?.age || '—'} yrs • {currentPatient?.patientProfileId?.gender || '—'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPatient?.reasonForVisit || 'No reason noted'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Arrived: {currentPatient?.checkInAt ? new Date(currentPatient.checkInAt).toLocaleTimeString() : '—'}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {[
                ['Booked', 'booked'],
                ['Arrived', 'arrived'],
                ['Consult', 'inConsultation'],
                ['Done', 'completed'],
              ].map(([label, status]) => (
                <div
                  key={status}
                  className={`rounded-full px-2 py-1 ${
                    currentPatient?.status === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 flex flex-col gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => currentPatient && handleStartConsultation(currentPatient._id)}
              disabled={!currentPatient || !['arrived', 'checked-in'].includes(currentPatient.status)}
            >
              Start Consultation
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => currentPatient && handleCompleteConsultation(currentPatient._id)}
              disabled={!currentPatient || currentPatient.status !== 'inConsultation'}
            >
              Complete Consultation
            </Button>
            {!currentPatient && (
              <div className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                No arrived patients yet. Queue will update as reception checks patients in.
              </div>
            )}
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
                    onClick={() => setSelectedAppointmentId(apt._id)}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{apt.patientId?.name || 'Patient'}</span>
                      <span className="text-xs text-muted-foreground">
                        Token {apt.tokenNumber || '—'} • {apt.slot}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {apt.checkInAt ? `Arrived ${new Date(apt.checkInAt).toLocaleTimeString()}` : 'Not arrived'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            apt.status === 'booked'
                              ? 'bg-primary/10 text-primary'
                              : apt.status === 'inConsultation'
                                ? 'bg-secondary/10 text-secondary'
                                : apt.status === 'completed'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted/50 text-muted-foreground'
                          }`}
                      >
                        {apt.status} {apt.queuePosition ? `• #${apt.queuePosition}` : ''} {apt.priority === 'Emergency' ? '• Emergency' : ''}
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
                      {apt.status === 'inConsultation' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteConsultation(apt._id)}
                          disabled={completingConsultation === apt._id}
                          className="text-xs"
                        >
                          {completingConsultation === apt._id ? 'Completing...' : 'Complete'}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Patient details</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary && <p className="text-sm text-muted-foreground">Loading patient details...</p>}
            {!loadingSummary && patientSummary && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">{patientSummary.patient?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {patientSummary.patient?.email} • {patientSummary.patient?.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patientSummary.patient?.gender || '—'} • {patientSummary.patient?.age || '—'} yrs • {patientSummary.patient?.bloodGroup || '—'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Allergies: {(patientSummary.patient?.allergies || []).join(', ') || 'None'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chronic: {(patientSummary.patient?.chronicDiseases || []).join(', ') || 'None'}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Latest vitals</p>
                    {patientSummary.patient?.latestVitals ? (
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <p>BP: {patientSummary.patient.latestVitals.bloodPressure || '—'}</p>
                        <p>Pulse: {patientSummary.patient.latestVitals.pulse || '—'}</p>
                        <p>Temp: {patientSummary.patient.latestVitals.temperature || '—'}</p>
                        <p>SpO2: {patientSummary.patient.latestVitals.spo2 || '—'}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">No recent vitals.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nurse notes</p>
                    <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                      {(patientSummary.nursingNotes || []).slice(0, 3).map((note) => (
                        <p key={note.id}>{note.noteType}: {note.content}</p>
                      ))}
                      {(patientSummary.nursingNotes || []).length === 0 && <p>No nurse notes.</p>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pharmacy status</p>
                    {patientSummary.latestPharmacyOrder ? (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>Status: {patientSummary.latestPharmacyOrder.status}</p>
                        <p>Payment: {patientSummary.latestPharmacyOrder.paymentStatus}</p>
                        <p>Total: ₹{Number(patientSummary.latestPharmacyOrder.total || 0).toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">No pharmacy orders yet.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admission history</p>
                  <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                    {admissionHistory.map((item) => (
                      <p key={item.id}>
                        {item.ward?.name || 'Ward'} • Bed {item.bed?.bedNumber || '—'} • {item.status}
                      </p>
                    ))}
                    {admissionHistory.length === 0 && <p>No admissions found.</p>}
                  </div>
                </div>
              </div>
            )}
            {!loadingSummary && !patientSummary && (
              <p className="text-sm text-muted-foreground">Select a patient from the queue to view details.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Admission recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                value={recommendNotes}
                onChange={(e) => setRecommendNotes(e.target.value)}
                placeholder="Reason for admission recommendation"
                className="min-h-[120px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <Button
                type="button"
                disabled={!selectedAppointmentId || savingRecommendation}
                onClick={handleRecommendAdmission}
              >
                {savingRecommendation ? 'Saving...' : 'Recommend Admission'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Prescription panel</CardTitle>
          </CardHeader>
          <CardContent>
            {!prescriptionForm.appointmentId && (
              <p className="text-sm text-muted-foreground">Select a patient from today&apos;s queue to start a prescription.</p>
            )}
            {prescriptionForm.appointmentId && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Appointment</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {todayQueue.find((apt) => apt._id === prescriptionForm.appointmentId)?.patientId?.name || 'Patient'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Token {todayQueue.find((apt) => apt._id === prescriptionForm.appointmentId)?.tokenNumber || '—'} • {todayQueue.find((apt) => apt._id === prescriptionForm.appointmentId)?.slot || '—'}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Symptoms</Label>
                    <textarea
                      value={prescriptionForm.symptoms}
                      onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                      className="min-h-[90px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Patient symptoms and complaints"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnosis</Label>
                    <textarea
                      value={prescriptionForm.diagnosis}
                      onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                      className="min-h-[90px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Clinical diagnosis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Advice</Label>
                    <textarea
                      value={prescriptionForm.advice}
                      onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, advice: e.target.value }))}
                      className="min-h-[90px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Care advice and instructions"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinical Notes</Label>
                    <textarea
                      value={prescriptionForm.clinicalNotes}
                      onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, clinicalNotes: e.target.value }))}
                      className="min-h-[90px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                      placeholder="Clinical notes, labs, or findings"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Follow-up date</Label>
                    <Input
                      type="date"
                      value={prescriptionForm.followUpDate}
                      onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Admission recommendation</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="admissionRecommended"
                        type="checkbox"
                        checked={prescriptionForm.admissionRecommended}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            admissionRecommended: e.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="admissionRecommended" className="text-sm text-muted-foreground">
                        Mark patient for admission review at reception
                      </Label>
                    </div>
                    {prescriptionForm.admissionRecommended && (
                      <textarea
                        value={prescriptionForm.admissionRecommendationNotes}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({ ...prev, admissionRecommendationNotes: e.target.value }))
                        }
                        className="mt-2 min-h-[70px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                        placeholder="Admission recommendation notes"
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">Medicines</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Medicine</Label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          value={medicineInput.medicineId}
                          onChange={(e) => setMedicineInput((prev) => ({ ...prev, medicineId: e.target.value, name: '' }))}
                          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                        >
                          <option value="">Select medicine</option>
                          {pharmacyMedicines.map((med) => (
                            <option key={med._id} value={med._id}>
                              {med.name} {med.strength ? `(${med.strength})` : ''}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="Or enter medicine name"
                          value={medicineInput.name}
                          onChange={(e) => setMedicineInput((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <Input
                        value={medicineInput.dosage}
                        onChange={(e) => setMedicineInput((prev) => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g. 500mg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input
                        value={medicineInput.frequency}
                        onChange={(e) => setMedicineInput((prev) => ({ ...prev, frequency: e.target.value }))}
                        placeholder="e.g. twice daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={medicineInput.duration}
                        onChange={(e) => setMedicineInput((prev) => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g. 7 days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={medicineInput.quantity}
                        onChange={(e) => setMedicineInput((prev) => ({ ...prev, quantity: e.target.value }))}
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input
                        value={medicineInput.unit}
                        onChange={(e) => setMedicineInput((prev) => ({ ...prev, unit: e.target.value }))}
                        placeholder="e.g. tablets"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Instructions</Label>
                      <Input
                        value={medicineInput.instructions}
                        onChange={(e) => setMedicineInput((prev) => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Any special instructions"
                      />
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="mt-4" onClick={handleAddMedicine}>
                    Add medicine
                  </Button>

                  <div className="mt-4 space-y-2">
                    {prescriptionForm.medicines.map((med, index) => (
                      <div key={`${med.name}-${index}`} className="flex items-start justify-between gap-3 rounded-xl bg-card/60 p-3">
                        <div>
                          <p className="font-medium text-foreground">{med.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {med.dosage || 'Dose'} • {med.frequency || 'Frequency'} • {med.duration || 'Duration'}
                          </p>
                          {med.instructions && <p className="text-xs text-muted-foreground">{med.instructions}</p>}
                        </div>
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveMedicine(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    {prescriptionForm.medicines.length === 0 && (
                      <p className="text-sm text-muted-foreground">No medicines added yet.</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => submitPrescription('draft')} disabled={savingPrescription}>
                    {savingPrescription ? 'Saving...' : 'Save draft'}
                  </Button>
                  <Button type="button" onClick={() => submitPrescription('active')} disabled={savingPrescription}>
                    {savingPrescription ? 'Submitting...' : 'Finalize prescription'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Prescription tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Use drafts while you collect vitals or labs. Finalizing a prescription completes the appointment.</p>
              <p>Admission recommendations surface automatically in the receptionist dashboard.</p>
              <p>Medicines added here are visible to nurses and patients in their care views.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle>Draft prescriptions</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/doctor/prescriptions">Review drafts</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {draftPrescriptions.length > 0 ? (
              <div className="space-y-3">
                {draftPrescriptions.slice(0, 4).map((draft) => (
                  <div key={draft._id} className="rounded-xl border border-border/60 p-3">
                    <p className="text-sm font-medium text-foreground">
                      {draft.patientId?.userId?.name || 'Patient'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {draft.diagnosis || draft.clinicalNotes || 'Draft in progress'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {draft.createdAt ? new Date(draft.createdAt).toLocaleString() : 'Recently saved'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No draft prescriptions saved.
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
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0" />
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
