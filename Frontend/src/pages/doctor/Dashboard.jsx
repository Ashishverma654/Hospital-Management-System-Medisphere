import { useState, useEffect } from 'react';
import { getTodayAppointments, completeAppointment } from '../../services/appointmentService';
import { getDoctorById } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import { FiCheckCircle, FiUser, FiClock, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './DoctorPages.css';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState({ date: '', appointments: [] });
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [today, docInfo] = await Promise.all([
        getTodayAppointments(),
        getDoctorById(user.id),
      ]);
      setTodayData(today);
      setDoctorInfo(docInfo);
    } catch (err) {
      // Appointments may 404 if no data
      if (err.response?.status !== 404) {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleComplete = async (id) => {
    try {
      await completeAppointment(id);
      toast.success('Appointment marked as completed');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, Dr. {user?.name}</h1>
        <p>{doctorInfo?.specialization} • {doctorInfo?.departmentId?.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6C63FF' }}>
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h3>{todayData.appointments?.length || 0}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 212, 170, 0.15)', color: '#00D4AA' }}>
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{todayData.date || 'N/A'}</h3>
            <p>Today's Date</p>
          </div>
        </div>
      </div>

      <div className="section-title">
        <h2>Today's Patients</h2>
      </div>

      {!todayData.appointments || todayData.appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No appointments today</h3>
          <p>You have no booked appointments for today</p>
        </div>
      ) : (
        <div className="appointment-cards">
          {todayData.appointments.map((apt) => (
            <div key={apt._id} className="apt-card">
              <div className="apt-card-left">
                <div className="apt-patient-avatar">
                  <FiUser />
                </div>
                <div>
                  <h4>{apt.patientId?.name || 'Unknown Patient'}</h4>
                  <p>{apt.patientId?.email}</p>
                  {apt.patientId?.phone && <p>📞 {apt.patientId.phone}</p>}
                </div>
              </div>
              <div className="apt-card-right">
                <span className="apt-time">{apt.slot}</span>
                <button className="btn btn-accent btn-sm" onClick={() => handleComplete(apt._id)}>
                  <FiCheckCircle /> Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
