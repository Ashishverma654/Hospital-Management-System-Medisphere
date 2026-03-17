import { useEffect, useState } from 'react';
import { labReportApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import { Button } from '../../components/ui/button.jsx';
import { UploadCloud } from 'lucide-react';

export default function PatientLabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    reportName: '',
    reportType: '',
    reportFile: null,
  });

  const loadReports = async () => {
    try {
      const data = await labReportApi.getMy();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load lab reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.reportFile) {
      toast.error('Please attach a lab report file.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('reportFile', uploadForm.reportFile);
      if (uploadForm.reportName) formData.append('reportName', uploadForm.reportName);
      if (uploadForm.reportType) formData.append('reportType', uploadForm.reportType);
      await labReportApi.upload(formData);
      toast.success('Lab report uploaded successfully.');
      setUploadForm({ reportName: '', reportType: '', reportFile: null });
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to upload lab report.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Diagnostics</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Released lab reports</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          View your hospital lab reports and upload any external reports from other clinics for your care team to review.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Upload external report</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Add lab reports done outside</h3>
          </div>
        </div>
        <form onSubmit={handleUpload} className="mt-4 grid gap-4 md:grid-cols-[1.2fr,1fr,1fr]">
          <input
            type="text"
            placeholder="Report name (e.g., CBC, Lipid Profile)"
            value={uploadForm.reportName}
            onChange={(e) => setUploadForm((c) => ({ ...c, reportName: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Report type (optional)"
            value={uploadForm.reportType}
            onChange={(e) => setUploadForm((c) => ({ ...c, reportType: e.target.value }))}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
            <span className="truncate">
              {uploadForm.reportFile?.name || 'Attach report file (PDF, PNG, JPG)'}
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setUploadForm((c) => ({ ...c, reportFile: e.target.files?.[0] || null }))}
              className="hidden"
            />
            <UploadCloud className="h-4 w-4" />
          </label>
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" disabled={uploading} className="px-6">
              {uploading ? 'Uploading…' : 'Upload report'}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <article key={report._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{report.reportName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{report.reportType || 'Lab report'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={report.status}>{report.status}</StatusBadge>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {report.reportFile ? (
                <a
                  href={report.reportFile}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open Report
                </a>
              ) : (
                <span className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">
                  Report file pending
                </span>
              )}
            </div>
          </article>
        ))}

        {!loading && reports.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No lab reports are available yet. Upload an external report or check back after your hospital tests are released.
          </div>
        )}
      </div>
    </motion.section>
  );
}
