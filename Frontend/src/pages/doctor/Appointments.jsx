import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { StatusBadge, DataTable, LoadingSkeleton, ErrorState } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatters';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';

export default function DoctorAppointments() {
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
      const [todayData, allData] = await Promise.all([
        appointmentApi.getDoctorToday(),
        appointmentApi.getDoctorAll(),
      ]);
      setTodayAppointments(todayData?.appointments || []);
      setAppointments(Array.isArray(allData) ? allData : []);
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
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (date) => formatDate(date),
    },
    {
      key: 'time',
      label: 'Time',
      sortable: true,
    },
    {
      key: 'patientId',
      label: 'Patient',
      sortable: true,
      render: (patient) => patient?.userId?.name || 'N/A',
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
          {row.status === 'Scheduled' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleComplete(row._id)}
                className="text-xs"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Complete
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
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Appointments</h2>
        <p className="text-muted-foreground">Manage your appointment schedule</p>
      </div>

      <div className="flex gap-2 border-b border-border/50">
        <Button
          variant={activeTab === 'today' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('today')}
          className="rounded-none border-b-2"
        >
          <Calendar className="h-4 w-4 mr-2" /> Today's Appointments ({todayAppointments.length})
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="rounded-none border-b-2"
        >
          All Appointments ({appointments.length})
        </Button>
      </div>

      {displayAppointments.length === 0 ? (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No appointments found
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>
              {activeTab === 'today' ? "Today's Schedule" : 'All Appointments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={displayAppointments}
              columns={columns}
              searchPlaceholder="Search appointments..."
              searchKey="patientId"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
