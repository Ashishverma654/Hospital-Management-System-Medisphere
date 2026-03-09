import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DataTable, ConfirmDialog, ErrorState, LoadingSkeleton } from '../../components';
import { departmentApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { FormDialog } from '../../components/FormDialog';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentApi.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingId) {
        await departmentApi.update(editingId, formData);
        toast.success('Department updated successfully');
      } else {
        await departmentApi.create(formData);
        toast.success('Department created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async () => {
    try {
      await departmentApi.delete(selectedDept._id);
      toast.success('Department deleted successfully');
      setShowDelete(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedDept(row);
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
              setSelectedDept(row);
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
      label: 'Department Name',
      placeholder: 'e.g., Cardiology',
      required: true,
      defaultValue: selectedDept?.name || '',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Department description',
      defaultValue: selectedDept?.description || '',
    },
  ];

  if (loading && !departments.length) return <LoadingSkeleton />;
  if (error && !departments.length) return <ErrorState message={error} onRetry={fetchDepartments} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Department Management</h2>
          <p className="text-muted-foreground">Manage hospital departments</p>
        </div>
        <Button
          onClick={() => {
            setSelectedDept(null);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      <DataTable data={departments} columns={columns} isLoading={loading} />

      <FormDialog
        isOpen={showForm}
        title={editingId ? 'Edit Department' : 'Create Department'}
        fields={fields}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
      />

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Department"
        description="This action cannot be undone. This will permanently delete the department."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
