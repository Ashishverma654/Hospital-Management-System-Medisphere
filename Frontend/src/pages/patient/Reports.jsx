import { useState, useEffect } from 'react';
import { getMyReports } from '../../services/reportService';
import { FiFile, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PatientPages.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyReports();
        setReports(data);
      } catch (err) {
        toast.error('Failed to load reports');
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
        <h1>My Reports</h1>
        <p>Access your medical reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No reports available</h3>
          <p>Reports uploaded by your doctors will appear here</p>
        </div>
      ) : (
        <div>
          {reports.map((report) => (
            <div key={report._id} className="report-card">
              <div className="report-info">
                <div className="report-icon">
                  <FiFile />
                </div>
                <div className="report-details">
                  <h4>{report.reportName || 'Medical Report'}</h4>
                  <p>{new Date(report.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <a
                href={report.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <FiDownload /> View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
