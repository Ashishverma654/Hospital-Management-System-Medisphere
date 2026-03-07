import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDoctors } from '../../services/doctorService';
import { FiSearch, FiArrowRight, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PatientPages.css';

const BrowseDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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

  const filtered = doctors.filter((doc) => {
    const q = search.toLowerCase();
    return (
      doc.userId?.name?.toLowerCase().includes(q) ||
      doc.specialization?.toLowerCase().includes(q) ||
      doc.departmentId?.name?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Find a Doctor</h1>
        <p>Browse doctors and book your appointment</p>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <FiSearch />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, specialization, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="doctor-search"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No doctors found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {filtered.map((doc) => (
            <div key={doc._id} className="doctor-card" onClick={() => navigate(`/patient/doctors/${doc._id}`)} style={{ cursor: 'pointer' }}>
              <div className="doctor-card-top">
                <div className="doctor-avatar">
                  {doc.userId?.name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div>
                  <div className="doctor-card-name">{doc.userId?.name}</div>
                  <div className="doctor-card-dept">{doc.departmentId?.name}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                {doc.specialization}
              </p>
              <div className="doctor-card-details">
                <span className="doctor-detail-chip"><FiBriefcase style={{ marginRight: 4 }} />{doc.experience} yrs</span>
                <span className="doctor-detail-chip"><FiDollarSign style={{ marginRight: 4 }} />₹{doc.consultationFee}</span>
              </div>
              <div style={{ marginTop: 'var(--space-md)', textAlign: 'right' }}>
                <span style={{ color: 'var(--primary-light)', fontSize: '0.82rem', fontWeight: 500 }}>
                  Book now <FiArrowRight style={{ verticalAlign: 'middle' }} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseDoctors;
