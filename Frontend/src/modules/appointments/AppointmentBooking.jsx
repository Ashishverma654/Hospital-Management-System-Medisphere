import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { departmentApi, doctorApi } from '../../services/apiServices';
import api from '../../lib/api';

const slotToDisplay = (s) => {
  if (!s) return '';
  const [h, m] = s.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const dateToInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
};

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const MotionDiv = motion.div;
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    departmentApi.getAll()
      .then((res) => setDepartments(Array.isArray(res) ? res : []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoadingDepts(false));
  }, []);

  useEffect(() => {
    if (!department) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDoctors([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDoctor(null);
      return;
    }
    setLoadingDoctors(true);
    doctorApi.getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        const filtered = list.filter(
          (d) => d.departmentId?._id === department || d.departmentId?.name === department
        );
        setDoctors(filtered.length ? filtered : list);
      })
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoadingDoctors(false));
  }, [department]);

  useEffect(() => {
    if (!doctor?._id || !date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    api.get(`/doctors/${doctor._id}/slots`, { params: { date } })
      .then((res) => setAvailableSlots(Array.isArray(res.availableSlots) ? res.availableSlots : []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctor?._id, date]);

  useEffect(() => {
    const next14 = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      next14.push(dateToInput(d));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailableDates(next14);
  }, []);

  const handleBook = () => {
    if (!doctor?._id || !date || !time) return;
    setIsSubmitting(true);
    api.post('/appointments', { doctorId: doctor._id, date, slot: time })
      .then(() => {
        setStep(3);
        toast.success('Appointment booked successfully!');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Booking failed'))
      .finally(() => setIsSubmitting(false));
  };

  const doctorName = doctor?.userId?.name || doctor?.name || 'Doctor';

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Book Appointment</h2>
        <p className="text-muted-foreground">Schedule a visit with our specialists.</p>
      </div>

      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 -z-10 h-1 w-full bg-border -translate-y-1/2" />
        <div
          className="absolute top-1/2 -z-10 h-1 bg-primary -translate-y-1/2 transition-all duration-500"
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
        />
        {[1, 2, 3].map((s) => (
          <MotionDiv
            key={s}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                s <= step ? 'bg-primary text-primary-foreground' : 'bg-background border-2 border-primary text-muted-foreground'
              }`}
            >
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <span className="text-xs font-medium mt-2 bg-background px-1 whitespace-nowrap">
              {s === 1 ? 'Specialist' : s === 2 ? 'Schedule' : 'Confirm'}
            </span>
          </MotionDiv>
        ))}
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-md overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <MotionDiv
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <CardHeader>
                <CardTitle>Select Department & Doctor</CardTitle>
                <CardDescription>Choose the specialty and preferred doctor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={department}
                    onValueChange={(v) => {
                      setDepartment(v);
                      setDoctor(null);
                    }}
                    disabled={loadingDepts}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder={loadingDepts ? 'Loading...' : 'Select department'} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {department && (
                  <div className="space-y-2">
                    <Label>Doctor</Label>
                    <Select
                      value={doctor?._id || ''}
                      onValueChange={(id) => setDoctor(doctors.find((d) => d._id === id) || null)}
                      disabled={loadingDoctors}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder={loadingDoctors ? 'Loading...' : 'Select doctor'} />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => (
                          <SelectItem key={d._id} value={d._id}>
                            {d.userId?.name || d.name} – {d.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {doctor && (
                  <div className="flex justify-end">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary font-bold flex items-center gap-1"
                      onClick={() => window.open(`/doctor-profile/${doctor.userId?._id || doctor._id}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" /> View Doctor Profile
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!department || !doctor}>
                  Next Step
                </Button>
              </CardFooter>
            </MotionDiv>
          )}

          {step === 2 && (
            <MotionDiv
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>Choose an available slot for {doctorName}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> Date
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {availableDates.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDate(d)}
                        className={`px-4 py-2 rounded-md border whitespace-nowrap transition-colors outline-none focus:ring-2 focus:ring-primary/20 ${
                          date === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </button>
                    ))}
                  </div>
                </div>
                {date && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {loadingSlots ? 'Loading slots...' : 'Available Times'}
                    </Label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {availableSlots.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTime(t)}
                            className={`py-2 text-sm rounded-md border transition-colors outline-none focus:ring-2 focus:ring-primary/20 ${
                              time === t
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background hover:border-primary/50 hover:bg-primary/5 border-border'
                            }`}
                          >
                            {slotToDisplay(t)}
                          </button>
                        ))}
                      </div>
                    )}
                    {!loadingSlots && availableSlots.length === 0 && date && (
                      <p className="text-sm text-muted-foreground">No slots available this day.</p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border/50 pt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleBook} disabled={!date || !time || isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm Booking
                </Button>
              </CardFooter>
            </MotionDiv>
          )}

          {step === 3 && (
            <MotionDiv
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center text-center space-y-4"
            >
              <MotionDiv
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="w-8 h-8" />
              </MotionDiv>
              <h3 className="text-2xl font-bold text-foreground">Booking Confirmed!</h3>
              <p className="text-muted-foreground max-w-md">
                Your appointment with <span className="font-semibold text-foreground">{doctorName}</span> has been
                scheduled for{' '}
                <span className="font-semibold text-foreground">
                  {date && new Date(date).toLocaleDateString('en-US')} at {slotToDisplay(time)}
                </span>
                .
              </p>
              <div className="pt-6 flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setDepartment('');
                    setDoctor(null);
                    setDate('');
                    setTime('');
                  }}
                >
                  Book Another
                </Button>
                <Button onClick={() => navigate('/patient')}>Go to Dashboard</Button>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </Card>
    </MotionDiv>
  );
}
