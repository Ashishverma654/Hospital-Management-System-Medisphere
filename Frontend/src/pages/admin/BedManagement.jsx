import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { DataTable, ErrorState, LoadingSkeleton, StatusBadge } from '../../components';
import { bedApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { FormDialog } from '../../components/FormDialog';

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchBeds();
  }, []);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bedApi.getAll();
      setBeds(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch beds');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      await bedApi.add(formData);
      toast.success('Bed created successfully');
      setShowForm(false);
      fetchBeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bed');
    }
  };

  const handleDischarge = async (bedId) => {
    try {
      await bedApi.discharge(bedId);
      toast.success('Patient discharged successfully');
      fetchBeds();
    } catch (err) {
      toast.error('Failed to discharge patient');
    }
  };

  const columns = [
    { key: 'bedNumber', label: 'Bed Number', sortable: true },
    { key: 'ward', label: 'Ward', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'patientId',
      label: 'Patient',
      render: (patientId) => patientId?.name || 'Vacant',
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'occupied' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDischarge(row._id)}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Discharge
            </Button>
          )}
        </div>
      ),
    },
  ];

  const fields = [
    {
      name: 'bedNumber',
      label: 'Bed Number',
      placeholder: 'A101',
      required: true,
    },
    {
      name: 'ward',
      label: 'Ward',
      placeholder: 'General Ward',
      required: true,
    },
    {
      name: 'type',
      label: 'Bed Type',
      type: 'select',
      required: true,
      options: [
        { value: 'general', label: 'General' },
        { value: 'semi-private', label: 'Semi-Private' },
        { value: 'private', label: 'Private' },
        { value: 'icu', label: 'ICU' },
      ],
    },
  ];

  if (loading && !beds.length) return <LoadingSkeleton />;
  if (error && !beds.length) return <ErrorState message={error} onRetry={fetchBeds} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bed Management</h2>
          <p className="text-muted-foreground">Manage hospital beds and admissions</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bed
        </Button>
      </div>

      <DataTable data={beds} columns={columns} isLoading={loading} />

      <FormDialog
        isOpen={showForm}
        title="Add New Bed"
        fields={fields}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
