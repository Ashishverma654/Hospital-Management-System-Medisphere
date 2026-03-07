import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FileText, Download, Pill, Clock, Stethoscope, Activity, Filter, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// Mock data - will be replaced with API
const prescriptionsData = [
  { id: 'RX-7482', date: '2025-03-15', doctor: 'Dr. Sarah Smith', department: 'Cardiology', diagnosis: 'Mild Hypertension', status: 'Active', medications: [
    { name: 'Lisinopril 10mg', duration: '30 days', dosage: '1 pill daily (morning)' },
    { name: 'Amlodipine 5mg', duration: '30 days', dosage: '1 pill daily (evening)' }
  ]},
  { id: 'RX-7390', date: '2025-02-14', doctor: 'Dr. Emily Chen', department: 'Dermatology', diagnosis: 'Contact Dermatitis', status: 'Completed', medications: [
    { name: 'Hydrocortisone 1% Cream', duration: '7 days', dosage: 'Apply to affected area 2x daily' },
    { name: 'Loratadine 10mg', duration: '14 days', dosage: '1 pill daily as needed for itching' }
  ]},
  { id: 'RX-7123', date: '2025-01-20', doctor: 'Dr. John Doe', department: 'General Medicine', diagnosis: 'Upper Respiratory Infection', status: 'Completed', medications: [
    { name: 'Amoxicillin 500mg', duration: '7 days', dosage: '1 pill 3x daily' }
  ]},
];

const departments = ['All', 'Cardiology', 'Dermatology', 'General Medicine', 'Neurology', 'Pediatrics'];

export default function Prescriptions() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const filteredPrescriptions = useMemo(() => {
    return prescriptionsData.filter((rx) => {
      const rxDate = new Date(rx.date);
      const fromOk = !dateFrom || rxDate >= new Date(dateFrom);
      const toOk = !dateTo || rxDate <= new Date(dateTo);
      const deptOk = departmentFilter === 'All' || rx.department === departmentFilter;
      return fromOk && toOk && deptOk;
    });
  }, [dateFrom, dateTo, departmentFilter]);

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

      <div className="grid gap-6 md:grid-cols-2">
        {filteredPrescriptions.map((rx) => (
          <Card key={rx.id} className="border-2 border-emerald-100 bg-white shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-shadow flex flex-col h-full">
            <CardHeader className="border-b border-emerald-100 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                    <FileText className="h-5 w-5" /> {rx.id}
                  </CardTitle>
                  <CardDescription className="mt-1">Prescribed on {new Date(rx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</CardDescription>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{rx.department}</span>
                </div>
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  rx.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {rx.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-grow space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-muted-foreground">Doctor:</span>
                <span>{rx.doctor}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-4">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-muted-foreground">Diagnosis:</span>
                <span>{rx.diagnosis}</span>
              </div>
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                  <Pill className="h-4 w-4" /> Medications
                </h4>
                {rx.medications.map((med, i) => (
                  <div key={i} className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-100">
                    <div className="font-medium text-sm text-emerald-900 mb-1">{med.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {med.dosage} • For {med.duration}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="p-4 border-t border-emerald-100 bg-emerald-50/50">
              <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-100 text-emerald-800">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>

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
