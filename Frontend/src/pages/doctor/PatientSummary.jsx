import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LoadingSkeleton, ErrorState } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import {
  User,
  Phone,
  Mail,
  AlertCircle,
  Heart,
  History,
  FileText,
  Pill,
  Plus,
  ArrowLeft,
  Stethoscope,
} from 'lucide-react';

export default function PatientSummary() {
  const { id } = useParams();
  const appointmentId = id;
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [startingConsultation, setStartingConsultation] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const appointment = await appointmentApi.getDoctorById(appointmentId);

        if (!appointment) {
          setError('Appointment not found');
          return;
        }

        // Fetch patient summary
        const resolvedPatientId = appointment.patientId?._id || appointment.patientId;
        const patientResponse = await appointmentApi.getPatientSummary(resolvedPatientId);
        setSummaryData({
          appointment,
          ...patientResponse,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient summary');
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    };
    
    if (appointmentId) {
      loadSummary();
    }
  }, [appointmentId]);

  const fetchPatientSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const appointment = await appointmentApi.getDoctorById(appointmentId);

      if (!appointment) {
        setError('Appointment not found');
        return;
      }

      // Fetch patient summary
      const resolvedPatientId = appointment.patientId?._id || appointment.patientId;
      const patientResponse = await appointmentApi.getPatientSummary(resolvedPatientId);
      setSummaryData({
        appointment,
        ...patientResponse,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient summary');
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  if (loading && !hasLoaded) return <LoadingSkeleton />;

  if (error) return <ErrorState error={error} onRetry={fetchPatientSummary} />;

  if (!summaryData)
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient data not found</p>
      </div>
    );

  const patient = summaryData.patient;
  const recentPrescriptions = summaryData.recentPrescriptions || [];
  const recentLabOrders = summaryData.recentLabOrders || [];
  const recentLabReports = summaryData.recentLabReports || [];
  const appointmentHistory = summaryData.appointmentHistory || [];
  const recentVitals = summaryData.recentVitals || [];
  const nursingNotes = summaryData.nursingNotes || [];
  const triageFlags = [];

  if (patient?.allergies?.length) {
    triageFlags.push('Allergy risk');
  }
  if (patient?.chronicDiseases?.length) {
    triageFlags.push('Chronic condition');
  }
  if (patient?.latestVitals) {
    const vitals = patient.latestVitals;
    const highTemp = vitals.temperature && Number(vitals.temperature) >= 100;
    const lowSpo2 = vitals.spo2 && Number(vitals.spo2) < 94;
    const highPulse = vitals.pulse && Number(vitals.pulse) > 100;
    const highBp = vitals.bloodPressure && vitals.bloodPressure.split('/').some((val) => Number(val) >= 140);
    if (highTemp || lowSpo2 || highPulse || highBp) {
      triageFlags.push('Vitals out of range');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/doctor/appointments')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Patient Summary</h2>
            <p className="text-muted-foreground">
              Before starting consultation - review patient history
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (!appointmentId) return;
              try {
                setStartingConsultation(true);
                await appointmentApi.startConsultation(appointmentId);
                toast.success('Consultation started.');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to start consultation.');
              } finally {
                setStartingConsultation(false);
              }
            }}
            disabled={startingConsultation || !['arrived', 'checked-in', 'booked', 'confirmed'].includes(summaryData.appointment?.status)}
          >
            {startingConsultation ? 'Starting...' : 'Start Consultation'}
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate(`/doctor/prescriptions?appointmentId=${appointmentId}`)}
          >
            <Stethoscope className="h-4 w-4" />
            Start Prescription
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!appointmentId) return;
              try {
                setCompleting(true);
                await appointmentApi.complete(appointmentId);
                toast.success('Appointment marked as completed.');
                navigate('/doctor/appointments');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to complete appointment.');
              } finally {
                setCompleting(false);
              }
            }}
            disabled={completing || summaryData.appointment?.status !== 'inConsultation'}
          >
            {completing ? 'Completing...' : 'Mark Completed'}
          </Button>
        </div>
      </div>

      {/* Patient Identity Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="text-lg font-semibold">{patient?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient ID</p>
              <p className="text-lg font-semibold font-mono">{patient?.patientId || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{patient?.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{patient?.email || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="text-lg font-semibold">{patient?.age ? `${patient.age} years` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="text-lg font-semibold capitalize">{patient?.gender || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blood Group</p>
              <p className="text-lg font-semibold">{patient?.bloodGroup || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marital Status</p>
              <p className="text-lg font-semibold capitalize">{patient?.maritalStatus || 'N/A'}</p>
            </div>
          </div>

          {/* Vitals */}
          {(patient?.height || patient?.weight) && (
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">Vitals on Record</p>
              <div className="grid md:grid-cols-3 gap-4">
                {patient?.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p>{patient.height} cm</p>
                  </div>
                )}
                {patient?.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p>{patient.weight} kg</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triage Flags */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Triage highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {triageFlags.length ? (
            triageFlags.map((flag) => (
              <span
                key={flag}
                className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive"
              >
                {flag}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              No high-risk flags identified
            </span>
          )}
        </CardContent>
      </Card>

      {/* Medical History */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Allergies */}
        {patient?.allergies && patient.allergies.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patient.allergies.map((allergy, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-muted/60 text-foreground"
                  >
                    {allergy}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chronic Diseases */}
        {patient?.chronicDiseases && patient.chronicDiseases.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Heart className="h-5 w-5" />
                Chronic Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patient.chronicDiseases.map((disease, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-muted/60 text-foreground"
                  >
                    {disease}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insurance */}
        {patient?.insuranceProvider && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Insurance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{patient.insuranceProvider}</p>
              {patient.insuranceNumber && (
                <p className="text-sm text-muted-foreground">{patient.insuranceNumber}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        {patient?.emergencyContact && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{patient.emergencyContact.name}</p>
              <p className="text-sm text-muted-foreground">
                {patient.emergencyContact.relation}
              </p>
              <p className="text-sm">{patient.emergencyContact.phone}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Prescriptions */}
      {recentPrescriptions && recentPrescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescription Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrescriptions.map((prescription) => (
                <div
                  key={prescription._id}
                  className="border-l-4 border-primary/60 pl-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {prescription.status || 'active'}
                    </span>
                    {prescription.followUpDate && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Follow-up {new Date(prescription.followUpDate).toLocaleDateString()}
                      </span>
                    )}
                    {prescription.admissionRecommended && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Admission recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-medium text-sm">
                    {prescription.diagnosis || 'Medical Prescription'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prescription.medicines?.length || 0} medicines • {prescription.appointmentId?.date || 'Date not set'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentLabOrders && recentLabOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Lab Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLabOrders.map((order) => (
                <div
                  key={order._id}
                  className="border-l-4 border-secondary/60 pl-4 py-2"
                >
                  <p className="font-medium text-sm">{order.orderNumber || 'Lab order'}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.status} • {order.paymentStatus} • {order.urgency || 'routine'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Lab Reports */}
      {recentLabReports && recentLabReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Lab Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLabReports.map((report) => (
                <div
                  key={report._id}
                  className="border-l-4 border-primary/60 pl-4 py-2"
                >
                  <p className="font-medium text-sm">{report.reportName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment History */}
      {appointmentHistory && appointmentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Appointment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointmentHistory.slice(0, 5).map((apt) => (
                <div
                  key={apt._id}
                  className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {new Date(apt.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{apt.slot}</p>
                  </div>
                  <div className="text-xs rounded-full border border-border px-2 py-1 text-muted-foreground">
                    {apt.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nursing Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nursing Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nursingNotes.length > 0 ? nursingNotes.map((note) => (
              <div key={note.id} className="border-l-4 border-primary/60 pl-4 py-2">
                <p className="font-medium text-sm">{note.noteType || 'Note'}</p>
                <p className="text-xs text-muted-foreground">
                  {note.nurseName || 'Nurse'} • {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No nursing notes available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Recent Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentVitals.length > 0 ? recentVitals.map((vital) => (
              <div key={vital.id} className="border-l-4 border-secondary/60 pl-4 py-2">
                <p className="font-medium text-sm">
                  {vital.recordedAt ? new Date(vital.recordedAt).toLocaleString() : 'Vitals entry'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vital.nurseName || 'Nurse'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  BP {vital.bloodPressure || '—'} • Pulse {vital.pulse || '—'} • Temp {vital.temperature || '—'} • SpO2 {vital.spo2 || '—'}
                </p>
                {vital.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{vital.notes}</p>
                )}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No vitals recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(`/doctor/prescriptions?appointmentId=${appointmentId}`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Prescription
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/doctor/lab-orders?appointmentId=${appointmentId}`)}
        >
          <FileText className="h-4 w-4 mr-2" />
          Create Lab Order
        </Button>
      </div>
    </div>
  );
}
