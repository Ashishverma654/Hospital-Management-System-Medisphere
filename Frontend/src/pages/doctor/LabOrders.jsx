import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { LoadingSkeleton } from '../../components';
import { labOrderApi, appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Plus, Trash2, Download, Send, AlertCircle } from 'lucide-react';

// Common lab tests
const COMMON_TESTS = [
  { testName: 'Complete Blood Count (CBC)', testCode: 'CBC', price: 150 },
  { testName: 'Blood Sugar (Fasting)', testCode: 'BS-F', price: 100 },
  { testName: 'Blood Sugar (Random)', testCode: 'BS-R', price: 100 },
  { testName: 'Thyroid Profile (TSH, T3, T4)', testCode: 'THYROID', price: 350 },
  { testName: 'Lipid Profile', testCode: 'LIPID', price: 250 },
  { testName: 'Liver Function Tests (LFT)', testCode: 'LFT', price: 300 },
  { testName: 'Kidney Function Tests (KFT)', testCode: 'KFT', price: 300 },
  { testName: 'Urine Routine', testCode: 'URINE', price: 100 },
  { testName: 'X-Ray (Chest)', testCode: 'XR-CHEST', price: 400 },
  { testName: 'Ultrasound (Abdomen)', testCode: 'USG-ABD', price: 500 },
  { testName: 'ECG', testCode: 'ECG', price: 200 },
];

export default function LabOrderCreation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const [formData, setFormData] = useState({
    patientId: patientId || '',
    appointmentId: appointmentId || '',
    urgency: 'routine',
    notes: '',
    tests: [],
  });

  const [selectedTest, setSelectedTest] = useState('');

  useEffect(() => {
    if (appointmentId) {
      const fetchAppointment = async () => {
        try {
          setLoading(true);
          const response = await appointmentApi.getDoctorToday();
          const found = Array.isArray(response) ? response.find((a) => a._id === appointmentId) : null;
          if (found) {
            setAppointment(found);
            setFormData((prev) => ({
              ...prev,
              patientId: found.patientId,
              appointmentId,
            }));
          }
        } catch (err) {
          console.error('Failed to fetch appointment', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAppointment();
    }
  }, [appointmentId]);

  const handleAddTest = () => {
    if (!selectedTest) {
      toast.error('Please select a test');
      return;
    }

    const test = COMMON_TESTS.find((t) => t.testCode === selectedTest);
    if (test && !formData.tests.find((t) => t.testCode === selectedTest)) {
      setFormData({
        ...formData,
        tests: [...formData.tests, test],
      });
      setSelectedTest('');
    } else if (formData.tests.find((t) => t.testCode === selectedTest)) {
      toast.error('This test is already added');
    }
  };

  const handleRemoveTest = (testCode) => {
    setFormData({
      ...formData,
      tests: formData.tests.filter((t) => t.testCode !== testCode),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientId) {
      toast.error('Patient is required');
      return;
    }

    if (formData.tests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    try {
      setLoading(true);
      const response = await labOrderApi.create({
        patientId: formData.patientId,
        appointmentId: formData.appointmentId || undefined,
        tests: formData.tests,
        urgency: formData.urgency,
        notes: formData.notes,
      });

      toast.success('Lab order created successfully');

      // Option to download PDF
      setTimeout(() => {
        if (confirm('Download lab order as PDF?')) {
          labOrderApi.downloadPdf(response.labOrder._id);
        }
        navigate('/doctor/appointments');
      }, 1000);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to create lab order'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.tests.reduce((sum, test) => sum + test.price, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Order Lab Tests</h2>
        <p className="text-muted-foreground">
          Create a lab order for the patient's diagnostic testing
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient and Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Patient & Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment && (
              <div className="grid md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-semibold">{appointment.patientId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appointment</p>
                  <p className="font-semibold">
                    {appointment.slot} - {appointment.consultationMode}
                  </p>
                </div>
              </div>
            )}

            {!appointment && (
              <div>
                <Label htmlFor="patient">Patient ID *</Label>
                <Input
                  id="patient"
                  placeholder="Enter patient ID or email"
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedTest} onValueChange={setSelectedTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TESTS.map((test) => (
                    <SelectItem key={test.testCode} value={test.testCode}>
                      {test.testName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddTest}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Tests */}
            {formData.tests.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Tests ({formData.tests.length})</Label>
                {formData.tests.map((test) => (
                  <div
                    key={test.testCode}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{test.testName}</p>
                      <p className="text-xs text-muted-foreground">{test.testCode}</p>
                    </div>
                    <div className="text-right pr-3">
                      <p className="font-semibold">₹{test.price}</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveTest(test.testCode)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgency & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="urgency">Urgency *</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT (Immediate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or clinical context for the lab..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Number of Tests:</span>
                <span className="font-semibold">{formData.tests.length}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading || formData.tests.length === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Lab Order'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
