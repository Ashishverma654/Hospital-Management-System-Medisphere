import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LoadingSkeleton, ErrorState } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
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
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch appointment first to get patient ID
        const appointmentResponse = await appointmentApi.getDoctorToday();
        const appointment = Array.isArray(appointmentResponse)
          ? appointmentResponse.find((a) => a._id === appointmentId)
          : null;

        if (!appointment) {
          setError('Appointment not found');
          return;
        }

        // Fetch patient summary
        const patientResponse = await appointmentApi.getPatientSummary(appointment.patientId);
        setSummaryData({
          appointment,
          ...patientResponse,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient summary');
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
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
      
      // Fetch appointment first to get patient ID
      const appointmentResponse = await appointmentApi.getDoctorToday();
      const appointment = Array.isArray(appointmentResponse)
        ? appointmentResponse.find((a) => a._id === appointmentId)
        : null;

      if (!appointment) {
        setError('Appointment not found');
        return;
      }

      // Fetch patient summary
      const patientResponse = await appointmentApi.getPatientSummary(appointment.patientId);
      setSummaryData({
        appointment,
        ...patientResponse,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient summary');
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        <Button asChild className="gap-2">
          <a href="#consultation">
            <Stethoscope className="h-4 w-4" />
            Start Prescription
          </a>
        </Button>
      </div>

      {/* Patient Identity Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
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
              <p className="text-lg font-semibold">{patient?.age || 'N/A'} years</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="text-lg font-semibold capitalize">{patient?.gender || 'N/A'}</p>
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

      {/* Medical History */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Allergies */}
        {patient?.allergies && patient.allergies.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="h-5 w-5" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patient.allergies.map((allergy, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-orange-100 rounded-md text-sm font-medium"
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
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Heart className="h-5 w-5" />
                Chronic Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patient.chronicDiseases.map((disease, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-red-100 rounded-md text-sm font-medium"
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
              Recent Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPrescriptions.map((prescription) => (
                <div
                  key={prescription._id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <p className="font-medium text-sm">
                    {prescription.diagnosis || 'Medical Prescription'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prescription.medicines?.length || 0} items
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
                  className="border-l-4 border-amber-500 pl-4 py-2"
                >
                  <p className="font-medium text-sm">{order.orderNumber || 'Lab order'}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.status} • {order.paymentStatus}
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
                  className="border-l-4 border-green-500 pl-4 py-2"
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
                  <div className="text-xs badge">{apt.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button asChild className="gap-2">
          <a href="#consultation">
            <Stethoscope className="h-4 w-4" />
            Start Consultation
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/doctor/prescriptions?appointmentId=${appointmentId}`)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Prescription
        </Button>
      </div>
    </div>
  );
}
