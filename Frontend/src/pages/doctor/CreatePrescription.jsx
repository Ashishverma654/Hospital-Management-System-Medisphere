import { useState, useEffect } from 'react';
import { getDoctorAllAppointments } from '../../services/appointmentService';
import { createPrescription } from '../../services/prescriptionService';
import { FiPlus, FiMinus, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './DoctorPages.css';

const CreatePrescription = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDoctorAllAppointments();
        // Only show booked appointments for prescription
        setAppointments(data.filter((a) => a.status === 'booked'));
      } catch (err) {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const removeMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApt) {
      toast.error('Please select an appointment');
      return;
    }
    if (!diagnosis.trim()) {
      toast.error('Diagnosis is required');
      return;
    }
    setSubmitting(true);
    try {
      await createPrescription({
        appointmentId: selectedApt,
        diagnosis,
        medicines: medicines.filter((m) => m.name.trim()),
        notes,
      });
      toast.success('Prescription created successfully');
      setSelectedApt('');
      setDiagnosis('');
      setNotes('');
      setMedicines([{ name: '', dosage: '', duration: '' }]);
      // Refresh appointments
      const data = await getDoctorAllAppointments();
      setAppointments(data.filter((a) => a.status === 'booked'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Create Prescription</h1>
        <p>Write a prescription for a patient appointment</p>
      </div>

      <div className="card prescription-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Appointment</label>
            <select className="form-input" value={selectedApt} onChange={(e) => setSelectedApt(e.target.value)}>
              <option value="">Choose an appointment...</option>
              {appointments.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {apt.patientId?.name} — {apt.date} at {apt.slot}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Diagnosis</label>
            <input type="text" className="form-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Upper Respiratory Infection" />
          </div>

          <div className="form-group">
            <label>Medicines</label>
            <div className="medicines-list">
              {medicines.map((med, idx) => (
                <div key={idx} className="medicine-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input type="text" className="form-input" placeholder="Medicine name" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input type="text" className="form-input" placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input type="text" className="form-input" placeholder="Duration" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} />
                  </div>
                  <button type="button" className="medicine-remove" onClick={() => removeMedicine(idx)}>
                    <FiMinus />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addMedicine}>
              <FiPlus /> Add Medicine
            </button>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} style={{ resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
            <FiSave /> {submitting ? 'Creating...' : 'Create Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePrescription;
