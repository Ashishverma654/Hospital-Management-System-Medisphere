import { useState, useEffect } from 'react';
import { getDoctorAllAppointments } from '../../services/appointmentService';
import toast from 'react-hot-toast';
import './DoctorPages.css';

const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getDoctorAllAppointments();
        setAppointments(data);
      } catch (err) {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const getStatusBadge = (status) => {
    const map = { booked: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
    return `badge ${map[status] || 'badge-info'}`;
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>All Appointments</h1>
        <p>View your complete appointment history</p>
      </div>

      <div className="page-actions">
        {['all', 'booked', 'completed', 'cancelled'].map((f) => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No appointments</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt._id}>
                  <td>{apt.patientId?.name || 'N/A'}</td>
                  <td>{apt.patientId?.email || 'N/A'}</td>
                  <td>{apt.date}</td>
                  <td>{apt.slot}</td>
                  <td><span className={getStatusBadge(apt.status)}>{apt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllAppointments;
