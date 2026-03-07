import { useState, useEffect } from 'react';
import { getMyPrescriptions } from '../../services/prescriptionService';
import { FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PatientPages.css';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyPrescriptions();
        setPrescriptions(data);
      } catch (err) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Prescriptions</h1>
        <p>View your medical prescriptions</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <h3>No prescriptions yet</h3>
          <p>Prescriptions will appear here after doctor consultations</p>
        </div>
      ) : (
        <div>
          {prescriptions.map((rx) => (
            <div key={rx._id} className="prescription-card">
              <div className="prescription-card-header">
                <div>
                  <h4><FiFileText style={{ marginRight: 8 }} />{rx.diagnosis || 'No diagnosis'}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(rx.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {rx.medicines && rx.medicines.length > 0 && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-sm)', display: 'block' }}>
                    Medicines
                  </label>
                  <div className="medicine-list">
                    {rx.medicines.map((med, idx) => (
                      <div key={idx} className="medicine-item">
                        <span className="med-name">{med.name}</span>
                        <span className="med-detail">{med.dosage}</span>
                        <span className="med-detail">{med.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rx.notes && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  📝 {rx.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
