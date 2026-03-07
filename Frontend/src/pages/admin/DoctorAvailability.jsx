import { useState, useEffect } from 'react';
import { getAllDoctors } from '../../services/doctorService';
import { createAvailability, getAvailabilityByDoctorId } from '../../services/availabilityService';
import { FiClock, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminPages.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorAvailability = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 15,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getAllDoctors();
        setDoctors(data);
      } catch (err) {
        toast.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      const fetchAvail = async () => {
        try {
          const data = await getAvailabilityByDoctorId(selectedDoctor);
          setAvailability(data);
        } catch {
          setAvailability([]);
        }
      };
      fetchAvail();
    }
  }, [selectedDoctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    setSaving(true);
    try {
      await createAvailability({
        doctorId: selectedDoctor,
        ...form,
        slotDuration: Number(form.slotDuration),
      });
      toast.success('Availability saved');
      const data = await getAvailabilityByDoctorId(selectedDoctor);
      setAvailability(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Doctor Availability</h1>
        <p>Set availability schedule for doctors</p>
      </div>

      <div className="card avail-form-card">
        <div className="form-group">
          <label>Select Doctor</label>
          <select className="form-input" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} id="avail-doctor-select">
            <option value="">Choose a doctor...</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>{d.userId?.name} — {d.specialization}</option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <>
            <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-lg)' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Day of Week</label>
                  <select className="form-input" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Slot Duration (minutes)</label>
                  <select className="form-input" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: e.target.value })}>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 'var(--space-md)' }}>
                <FiSave /> {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </form>

            {availability.length > 0 && (
              <div className="avail-schedule">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                  <FiClock style={{ marginRight: 8 }} /> Current Schedule
                </h3>
                {availability.map((a) => (
                  <div key={a._id} className="avail-day-item">
                    <span className="avail-day-name">{a.dayOfWeek}</span>
                    <span className="avail-day-time">{a.startTime} — {a.endTime} ({a.slotDuration}min slots)</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorAvailability;
