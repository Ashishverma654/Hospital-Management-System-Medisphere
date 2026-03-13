import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { ErrorState, LoadingSkeleton } from '../../components';
import { prescriptionApi, appointmentApi, pharmacyApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Plus, Trash2, Send, FileText } from 'lucide-react';

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const [loading, setLoading] = useState(!!appointmentId);
  const [error, setError] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [appointment, setAppointment] = useState(null);

  const [formData, setFormData] = useState({
    appointmentId: appointmentId || '',
    diagnosis: '',
    medicines: [],
    notes: '',
  });

  const [medicineInput, setMedicineInput] = useState({
    medicineId: '',
    dosage: '',
    frequency: '',
    duration: '',
  });

  useEffect(() => {
    Promise.all([fetchMedicines(), appointmentId && fetchAppointment(appointmentId)]);
  }, [appointmentId]);

  const fetchMedicines = async () => {
    try {
      const data = await pharmacyApi.getAll();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (_err) {
    }
  };

  const fetchAppointment = async (id) => {
    try {
      setLoading(true);
      const data = await appointmentApi.getAll();
      const found = Array.isArray(data) ? data.find((a) => a._id === id) : null;
      if (found) {
        setAppointment(found);
      } else {
        setError('Appointment not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    if (!medicineInput.medicineId || !medicineInput.dosage || !medicineInput.frequency) {
      toast.error('Please fill all medicine fields');
      return;
    }
    setFormData({
      ...formData,
      medicines: [
        ...formData.medicines,
        { ...medicineInput, medicineId: medicineInput.medicineId },
      ],
    });
    setMedicineInput({ medicineId: '', dosage: '', frequency: '', duration: '' });
  };

  const handleRemoveMedicine = (index) => {
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.appointmentId || !formData.diagnosis || formData.medicines.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      await prescriptionApi.create(formData);
      toast.success('Prescription created successfully');
      navigate('/doctor/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  if (loading && appointmentId) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Prescription</h2>
        <p className="text-muted-foreground">
          {appointment
            ? `Create prescription for ${appointment.patientId?.userId?.name || 'Patient'}`
            : 'Fill in the prescription details below'}
        </p>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Prescription Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment Selection */}
            <div className="space-y-2">
              <Label htmlFor="appointment">
                Appointment <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appointment"
                value={formData.appointmentId}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentId: e.target.value })
                }
                placeholder="Enter appointment ID or select from list"
                required
              />
              {appointment && (
                <div className="mt-2 p-3 bg-muted/50 rounded text-sm">
                  <p className="font-medium">{appointment.patientId?.userId?.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(appointment.date).toLocaleDateString()} at{' '}
                    {appointment.time}
                  </p>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis">
                Diagnosis <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                placeholder="Describe the patient's diagnosis and findings..."
                className="w-full p-3 border border-border rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
                rows="4"
                required
              />
            </div>

            {/* Medicines */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Medicines
              </h3>

              {/* Add Medicine Form */}
              <div className="space-y-4 p-3 bg-background/50 rounded border border-border/50">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="medicine">Medicine</Label>
                    <Select
                      value={medicineInput.medicineId}
                      onValueChange={(value) =>
                        setMedicineInput({ ...medicineInput, medicineId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((med) => (
                          <SelectItem key={med._id} value={med._id}>
                            {med.name} ({med.strength})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={medicineInput.dosage}
                      onChange={(e) =>
                        setMedicineInput({
                          ...medicineInput,
                          dosage: e.target.value,
                        })
                      }
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      id="frequency"
                      value={medicineInput.frequency}
                      onChange={(e) =>
                        setMedicineInput({
                          ...medicineInput,
                          frequency: e.target.value,
                        })
                      }
                      placeholder="e.g., twice daily"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={medicineInput.duration}
                      onChange={(e) =>
                        setMedicineInput({
                          ...medicineInput,
                          duration: e.target.value,
                        })
                      }
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddMedicine}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Medicine
                </Button>
              </div>

              {/* Added Medicines List */}
              {formData.medicines.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Added Medicines:</p>
                  {formData.medicines.map((med, idx) => {
                    const medicine = medicines.find((m) => m._id === med.medicineId);
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-start p-3 bg-muted/50 rounded text-sm"
                      >
                        <div>
                          <p className="font-medium">{medicine?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {med.dosage} - {med.frequency} for {med.duration}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMedicine(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional instructions for the patient..."
                className="w-full p-3 border border-border rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
                rows="3"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 shadow-md shadow-primary/20" disabled={loading}>
                <Send className="h-4 w-4 mr-2" /> Create Prescription
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/doctor/appointments')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
