import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { StatusBadge, DataTable, LoadingSkeleton, ErrorState } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Calendar, Clock, User, Play, Eye } from 'lucide-react';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingConsultation, setStartingConsultation] = useState(null);

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentApi.getDoctorToday();
      setTodayAppointments(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      setStartingConsultation(appointmentId);
      await appointmentApi.startConsultation(appointmentId);
      toast.success('Consultation started');
      fetchTodayAppointments();
      // Redirect to patient summary
      navigate(`/doctor/appointments/${appointmentId}/summary`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start consultation');
    } finally {
      setStartingConsultation(null);
    }
  };

  const columns = [
    {
      key: 'slot',
      label: 'Time',
      sortable: true,
      render: (slot) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {slot}
        </div>
      ),
    },
    {
      key: 'patientId',
      label: 'Patient',
      sortable: true,
      render: (patient) => (
        <div className="flex flex-col">
          <span className="font-medium">{patient?.name || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{patient?.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'patientProfileId',
      label: 'Age / Gender',
      render: (profile) => (
        <div className="text-sm">
          {profile?.age ? `${profile.age}y` : 'N/A'} / {profile?.gender || 'N/A'}
        </div>
      ),
    },
    {
      key: 'consultationMode',
      label: 'Mode',
      render: (mode) => (
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
          {mode || 'In-person'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {['booked', 'confirmed', 'arrived', 'checked-in'].includes(row.status) && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStartConsultation(row._id)}
              disabled={startingConsultation === row._id}
              className="text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              {startingConsultation === row._id ? 'Starting...' : 'Start'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/doctor/appointments/${row._id}/summary`)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  const _completed = todayAppointments.filter((a) => a.status === 'completed').length;
  const _inProgress = todayAppointments.filter((a) =>
    ['arrived', 'checked-in', 'inConsultation'].includes(a.status)
  ).length;
  const _pending = todayAppointments.filter((a) =>
    ['booked', 'confirmed'].includes(a.status)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Today's Appointments</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Button variant="outline" onClick={fetchTodayAppointments}>
          <Calendar className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{_pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{_completed}</div>
          </CardContent>
        </Card>
      </div>

      {error && <ErrorState error={error} onRetry={fetchTodayAppointments} />}

      {/* Appointments Table */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Appointments Queue ({todayAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No appointments scheduled for today</p>
            </div>
          ) : (
            <DataTable
              data={todayAppointments}
              columns={columns}
              keyField="_id"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
