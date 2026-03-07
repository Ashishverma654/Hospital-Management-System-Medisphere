import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctorById, getDoctorSlots } from '../../services/doctorService';
import { bookAppointment } from '../../services/appointmentService';
import { FiBriefcase, FiDollarSign, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PatientPages.css';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDoctorById(id);
        setDoctor(data);
      } catch (err) {
        toast.error('Doctor not found');
        navigate('/patient/doctors');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (!date) return;
    setSlotsLoading(true);
    try {
      const data = await getDoctorSlots(id, date);
      setSlots(data.availableSlots || []);
    } catch (err) {
      setSlots([]);
      if (err.response?.status === 404) {
        toast.error(err.response?.data?.message || 'Not available on this day');
      } else {
        toast.error('Failed to load slots');
      }
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedDate) {
      toast.error('Please select a date and slot');
      return;
    }
    setBooking(true);
    try {
      await bookAppointment({ doctorId: id, date: selectedDate, slot: selectedSlot });
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!doctor) return null;

  // Minimum date: today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <h1>Doctor Profile</h1>
        <p>View details and book an appointment</p>
      </div>

      <div className="doctor-profile">
        <div className="doctor-profile-card">
          <div className="doctor-profile-header">
            <div className="doctor-profile-avatar">
              {doctor.userId?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div>
              <div className="doctor-profile-name">{doctor.userId?.name}</div>
              <div className="doctor-profile-spec">{doctor.specialization}</div>
            </div>
          </div>

          {doctor.about && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
              {doctor.about}
            </p>
          )}

          <div className="doctor-info-grid">
            <div className="doctor-info-item">
              <label>Department</label>
              <span>{doctor.departmentId?.name || 'N/A'}</span>
            </div>
            <div className="doctor-info-item">
              <label>Experience</label>
              <span><FiBriefcase style={{ marginRight: 4 }} />{doctor.experience} years</span>
            </div>
            <div className="doctor-info-item">
              <label>Consultation Fee</label>
              <span><FiDollarSign style={{ marginRight: 4 }} />₹{doctor.consultationFee}</span>
            </div>
            <div className="doctor-info-item">
              <label>Email</label>
              <span style={{ fontSize: '0.8rem' }}><FiMail style={{ marginRight: 4 }} />{doctor.userId?.email}</span>
            </div>
          </div>
        </div>

        <div className="booking-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
            <FiCalendar style={{ marginRight: 8 }} /> Book Appointment
          </h3>

          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              min={today}
              onChange={(e) => handleDateChange(e.target.value)}
              id="booking-date"
            />
          </div>

          {slotsLoading && <div className="page-loader" style={{ minHeight: 100 }}><div className="spinner"></div></div>}

          {selectedDate && !slotsLoading && (
            <>
              {slots.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                  <h3>No slots available</h3>
                  <p>Try a different date</p>
                </div>
              ) : (
                <>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', display: 'block' }}>
                    Available Slots ({slots.length})
                  </label>
                  <div className="slots-grid">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        className={`slot-btn ${selectedSlot === slot ? 'slot-btn--selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {selectedSlot && (
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
              onClick={handleBook}
              disabled={booking}
              id="book-appointment-btn"
            >
              {booking ? 'Booking...' : `Book at ${selectedSlot}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
