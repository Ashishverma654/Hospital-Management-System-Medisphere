import { useState, useEffect } from 'react';
import { DataTable, ErrorState, LoadingSkeleton } from '../../components';
import { patientApi } from '../../services/apiServices';

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
      key: 'userId_patientId',
      label: 'Patient ID',
      render: (_, row) => row.userId?.patientId || 'N/A',
    },
  ];

  if (loading && !patients.length) return <LoadingSkeleton />;
  if (error && !patients.length) return <ErrorState message={error} onRetry={fetchPatients} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <p className="text-muted-foreground">View the complete patient list only</p>
      </div>

      <DataTable data={patients} columns={columns} isLoading={loading} />
    </div>
  );
}
