import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable, LoadingSkeleton, ErrorState } from '../../components';
import { patientApi, appointmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Users, FileText, Calendar } from 'lucide-react';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientApi.getAll();
      setPatients(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (patientId) => {
    try {
      const history = await appointmentApi.getPatientHistory(patientId);
      setPatientHistory(Array.isArray(history) ? history : []);
      setSelectedPatient(patientId);
    } catch (err) {
      toast.error('Failed to fetch patient history');
    }
  };

  const columns = [
    {
      key: 'userId',
      label: 'Name',
      sortable: true,
      render: (user) => user?.name || 'N/A',
    },
    {
      key: 'userId',
      label: 'Email',
      render: (user) => user?.email || 'N/A',
    },
    {
      key: 'userId',
      label: 'Phone',
      render: (user) => user?.phone || 'N/A',
    },
    {
      key: 'bloodGroup',
      label: 'Blood Group',
      render: (bg) => bg || 'Not specified',
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewHistory(row._id)}
        >
          <FileText className="h-4 w-4 mr-1" /> History
        </Button>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Patients</h2>
        <p className="text-muted-foreground">View all your patients and their medical history</p>
      </div>

      {error && <ErrorState error={error} />}

      {/* Patients List */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Patients ({patients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No patients found.
            </p>
          ) : (
            <DataTable
              data={patients}
              columns={columns}
              searchPlaceholder="Search patients by name..."
              searchKey="userId"
            />
          )}
        </CardContent>
      </Card>

      {/* Patient History */}
      {selectedPatient && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Appointment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patientHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No appointment history found.
              </p>
            ) : (
              <div className="space-y-3">
                {patientHistory.map((apt) => (
                  <div
                    key={apt._id}
                    className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(apt.date).toLocaleDateString()} at {apt.time}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: <span className="font-medium capitalize">{apt.status}</span>
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
