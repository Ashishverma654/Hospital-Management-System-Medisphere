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

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const [loading, setLoading] = useState(!!appointmentId);
  const [error, setError] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  const [formData, setFormData] = useState({
    appointmentId: appointmentId || '',
    diagnosis: '',
    medicines: [],
    notes: '',
  });
  const [noMedicationRequired, setNoMedicationRequired] = useState(false);

  const [medicineInput, setMedicineInput] = useState({
    medicineId: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    instructions: '',
  });

  useEffect(() => {
    Promise.all([fetchMedicines(), fetchDoctorAppointments(), appointmentId && fetchAppointment(appointmentId), fetchRecentPrescriptions()]);
  }, [appointmentId]);

  const fetchDoctorAppointments = async () => {
    try {
      const data = await appointmentApi.getDoctorAll();
      const list = Array.isArray(data) ? data : data?.data || [];
      setDoctorAppointments(Array.isArray(list) ? list : []);
    } catch {
      setDoctorAppointments([]);
    }
  };

  const fetchMedicines = async () => {
    try {
      const data = await pharmacyApi.getAll();
      setMedicines(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load medicines');
    }
  };

  const fetchAppointment = async (id) => {
    try {
      setLoading(true);
      const data = await appointmentApi.getDoctorAll();
      const list = Array.isArray(data) ? data : data?.data || [];
      const found = Array.isArray(list) ? list.find((a) => a._id === id) : null;
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

  const fetchRecentPrescriptions = async () => {
    try {
      const data = await prescriptionApi.getMy();
      setRecentPrescriptions(Array.isArray(data) ? data : []);
    } catch {
      // ignore recent list failures
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
        {
          medicineId: medicineInput.medicineId,
          dosage: medicineInput.dosage,
          frequency: medicineInput.frequency,
          duration: medicineInput.duration,
          quantity: medicineInput.quantity,
          instructions: medicineInput.instructions,
        },
      ],
    });
    setMedicineInput({ medicineId: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' });
  };

  const handleRemoveMedicine = (index) => {
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.appointmentId || !formData.diagnosis) {
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create Prescription</h2>
        <p className="text-muted-foreground">
          {appointment
            ? `Create prescription for ${appointment.patientId?.userId?.name || 'Patient'}`
            : 'Fill in the prescription details below'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPrescriptions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Created by you</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest prescription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentPrescriptions[0]?.createdAt ? new Date(recentPrescriptions[0].createdAt).toLocaleDateString() : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most recent order</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(recentPrescriptions.map((p) => p.patientId?._id || p.patientId)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Prescriptions issued</p>
          </CardContent>
        </Card>
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
              <select
                id="appointment"
                value={formData.appointmentId}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, appointmentId: value });
                  if (value) {
                    fetchAppointment(value);
                  }
                }}
                className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select appointment</option>
                {doctorAppointments.map((apt) => (
                  <option key={apt._id} value={apt._id}>
                    {apt.patientId?.name || apt.patientId?.userId?.name || 'Patient'} • {apt.slot} • {apt.status}
                  </option>
                ))}
              </select>
              {appointment && (
                <div className="mt-2 p-3 bg-muted/50 rounded text-sm">
                  <p className="font-medium">
                    {appointment.patientId?.name || appointment.patientId?.userId?.name || 'Patient'}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(appointment.date).toLocaleDateString()} at{' '}
                    {appointment.slot || '—'}
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
            <div className="space-y-4 rounded-lg bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-semibold">Medicines</h3>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Optional</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add medicines only when required. You can submit a diagnosis without prescribing medication.
              </p>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={noMedicationRequired}
                  onChange={(e) => setNoMedicationRequired(e.target.checked)}
                  className="h-4 w-4 rounded border border-border text-primary focus:ring-primary"
                />
                No medication required for this consultation
              </label>

              {/* Add Medicine Form */}
              <div className={`space-y-4 rounded border border-border/50 bg-background/50 p-3 ${noMedicationRequired ? 'pointer-events-none opacity-60' : ''}`}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="medicine">Medicine</Label>
                    <Select
                      value={medicineInput.medicineId}
                      onValueChange={(value) =>
                        setMedicineInput({ ...medicineInput, medicineId: String(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map((med) => {
                          const medId = med.id || med._id;
                          return (
                            <SelectItem key={medId} value={String(medId)}>
                              {med.name || 'Medicine'}{med.unit ? ` • ${med.unit}` : ''}
                            </SelectItem>
                          );
                        })}
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
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={medicineInput.quantity}
                      onChange={(e) =>
                        setMedicineInput({
                          ...medicineInput,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Input
                      id="instructions"
                      value={medicineInput.instructions}
                      onChange={(e) =>
                        setMedicineInput({
                          ...medicineInput,
                          instructions: e.target.value,
                        })
                      }
                      placeholder="Any special instructions"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddMedicine}
                  variant="outline"
                  className="w-full"
                  disabled={noMedicationRequired}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Medicine
                </Button>
              </div>

              {/* Added Medicines List */}
              {formData.medicines.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Added Medicines:</p>
                  {formData.medicines.map((med, idx) => {
                    const medicine = medicines.find((m) => String(m.id || m._id) === String(med.medicineId));
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
                          {med.quantity && (
                            <p className="text-xs text-muted-foreground">
                              Qty: {med.quantity}
                            </p>
                          )}
                          {med.instructions && (
                            <p className="text-xs text-muted-foreground">{med.instructions}</p>
                          )}
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

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPrescriptions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No prescriptions created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentPrescriptions.slice(0, 6).map((prescription) => (
                <div key={prescription._id} className="rounded-xl border border-border p-4">
                  <p className="font-medium text-foreground">
                    {prescription.patientId?.userId?.name || 'Patient'} • {prescription.diagnosis || 'Prescription'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {prescription.createdAt ? new Date(prescription.createdAt).toLocaleString() : 'Created recently'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
