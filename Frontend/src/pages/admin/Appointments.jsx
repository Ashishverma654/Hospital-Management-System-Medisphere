import { useState, useEffect } from 'react';
import { getAllAppointments, cancelAppointment } from '../../services/appointmentService';
import { FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminPages.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAppointments = async () => {
    try {
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const getStatusBadge = (status) => {
    const map = {
      booked: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return `badge ${map[status] || 'badge-info'}`;
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>All Appointments</h1>
        <p>View and manage all hospital appointments</p>
      </div>

      <div className="page-actions">
        {['all', 'booked', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No appointments found</h3>
          <p>No appointments match the current filter</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt._id}>
                  <td>{apt.patientId?.name || 'N/A'}</td>
                  <td>{apt.doctorId?.userId?.name || 'N/A'}</td>
                  <td>{apt.date}</td>
                  <td>{apt.slot}</td>
                  <td><span className={getStatusBadge(apt.status)}>{apt.status}</span></td>
                  <td>
                    {apt.status === 'booked' && (
                      <button className="icon-btn icon-btn--danger" onClick={() => handleCancel(apt._id)} title="Cancel">
                        <FiXCircle />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Appointments;
