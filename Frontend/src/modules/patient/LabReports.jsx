import { useState, useMemo, useRef, useEffect } from 'react';

import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, Download, UploadCloud, Filter, FileText, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import { labReportApi } from '../../services/apiServices';

const departments = ['All', 'Pathology', 'Radiology', 'Cardiology', 'Neurology'];

export default function LabReports() {
  const [reportsData, setReportsData] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [testFilter, setTestFilter] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    labReportApi
      .getMy()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setReportsData(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load reports'));
  }, []);

  const filteredReports = useMemo(() => {
    return reportsData.filter((r) => {
      const rDate = new Date(r.createdAt || r.date);
      const fromOk = !dateFrom || rDate >= new Date(dateFrom);
      const toOk = !dateTo || rDate <= new Date(dateTo);
      const deptOk = departmentFilter === 'All' || (r.reportType || r.dept) === departmentFilter;
      const testOk = testFilter === 'All' || (r.reportName || r.name) === testFilter;
      return fromOk && toOk && deptOk && testOk;
    });
  }, [reportsData, dateFrom, dateTo, departmentFilter, testFilter]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDepartmentFilter('All');
    setTestFilter('All');
  };

  const handleFileSelect = (files) => {
    if (!files?.length) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('reportFile', files[0]);
    formData.append('reportName', files[0].name);
    formData.append('reportType', 'Lab');
    labReportApi
      .upload(formData)
      .then(() => {
        toast.success('Report uploaded successfully.');
        return labReportApi.getMy();
      })
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setReportsData(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Upload failed'))
      .finally(() => setIsUploading(false));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Lab Reports
          </h2>
          <p className="text-muted-foreground mt-1">View, download, and upload your diagnostic test results.</p>
        </div>
        <Button
          variant="outline"
          className="border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Report
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(e) => handleFileSelect(e.target.files)} />
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-2 border-amber-100 shadow-lg shadow-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-900">Filter Reports</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 border-amber-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 border-amber-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40 border-amber-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Test Name</Label>
              <Select value={testFilter} onValueChange={setTestFilter}>
                <SelectTrigger className="w-56 border-amber-200 bg-white">
                  <SelectValue placeholder="Test name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {[...new Set(reportsData.map((r) => r.reportName || r.name).filter(Boolean))].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="self-end border-amber-200 hover:bg-amber-50">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-amber-100 bg-white shadow-lg shadow-amber-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-amber-50/80">
              <TableRow className="border-amber-100">
                <TableHead className="w-[100px] font-semibold text-amber-900">Report ID</TableHead>
                <TableHead className="font-semibold text-amber-900">Test Name</TableHead>
                <TableHead className="font-semibold text-amber-900">Department</TableHead>
                <TableHead className="font-semibold text-amber-900">Date</TableHead>
                <TableHead className="font-semibold text-amber-900">Status</TableHead>
                <TableHead className="text-right font-semibold text-amber-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report._id} className="border-amber-50">
                  <TableCell className="font-semibold text-amber-700">{report._id?.slice(-8) || report.id}</TableCell>
                  <TableCell>{report.reportName || report.name}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">{report.reportType || report.dept || '—'}</span></TableCell>
                  <TableCell>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : report.date}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">
                      Available
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title="View">
                      <Eye className="h-4 w-4 text-amber-600" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Download" onClick={() => report.reportFile && window.open(report.reportFile, '_blank')}>
                      <Download className="h-4 w-4 text-amber-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {filteredReports.length === 0 && (
        <Card className="border-2 border-dashed border-amber-200 bg-amber-50/30 p-12 text-center">
          <FileText className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No reports match your filters</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">Clear Filters</Button>
        </Card>
      )}

      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragOver ? 'border-amber-400 bg-amber-50' : 'border-amber-200 bg-amber-50/30'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className={`p-4 rounded-full mb-4 transition-colors ${isDragOver ? 'bg-amber-200' : 'bg-amber-100'}`}>
            <UploadCloud className="h-10 w-10 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Upload External Reports</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Drag and drop your PDF or image files here, or click the button above to browse.
          </p>
          <Button
            variant="secondary"
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
                Uploading...
              </span>
            ) : (
              'Browse Files'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
