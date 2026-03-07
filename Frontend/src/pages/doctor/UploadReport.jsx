import { useState, useEffect } from 'react';
import { getDoctorAllAppointments } from '../../services/appointmentService';
import { uploadReport } from '../../services/reportService';
import { FiUpload, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './DoctorPages.css';

const UploadReport = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const handleAptChange = (aptId) => {
    setSelectedApt(aptId);
    const apt = appointments.find((a) => a._id === aptId);
    if (apt) {
      setSelectedPatient(apt.patientId?._id || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedPatient) {
      toast.error('Please select an appointment and a file');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('report', file);
      formData.append('patientId', selectedPatient);
      formData.append('appointmentId', selectedApt);
      await uploadReport(formData);
      toast.success('Report uploaded successfully');
      setFile(null);
      setSelectedApt('');
      setSelectedPatient('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Upload Report</h1>
        <p>Upload medical reports for patients</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Appointment</label>
            <select className="form-input" value={selectedApt} onChange={(e) => handleAptChange(e.target.value)}>
              <option value="">Choose an appointment...</option>
              {appointments.map((apt) => (
                <option key={apt._id} value={apt._id}>
                  {apt.patientId?.name} — {apt.date} ({apt.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Report File</label>
            <label className="upload-zone" htmlFor="report-file-input">
              <div className="upload-zone-icon">
                {file ? <FiFile /> : <FiUpload />}
              </div>
              <h3>{file ? file.name : 'Click to select file'}</h3>
              <p>Supports JPG, PNG, PDF</p>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="report-file-input"
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={uploading}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadReport;
