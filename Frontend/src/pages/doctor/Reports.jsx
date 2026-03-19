import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { LoadingSkeleton, ErrorState, DataTable } from '../../components';
import { labReportApi, appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { FileText, RefreshCw } from 'lucide-react';

export default function DoctorReports() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  const loadPatients = async () => {
    try {
      const data = await appointmentApi.getDoctorAll();
      const list = Array.isArray(data) ? data : data?.data || [];
      const map = new Map();
      list.forEach((appointment) => {
        const patient = appointment.patientId;
        const id = patient?._id || patient;
        if (!id || map.has(String(id))) return;
        map.set(String(id), {
          id: String(id),
          name: patient?.name || patient?.userId?.name || 'Patient',
          patientId: patient?.patientId || patient?.userId?.patientId || '',
        });
      });
      const options = Array.from(map.values());
      setPatients(options);
      if (!selectedPatientId && options.length) {
        setSelectedPatientId(options[0].id);
      }
    } catch {
      setPatients([]);
    }
  };

  const loadReports = async (target) => {
    if (!target) {
      setReports([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await labReportApi.getByPatient(target);
      setReports(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lab reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!patientQuery && selectedPatientId) {
      loadReports(selectedPatientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  const activeTarget = patientQuery.trim() || selectedPatientId;

  const columns = useMemo(
    () => [
      {
        key: 'reportName',
        label: 'Report',
        render: (name, row) => name || row.reportType || 'Lab report',
      },
      {
        key: 'createdAt',
        label: 'Date',
        render: (date) => (date ? new Date(date).toLocaleDateString() : '—'),
      },
      {
        key: 'reportFile',
        label: 'File',
        render: (url) =>
          url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
              Download
            </a>
          ) : (
            '—'
          ),
      },
    ],
    []
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patient Lab Reports</h2>
        <p className="text-muted-foreground">
          View lab reports for your assigned patients. Uploads are handled by the lab team.
        </p>
      </div>

      {error && <ErrorState error={error} onRetry={() => loadReports(activeTarget)} />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">For selected patient</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patients on file</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">With appointments</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports[0]?.createdAt ? new Date(reports[0].createdAt).toLocaleDateString() : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most recent entry</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Filter reports
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Patient</label>
            <select
              value={selectedPatientId}
              onChange={(event) => {
                setPatientQuery('');
                setSelectedPatientId(event.target.value);
              }}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} {patient.patientId ? `(${patient.patientId})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Search by Patient ID or Email</label>
            <Input
              value={patientQuery}
              onChange={(event) => setPatientQuery(event.target.value)}
              placeholder="Enter patient ID or email"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => loadReports(activeTarget)}
              className="gap-2"
              disabled={!activeTarget}
            >
              <RefreshCw className="h-4 w-4" />
              Load Reports
            </Button>
            <Button type="button" variant="outline" onClick={loadPatients}>
              Refresh Patients
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No lab reports found for the selected patient.
            </p>
          ) : (
            <DataTable
              data={reports}
              columns={columns}
              searchPlaceholder="Search reports..."
              searchKey="reportName"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
