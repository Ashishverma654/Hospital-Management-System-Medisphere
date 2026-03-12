import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar, Users, Activity, FilePlus, UserPlus, CreditCard } from 'lucide-react';
import { Input } from '../../components/ui/input';

export default function ReceptionistDashboard() {
  const { user } = useSelector(state => state.auth);
  const isSuper = user?.role === 'superreceptionist';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Front Desk Dashboard</h2>
          <p className="text-muted-foreground">Manage incoming patients, appointments, and quick billing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button className="shadow-md shadow-primary/20" asChild>
            <Link to="/receptionist/register"><UserPlus className="mr-2 h-4 w-4" /> Register Patient</Link>
          </Button>
          <Button variant="secondary" className="bg-secondary/20 text-secondary hover:bg-secondary/30" asChild>
            <Link to="/receptionist/appointments"><Calendar className="mr-2 h-4 w-4" /> New Booking</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Patients Waiting", icon: Users, value: "14", trend: "Normal influx" },
          { title: "Bookings Today", icon: Calendar, value: "48", trend: "12 unconfirmed" },
          { title: "Registrations", icon: FilePlus, value: "8", trend: "+2 from yesterday" },
          { title: "Bills Collected", icon: CreditCard, value: "$2,450", trend: "14 transactions" }
        ].map((stat, i) => (
          <Card key={i} className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 cursor-pointer">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Today's Appointments Queue</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="text" placeholder="Search patient name..." className="h-8" />
              <Button type="button" size="sm" variant="ghost">Search</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:00 AM", name: "Alice Johnson", doc: "Dr. Smith (Cardiology)", status: "Completed" },
                { time: "09:30 AM", name: "Mark Davis", doc: "Dr. Lee (Neurology)", status: "Waiting" },
                { time: "10:00 AM", name: "Emma Wilson", doc: "Dr. Chu (Pediatrics)", status: "In Consultation" },
                { time: "10:15 AM", name: "Sarah Smith", doc: "Dr. Smith (Cardiology)", status: "Upcoming" },
              ].map((apt, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-primary">{apt.name}</span>
                    <span className="text-xs text-muted-foreground">{apt.doc}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm whitespace-nowrap">
                     <span className="font-medium">{apt.time}</span>
                     <span className={`text-xs px-2 py-1 rounded-full w-24 text-center
                        ${apt.status === 'Waiting' ? 'bg-yellow-500/10 text-yellow-600' : ''}
                        ${apt.status === 'Completed' ? 'bg-green-500/10 text-green-600' : ''}
                        ${apt.status === 'In Consultation' ? 'bg-blue-500/10 text-blue-600' : ''}
                        ${apt.status === 'Upcoming' ? 'bg-muted text-muted-foreground' : ''}
                     `}>
                       {apt.status}
                     </span>
                     <Button variant="outline" size="sm" className="hidden sm:inline-flex">Process</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader>
               <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                 <Button variant="outline" className="w-full justify-start text-left bg-background/50 backdrop-blur-sm">
                   <CreditCard className="mr-2 h-4 w-4 text-primary" /> Quick Billing
                 </Button>
                 <Button variant="outline" className="w-full justify-start text-left bg-background/50 backdrop-blur-sm">
                   <Calendar className="mr-2 h-4 w-4 text-primary" /> Check Availabilities
                 </Button>
                 <Button variant="outline" className="w-full justify-start text-left bg-background/50 backdrop-blur-sm shadow-sm border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive">
                   <Activity className="mr-2 h-4 w-4" /> Emergency Dispatch
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
