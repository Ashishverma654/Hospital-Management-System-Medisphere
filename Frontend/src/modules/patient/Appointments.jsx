import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Calendar, Clock, User, Building2, FileText, ChevronDown, ChevronUp, Plus } from 'lucide-react';

// Mock data - replace with API call when backend is ready
const MOCK_APPOINTMENTS = [
  {
    id: 'APT-2024-001',
    date: '2024-03-15',
    time: '09:30 AM',
    doctor: 'Dr. Sarah Smith',
    doctorSpecialization: 'Cardiologist',
    department: 'Cardiology',
    status: 'Completed',
    diagnosis: 'Mild hypertension. Blood pressure readings elevated. Recommended lifestyle modifications and follow-up in 3 months.',
    notes: 'Patient advised to reduce sodium intake and increase physical activity.',
    prescriptionId: 'RX-7482',
  },
  {
    id: 'APT-2024-002',
    date: '2024-03-20',
    time: '02:00 PM',
    doctor: 'Dr. Emily Chen',
    doctorSpecialization: 'Dermatologist',
    department: 'Dermatology',
    status: 'Upcoming',
    diagnosis: null,
    notes: null,
    prescriptionId: null,
  },
  {
    id: 'APT-2024-003',
    date: '2024-02-28',
    time: '10:15 AM',
    doctor: 'Dr. John Doe',
    doctorSpecialization: 'General Physician',
    department: 'General Medicine',
    status: 'Completed',
    diagnosis: 'Seasonal allergies. Prescribed antihistamines. No serious concerns.',
    notes: 'Follow-up only if symptoms persist beyond 2 weeks.',
    prescriptionId: 'RX-7390',
  },
  {
    id: 'APT-2024-004',
    date: '2024-01-10',
    time: '11:00 AM',
    doctor: 'Dr. Mark Brain',
    doctorSpecialization: 'Neurologist',
    department: 'Neurology',
    status: 'Completed',
    diagnosis: 'Tension headache. Recommended stress management and over-the-counter pain relief.',
    notes: 'MRI not required at this time.',
    prescriptionId: null,
  },
];

const statusColors = {
  Completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  Upcoming: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  Cancelled: 'bg-red-500/15 text-red-600 border-red-500/30',
  'No Show': 'bg-slate-500/15 text-slate-600 border-slate-500/30',
};

export default function Appointments() {
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = [...new Set(MOCK_APPOINTMENTS.map((a) => a.department))];
  const filteredAppointments = MOCK_APPOINTMENTS.filter((apt) => {
    const matchStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchDept = filterDept === 'all' || apt.department === filterDept;
    const matchSearch =
      !searchQuery ||
      apt.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Appointments
          </h2>
          <p className="text-muted-foreground mt-1">
            View all your booked appointments with dates, doctors, and diagnosis reports.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/25" asChild>
          <Link to="/patient/book">
            <Plus className="mr-2 h-4 w-4" /> Book New Appointment
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-2 border-primary/10 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter appointments by status, department, or search</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by doctor, department, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/80"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-4 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="h-10 px-4 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto text-primary/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or book a new appointment.</p>
              <Button asChild>
                <Link to="/patient/book">Book Appointment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((apt) => (
            <Card
              key={apt.id}
              className="overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all duration-200 bg-gradient-to-br from-card to-primary/5"
            >
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-semibold text-primary">{apt.id}</span>
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[apt.status] || 'bg-muted text-muted-foreground'}`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-primary" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                          {apt.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-primary" />
                          {apt.doctor}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-primary" />
                          {apt.department}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status === 'Completed' && apt.prescriptionId && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/patient/prescriptions">View Prescription</Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        {expandedId === apt.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedId === apt.id && (
                  <div className="border-t border-primary/10 bg-primary/5 px-6 py-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Doctor Details
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {apt.doctor} — {apt.doctorSpecialization}
                      </p>
                    </div>
                    {apt.diagnosis && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Diagnosis Report
                        </h4>
                        <p className="text-sm bg-background/80 p-4 rounded-lg border border-primary/10">
                          {apt.diagnosis}
                        </p>
                      </div>
                    )}
                    {apt.notes && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Clinical Notes</h4>
                        <p className="text-sm text-muted-foreground bg-background/80 p-4 rounded-lg border">
                          {apt.notes}
                        </p>
                      </div>
                    )}
                    {apt.prescriptionId && (
                      <div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/patient/prescriptions">
                            View Prescription {apt.prescriptionId}
                          </Link>
                        </Button>
                      </div>
                    )}
                    {apt.status === 'Upcoming' && (
                      <p className="text-sm text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                        Your appointment is scheduled. Please arrive 15 minutes early.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
