import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, Users, FileText, Activity, Clock } from 'lucide-react';

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h2>
          <p className="text-muted-foreground">Here is your schedule for today.</p>
        </div>
        <Button className="shadow-md shadow-primary/20" asChild>
          <Link to="/doctor/appointments"><Calendar className="mr-2 h-4 w-4" /> View Full Schedule</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Appointments Today", icon: Calendar, value: "12", sub: "3 remaining" },
          { title: "Total Patients", icon: Users, value: "1,240", sub: "+5 this week" },
          { title: "Pending Reports", icon: FileText, value: "4", sub: "Needs review" },
          { title: "Avg. Consult Time", icon: Clock, value: "18m", sub: "-2m from average" }
        ].map((stat, i) => (
          <Card key={i} className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
             <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:00 AM", name: "Alice Johnson", type: "Follow-up", status: "Waiting" },
                { time: "09:30 AM", name: "Mark Davis", type: "Consultation", status: "Upcoming" },
                { time: "10:15 AM", name: "Sarah Smith", type: "Report Review", status: "Upcoming" },
              ].map((apt, i) => (
                <div key={i} className="flex justify-between items-center border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{apt.name}</span>
                    <span className="text-xs text-muted-foreground">{apt.type} • {apt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs px-2 py-1 rounded-full ${apt.status === 'Waiting' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-primary/10 text-primary'}`}>
                       {apt.status}
                     </span>
                     <Button variant="outline" size="sm">Start</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
             <CardTitle>Recent Patient Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">New Lab Report Uploaded</h4>
                    <p className="text-xs text-muted-foreground">For patient David Wilson. Blood test results.</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    2h ago
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
