import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { LoadingSkeleton, ErrorState, DataTable } from '../../components';
import { reportApi, patientApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Upload, FileText, Trash2 } from 'lucide-react';

export default function DoctorReports() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    report: null,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [patientsData, reportsData] = await Promise.all([
        patientApi.getAll(),
        reportApi.getMy(),
      ]);
      setPatients(Array.isArray(patientsData?.data) ? patientsData.data : Array.isArray(patientsData) ? patientsData : []);
      setReports(Array.isArray(reportsData?.data) ? reportsData.data : Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, report: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.report) {
      toast.error('Please select a patient and upload a report');
      return;
    }

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('patientId', formData.patientId);
      if (formData.appointmentId) {
        uploadFormData.append('appointmentId', formData.appointmentId);
      }
      uploadFormData.append('report', formData.report);

      await reportApi.create(uploadFormData);
      toast.success('Report uploaded successfully');
      setFormData({ patientId: '', appointmentId: '', report: null });
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      key: 'patientId',
      label: 'Patient',
      render: (patient) => patient?.userId?.name || 'N/A',
    },
    {
      key: 'createdAt',
      label: 'Uploaded',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'reportUrl',
      label: 'File',
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
          Download
        </a>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Reports</h2>
        <p className="text-muted-foreground">Upload and manage patient medical reports</p>
      </div>

      {error && <ErrorState error={error} />}

      {/* Upload Form */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload New Report
          </CardTitle>
          <CardDescription>Add a medical report for a patient</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patient">
                  Patient <span className="text-red-500">*</span>
                </Label>
                <select
                  id="patient"
                  value={formData.patientId}
                  onChange={(e) =>
                    setFormData({ ...formData, patientId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.userId?.name} ({patient.userId?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment">Appointment ID (Optional)</Label>
                <Input
                  id="appointment"
                  value={formData.appointmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, appointmentId: e.target.value })
                  }
                  placeholder="Enter appointment ID if applicable"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">
                Report File <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                  required
                />
                <label htmlFor="file" className="cursor-pointer">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">
                    {formData.report ? formData.report.name : 'Click to upload or drag file'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                  </p>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full shadow-md shadow-primary/20"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2 border-b-2 border-white w-4 h-4 rounded-full"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" /> Upload Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Your Uploaded Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No reports uploaded yet. Start by uploading a patient report above.
            </p>
          ) : (
            <DataTable
              data={reports}
              columns={columns}
              searchPlaceholder="Search reports..."
              searchKey="patientId"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
