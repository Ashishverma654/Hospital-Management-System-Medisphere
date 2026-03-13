import { useEffect, useState } from 'react';
import { labReportApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

export default function PatientLabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadReports();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Diagnostics</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Released lab reports</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Only reports that have been internally prepared, payment-cleared, and explicitly released are shown here.
        </p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <article key={report._id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{report.reportName}</p>
                <p className="mt-1 text-sm text-slate-600">{report.reportType || 'Lab report'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Uploaded {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={report.status}>{report.status}</StatusBadge>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a href={report.reportFile} target="_blank" rel="noreferrer" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Open Report
              </a>
            </div>
          </article>
        ))}

        {!loading && reports.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No released lab reports are available yet. Reports appear here only after payment and technician release.
          </div>
        )}
      </div>
    </section>
  );
}
