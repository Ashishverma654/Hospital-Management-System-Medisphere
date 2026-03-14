import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { FormDialog, LoadingSkeleton, ErrorState } from '../../components';
import { availabilityApi } from '../../services/apiServices';
import { useAuth } from '../../hooks';
import { toast } from 'sonner';
import { Clock, Plus, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAvailabilities();
    }
  }, [user?.id]);

  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await availabilityApi.getByDoctor(user.id);
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const submitData = {
        ...formData,
        doctorId: user.id,
      };
      await availabilityApi.create(submitData);
      toast.success('Availability updated successfully');
      setShowForm(false);
      setEditingId(null);
      fetchAvailabilities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save availability');
    }
  };

  const formFields = [
    {
      name: 'dayOfWeek',
      label: 'Day of Week',
      type: 'select',
      required: true,
      options: DAYS_OF_WEEK,
    },
    {
      name: 'startTime',
      label: 'Start Time (HH:MM)',
      type: 'time',
      required: true,
      placeholder: '09:00',
    },
    {
      name: 'endTime',
      label: 'End Time (HH:MM)',
      type: 'time',
      required: true,
      placeholder: '17:00',
    },
    {
      name: 'slotDuration',
      label: 'Slot Duration (minutes)',
      type: 'number',
      required: true,
      placeholder: '30',
    },
  ];

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Availability</h2>
          <p className="text-muted-foreground">Set your working hours and appointment slots</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Schedule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {DAYS_OF_WEEK.map((day) => {
          const dayAvailability = availabilities.find((a) => a.dayOfWeek === day);
          return (
            <Card key={day} className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayAvailability ? (
                  <>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">
                        {dayAvailability.startTime} - {dayAvailability.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Slot: {dayAvailability.slotDuration} mins
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs"
                      onClick={() => {
                        setEditingId(dayAvailability._id);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Not available
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FormDialog
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        title={editingId ? 'Edit Schedule' : 'Add New Schedule'}
        description="Set your availability for this day"
        fields={formFields}
      />

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
          <CardDescription>
            You have availability set for {availabilities.length} day(s) per week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availabilities.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No availability set. Add your working hours to accept appointments.
            </p>
          ) : (
            <div className="space-y-2">
              {availabilities.map((avail) => (
                <div key={avail._id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium text-sm">{avail.dayOfWeek}</p>
                    <p className="text-xs text-muted-foreground">
                      {avail.startTime} - {avail.endTime} ({avail.slotDuration} min slots)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
