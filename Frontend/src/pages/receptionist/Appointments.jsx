import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable, LoadingSkeleton, ErrorState, StatusBadge } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatters';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const allAppointments = await appointmentApi.getAll();
      const appointments = Array.isArray(allAppointments) ? allAppointments : [];
      setAppointments(appointments);
      
      // Filter today's appointments
      const today = new Date().toISOString().split('T')[0];
      const today_appointments = appointments.filter(
        (apt) => apt.date && apt.date.startsWith(today)
      );
      setTodayAppointments(today_appointments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      await appointmentApi.complete(appointmentId);
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete appointment');
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      await appointmentApi.cancel(appointmentId);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const displayAppointments = activeTab === 'today' ? todayAppointments : appointments;

  const columns = [
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (time) => <span className="font-mono">{time}</span>,
    },
    {
      key: 'patientId',
      label: 'Patient',
      sortable: true,
      render: (patient) => (
        <div>
          <p className="font-medium">{patient?.userId?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{patient?.userId?.phone || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'doctorId',
      label: 'Doctor',
      render: (doctor) => doctor?.userId?.name || 'N/A',
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (date) => formatDate(date),
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
          {(row.status === 'Scheduled' || row.status === 'Confirmed') && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleComplete(row._id)}
                className="text-xs"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Check-in
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleCancel(row._id)}
                className="text-xs"
              >
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments Queue</h2>
        <p className="text-muted-foreground">Manage appointments and patient check-ins</p>
      </div>

      {error && <ErrorState error={error} />}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayAppointments.filter((a) => a.status === 'Scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">awaiting check-in</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">all appointments</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-border/50">
        <Button
          variant={activeTab === 'today' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('today')}
          className="rounded-none border-b-2"
        >
          <Calendar className="h-4 w-4 mr-2" /> Today ({todayAppointments.length})
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="rounded-none border-b-2"
        >
          All Appointments ({appointments.length})
        </Button>
      </div>

      {/* Appointments Table */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            {activeTab === 'today' ? "Today's Queue" : 'All Appointments'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No appointments found.
            </p>
          ) : (
            <DataTable
              data={displayAppointments}
              columns={columns}
              searchPlaceholder="Search appointments..."
              searchKey="patientId"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
