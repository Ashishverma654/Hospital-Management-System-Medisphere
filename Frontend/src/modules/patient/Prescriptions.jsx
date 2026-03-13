import { useState, useMemo, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FileText, Download, Pill, Clock, Stethoscope, Activity, Filter, Calendar, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { prescriptionApi } from '../../services/apiServices';
import { toast } from 'sonner';

const departments = ['All', 'Cardiology', 'Dermatology', 'General Medicine', 'Neurology', 'Pediatrics'];

export default function Prescriptions() {
  const [prescriptionsData, setPrescriptionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    prescriptionApi
      .getMy()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? (res.data?.prescriptions ? res.data.prescriptions : []);
        setPrescriptionsData(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPrescriptions = useMemo(() => {
    return prescriptionsData.filter((rx) => {
      const rxDate = new Date(rx.createdAt || rx.date);
      const fromOk = !dateFrom || rxDate >= new Date(dateFrom);
      const toOk = !dateTo || rxDate <= new Date(dateTo);
      const dept = rx.doctorId?.departmentId?.name || rx.department;
      const deptOk = departmentFilter === 'All' || dept === departmentFilter;
      return fromOk && toOk && deptOk;
    });
  }, [prescriptionsData, dateFrom, dateTo, departmentFilter]);

  const handleDownloadPdf = (id) => {
    prescriptionApi
      .downloadPdf(id)
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Download started');
      })
      .catch(() => toast.error('Download failed'));
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDepartmentFilter('All');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Prescriptions
        </h2>
        <p className="text-muted-foreground mt-1">All prescriptions written by your doctors. Filter by date and department.</p>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-2 border-emerald-100 shadow-lg shadow-emerald-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" /> Filters
          </CardTitle>
          <CardDescription>Filter prescriptions by date range and department</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" /> From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 border-emerald-200" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" /> To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 border-emerald-200" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48 border-emerald-200 bg-white">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters} className="self-end border-emerald-200 hover:bg-emerald-50">
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        {filteredPrescriptions.map((rx, idx) => (
          <motion.div
            key={rx._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="border-2 border-emerald-100 bg-white shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-shadow flex flex-col h-full">
              <CardHeader className="border-b border-emerald-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                      <FileText className="h-5 w-5" /> {rx._id?.slice(-8) || rx.id}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Prescribed on {new Date(rx.createdAt || rx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </CardDescription>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {rx.doctorId?.departmentId?.name || rx.department || '—'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-grow space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-muted-foreground">Doctor:</span>
                  <span>{rx.doctorId?.userId?.name || rx.doctor || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-muted-foreground">Diagnosis:</span>
                  <span>{rx.diagnosis || '—'}</span>
                </div>
                <div className="space-y-3 mt-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                    <Pill className="h-4 w-4" /> Medications
                  </h4>
                  {(rx.medicines || rx.medications || []).map((med, i) => (
                    <div key={i} className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-100">
                      <div className="font-medium text-sm text-emerald-900 mb-1">{med.name || med.medicineName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {med.dosage || med.dose} • For {med.duration || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="p-4 border-t border-emerald-100 bg-emerald-50/50">
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 hover:bg-emerald-100 text-emerald-800"
                  onClick={() => handleDownloadPdf(rx._id)}
                >
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      )}

      {filteredPrescriptions.length === 0 && (
        <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-12 text-center">
          <FileText className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No prescriptions match your filters</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your date range or department</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">Clear Filters</Button>
        </Card>
      )}
    </div>
  );
}
