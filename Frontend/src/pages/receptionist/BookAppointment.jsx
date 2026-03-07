import { useState, useEffect } from 'react';
import { getAllDoctors, getDoctorSlots } from '../../services/doctorService';
import { bookAppointment } from '../../services/appointmentService';
import { FiCalendar, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAllDoctors();
        setDoctors(data);
      } catch (err) {
        toast.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (!date || !selectedDoctor) return;
    setSlotsLoading(true);
    try {
      const data = await getDoctorSlots(selectedDoctor, date);
      setSlots(data.availableSlots || []);
    } catch (err) {
      setSlots([]);
      toast.error(err.response?.data?.message || 'No slots available');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedDate || !selectedDoctor) {
      toast.error('Please fill in all fields');
      return;
    }
    setBooking(true);
    try {
      await bookAppointment({
        doctorId: selectedDoctor,
        date: selectedDate,
        slot: selectedSlot,
      });
      toast.success('Appointment booked successfully!');
      setSelectedSlot('');
      setSelectedDate('');
      setSlots([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Book Appointment</h1>
        <p>Book an appointment on behalf of a patient</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="form-group">
          <label>Select Doctor</label>
          <select
            className="form-input"
            value={selectedDoctor}
            onChange={(e) => {
              setSelectedDoctor(e.target.value);
              setSlots([]);
              setSelectedSlot('');
              setSelectedDate('');
            }}
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.userId?.name} — {d.specialization} ({d.departmentId?.name})
              </option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              min={today}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
        )}

        {slotsLoading && <div className="page-loader" style={{ minHeight: 80 }}><div className="spinner"></div></div>}

        {selectedDate && !slotsLoading && slots.length > 0 && (
          <div className="form-group">
            <label>Available Slots ({slots.length})</label>
            <div className="slots-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: '8px',
              marginTop: '8px'
            }}>
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: selectedSlot === slot ? 'var(--primary)' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedSlot === slot ? 'var(--primary)' : 'var(--border)'}`,
                    color: selectedSlot === slot ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && !slotsLoading && slots.length === 0 && selectedDoctor && (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <h3>No slots available</h3>
            <p>Try a different date</p>
          </div>
        )}

        {selectedSlot && (
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-md)' }}
            onClick={handleBook}
            disabled={booking}
          >
            <FiCalendar /> {booking ? 'Booking...' : `Book at ${selectedSlot}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
