import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, FileText, Activity, CreditCard, Clock, Video, ArrowRight } from 'lucide-react';

// Mock dynamic data - will be replaced with API data later
const dashboardStats = {
  upcomingVisits: 2,
  nextAppointment: { date: 'Mar 15, 2025', time: '09:30 AM', doctor: 'Dr. Sarah Smith' },
  activePrescriptions: 2,
  labReportsCount: 4,
  pendingBills: 45.0,
  billsDueIn: 5,
};

const recentAppointments = [
  { id: 'APT-001', date: 'Mar 10, 2025', doc: 'Dr. Sarah Smith', dept: 'Cardiology', status: 'Completed', diagnosis: 'Routine check-up, vitals normal' },
  { id: 'APT-002', date: 'Feb 28, 2025', doc: 'Dr. John Doe', dept: 'General Medicine', status: 'Completed', diagnosis: 'Flu symptoms, prescribed rest' },
  { id: 'APT-003', date: 'Feb 15, 2025', doc: 'Dr. Emily Chen', dept: 'Dermatology', status: 'Completed', diagnosis: 'Skin allergy, topical treatment' },
];

const currentMedications = [
  { name: 'Lisinopril 10mg', dosage: '1 pill daily (morning)', doc: 'Dr. Sarah Smith' },
  { name: 'Amlodipine 5mg', dosage: '1 pill daily (evening)', doc: 'Dr. Sarah Smith' },
];

export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-violet-600 to-accent bg-clip-text text-transparent">
            Patient Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Manage your health, appointments, and records.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button className="shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90" asChild>
            <Link to="/patient/book"><Calendar className="mr-2 h-4 w-4" /> Book Appointment</Link>
          </Button>
          <Button variant="outline" className="border-2 border-violet-200 hover:bg-violet-50 hover:border-violet-300" asChild>
            <Link to="/patient/telemedicine"><Video className="mr-2 h-4 w-4" /> Teleconsultation</Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats - Dynamic */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/patient/appointments">
          <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Visits</CardTitle>
              <Calendar className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{dashboardStats.upcomingVisits}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Next: {dashboardStats.nextAppointment.date} at {dashboardStats.nextAppointment.time}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/patient/prescriptions">
          <Card className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-200/50 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Prescriptions</CardTitle>
              <FileText className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{dashboardStats.activePrescriptions}</div>
              <p className="text-xs text-muted-foreground mt-1 cursor-pointer hover:text-emerald-600 transition-colors">View details</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/patient/reports">
          <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-200/50 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lab Reports</CardTitle>
              <Activity className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{dashboardStats.labReportsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">All results available</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/patient/bills">
          <Card className="bg-gradient-to-br from-rose-500/5 to-pink-500/5 border-rose-200/50 hover:border-rose-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
              <CreditCard className="h-5 w-5 text-rose-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">${dashboardStats.pendingBills.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Due in {dashboardStats.billsDueIn} days</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white/80 backdrop-blur-sm border-2 border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Appointment History</CardTitle>
              <CardDescription>Your recent visits across all departments</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/patient/appointments" className="flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((visit) => (
                <div key={visit.id} className="flex justify-between items-start border-b border-border/50 pb-4 last:border-0 last:pb-0 gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-primary">{visit.doc}</span>
                    <span className="text-xs text-muted-foreground">{visit.dept} • {visit.date}</span>
                    {visit.diagnosis && (
                      <span className="text-xs text-muted-foreground mt-1 italic">{visit.diagnosis}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {visit.status}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/patient/appointments">View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg shadow-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Current Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentMedications.map((med, i) => (
                <div key={i} className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="font-semibold text-sm text-emerald-800 mb-1">{med.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center mb-1">
                    <Clock className="h-3 w-3 mr-1" /> {med.dosage}
                  </div>
                  <div className="text-xs text-muted-foreground">Prescribed by: {med.doc}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-emerald-200 hover:bg-emerald-50" asChild>
              <Link to="/patient/prescriptions">View All Prescriptions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
