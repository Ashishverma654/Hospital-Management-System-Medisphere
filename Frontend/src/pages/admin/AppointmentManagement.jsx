import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { DataTable, ConfirmDialog, ErrorState, LoadingSkeleton, StatusBadge } from '../../components';
import { appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatters';

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_showDelete, _setShowDelete] = useState(false);
  const [_selectedApt, _setSelectedApt] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentApi.getAll();
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await appointmentApi.cancel(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleComplete = async (id) => {
    try {
      await appointmentApi.complete(id);
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch {
      toast.error('Failed to complete appointment');
    }
  };

  const columns = [
    {
      key: 'patientId',
      label: 'Patient',
      sortable: true,
      render: (patientId) => patientId?.name || 'N/A',
    },
    {
      key: 'doctorId',
      label: 'Doctor',
      sortable: true,
      render: (doctorId) => doctorId?.userId?.name || 'N/A',
    },
    { key: 'date', label: 'Date', render: (date) => formatDate(date, 'date') },
    { key: 'slot', label: 'Time Slot', sortable: true },
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
          {row.status === 'booked' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleComplete(row._id)}
                title="Mark as completed"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleCancel(row._id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading && !appointments.length) return <LoadingSkeleton />;
  if (error && !appointments.length) return <ErrorState message={error} onRetry={fetchAppointments} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointment Management</h2>
        <p className="text-muted-foreground">View and manage all appointments</p>
      </div>

      <DataTable data={appointments} columns={columns} isLoading={loading} />
    </div>
  );
}
