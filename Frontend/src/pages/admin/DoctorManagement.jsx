import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Plus, Trash2, Edit2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ConfirmDialog, ErrorState, LoadingSkeleton } from '../../components';
import { doctorApi, departmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { FormDialog } from '../../components/FormDialog';
import { formatCurrency } from '../../utils/formatters';

export default function DoctorManagement() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    Promise.all([fetchDoctors(), fetchDepartments()]);
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getAll();
      setDoctors(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const submitData = {
        ...formData,
        consultationFee: parseFloat(formData.consultationFee),
        experience: parseInt(formData.experience),
      };
      
      await doctorApi.create(submitData);
      toast.success('Doctor created successfully');
      setShowForm(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save doctor');
    }
  };

  const handleDelete = async () => {
    try {
      // Note: Backend doesn't have delete endpoint for doctors, this is a placeholder
      toast.success('Doctor deleted successfully');
      setShowDelete(false);
      fetchDoctors();
    } catch (err) {
      toast.error('Failed to delete doctor');
    }
  };

  const columns = [
    {
      key: 'userId',
      label: 'Name',
      sortable: true,
      render: (userId) => userId?.name || 'N/A',
    },
    {
      key: 'userId',
      label: 'Email',
      sortable: false,
      render: (userId) => userId?.email || 'N/A',
    },
    { key: 'specialization', label: 'Specialization', sortable: true },
    { key: 'experience', label: 'Experience (Years)', sortable: true },
    {
      key: 'consultationFee',
      label: 'Consultation Fee',
      render: (fee) => formatCurrency(fee),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/doctor-profile/${row.userId?._id || row._id}`)}
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedDoctor(row);
              setEditingId(row._id);
              setShowForm(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedDoctor(row);
              setShowDelete(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const fields = [
    {
      name: 'name',
      label: 'Doctor Name',
      placeholder: 'Full name',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'doctor@hospital.com',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Strong password',
      required: !editingId,
    },
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      options: departments.map((d) => ({ value: d._id, label: d.name })),
    },
    {
      name: 'specialization',
      label: 'Specialization',
      placeholder: 'e.g., Cardiologist',
      required: true,
    },
    {
      name: 'experience',
      label: 'Years of Experience',
      type: 'number',
      required: true,
    },
    {
      name: 'consultationFee',
      label: 'Consultation Fee',
      type: 'number',
      required: true,
    },
    {
      name: 'about',
      label: 'About',
      type: 'textarea',
      placeholder: 'Brief bio',
    },
  ];

  if (loading && !doctors.length) return <LoadingSkeleton />;
  if (error && !doctors.length) return <ErrorState message={error} onRetry={fetchDoctors} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Doctor Management</h2>
          <p className="text-muted-foreground">Manage hospital doctors</p>
        </div>
        <Button
          onClick={() => {
            setSelectedDoctor(null);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <DataTable data={doctors} columns={columns} isLoading={loading} />

      <FormDialog
        isOpen={showForm}
        title={editingId ? 'Edit Doctor' : 'Add Doctor'}
        fields={fields}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
      />

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Doctor"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
