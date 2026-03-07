import { useState, useEffect } from 'react';
import { getAllDoctors, createDoctor } from '../../services/doctorService';
import { getAllDepartments } from '../../services/departmentService';
import { FiPlus, FiX, FiDollarSign, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminPages.css';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', departmentId: '',
    specialization: '', experience: '', consultationFee: '', about: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [docData, deptData] = await Promise.all([getAllDoctors(), getAllDepartments()]);
      setDoctors(docData);
      setDepartments(deptData);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.departmentId || !form.specialization || !form.experience || !form.consultationFee) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createDoctor({
        ...form,
        experience: Number(form.experience),
        consultationFee: Number(form.consultationFee),
      });
      toast.success('Doctor created successfully');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', departmentId: '', specialization: '', experience: '', consultationFee: '', about: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Doctors</h1>
        <p>Manage hospital doctors</p>
      </div>

      <div className="page-actions">
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-doctor-btn">
          <FiPlus /> Add Doctor
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍⚕️</div>
          <h3>No doctors registered</h3>
          <p>Add doctors to the hospital system</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {doctors.map((doc) => (
            <div key={doc._id} className="doctor-card">
              <div className="doctor-card-top">
                <div className="doctor-avatar">
                  {doc.userId?.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div>
                  <div className="doctor-card-name">{doc.userId?.name || 'Unknown'}</div>
                  <div className="doctor-card-dept">{doc.departmentId?.name || 'N/A'}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                {doc.specialization}
              </p>
              <div className="doctor-card-details">
                <span className="doctor-detail-chip"><FiBriefcase style={{ marginRight: 4 }} />{doc.experience} yrs</span>
                <span className="doctor-detail-chip"><FiDollarSign style={{ marginRight: 4 }} />₹{doc.consultationFee}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Add New Doctor</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. John Doe" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@hospital.com" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select className="form-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Specialization *</label>
                  <input type="text" className="form-input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Cardiologist" />
                </div>
                <div className="form-group">
                  <label>Experience (years) *</label>
                  <input type="number" className="form-input" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 10" />
                </div>
                <div className="form-group">
                  <label>Consultation Fee (₹) *</label>
                  <input type="number" className="form-input" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} placeholder="e.g. 500" />
                </div>
                <div className="form-group full-width">
                  <label>About</label>
                  <textarea className="form-input" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Brief bio..." rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-md)' }} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Doctor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
