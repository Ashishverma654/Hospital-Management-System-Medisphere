import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Sample data
const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'];
const doctorsByDept = {
  Cardiology: ['Dr. Sarah Smith', 'Dr. John Heart'],
  Neurology: ['Dr. Mark Brain', 'Dr. Lisa Nerve'],
  Orthopedics: ['Dr. James Bone', 'Dr. Anna Joint'],
  Pediatrics: ['Dr. Emily Child', 'Dr. Robert Baby'],
  'General Medicine': ['Dr. William General', 'Dr. Nancy Care']
};
const dates = ['Oct 24, 2023', 'Oct 25, 2023', 'Oct 26, 2023', 'Oct 27, 2023'];
const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBook = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
      toast.success('Appointment booked successfully!');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Book Appointment</h2>
        <p className="text-muted-foreground">Schedule a visit with our specialists.</p>
      </div>

      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 -z-10 h-1 w-full bg-border -translate-y-1/2"></div>
        <div className="absolute top-1/2 -z-10 h-1 bg-primary -translate-y-1/2 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {[1, 2, 3].map(s => (
          <div key={s} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s <= step ? 'bg-primary text-primary-foreground' : 'bg-background border-2 border-primary text-muted-foreground'} transition-colors duration-300`}>
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <span className="text-xs font-medium mt-2 bg-background px-1 whitespace-nowrap">
              {s === 1 ? 'Specialist' : s === 2 ? 'Schedule' : 'Confirm'}
            </span>
          </div>
        ))}
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-md">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Select Department & Doctor</CardTitle>
              <CardDescription>Choose the specialty and preferred doctor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={(v) => { setDepartment(v); setDoctor(''); }}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {department && (
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select value={doctor} onValueChange={setDoctor}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsByDept[department].map(doc => (
                        <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!department || !doctor}>Next Step</Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>Choose an available slot for {doctor}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Available Dates</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {dates.map(d => (
                    <button 
                      key={d}
                      onClick={() => setDate(d)}
                      className={`px-4 py-2 rounded-md border whitespace-nowrap transition-colors outline-none focus:ring-2 focus:ring-primary/20 ${date === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {date && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Available Times</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {timeSlots.map(t => {
                      const isBooked = t === '10:00 AM' || t === '02:00 PM';
                      return (
                        <button 
                          key={t}
                          disabled={isBooked}
                          onClick={() => setTime(t)}
                          className={`py-2 text-sm rounded-md border transition-colors outline-none focus:ring-2 focus:ring-primary/20 ${
                            isBooked ? 'opacity-50 cursor-not-allowed bg-muted border-border text-muted-foreground' : 
                            time === t ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 
                            'bg-background hover:border-primary/50 hover:bg-primary/5 border-border'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/50 pt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleBook} disabled={!date || !time || isSubmitting}>
                {isSubmitting ? <span className="animate-spin mr-2 border-b-2 border-white w-4 h-4 rounded-full"></span> : null}
                Confirm Booking
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <CardContent className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Booking Confirmed!</h3>
            <p className="text-muted-foreground max-w-md">
              Your appointment with <span className="font-semibold text-foreground">{doctor}</span> has been scheduled for <span className="font-semibold text-foreground">{date} at {time}</span>.
            </p>
            <div className="pt-6 flex gap-4">
              <Button variant="outline" onClick={() => {setStep(1); setDepartment(''); setDoctor(''); setDate(''); setTime('');}}>Book Another</Button>
              <Button onClick={() => navigate('/patient')}>Go to Dashboard</Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
