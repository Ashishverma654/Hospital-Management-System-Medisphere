import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { DataTable, ErrorState, LoadingSkeleton } from '../../components';
import { patientApi } from '../../services/apiServices';
import { toast } from 'sonner';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientApi.getAll();
      setPatients(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'userId_name',
      label: 'Name',
      sortable: false,
      render: (_, row) => row.userId?.name || 'N/A',
    },
    {
      key: 'userId_email',
      label: 'Email',
      render: (_, row) => row.userId?.email || 'N/A',
    },
    { key: 'age', label: 'Age', sortable: true },
    { key: 'bloodGroup', label: 'Blood Group', sortable: true },
    { key: 'weight', label: 'Weight (kg)', sortable: true },
    { key: 'height', label: 'Height (cm)', sortable: true },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `/patient/${row.userId._id}`}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  if (loading && !patients.length) return <LoadingSkeleton />;
  if (error && !patients.length) return <ErrorState message={error} onRetry={fetchPatients} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
        <p className="text-muted-foreground">View and manage all patients</p>
      </div>

      <DataTable data={patients} columns={columns} isLoading={loading} />
    </div>
  );
}
