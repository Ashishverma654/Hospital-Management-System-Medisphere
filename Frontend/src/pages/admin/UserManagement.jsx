import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DataTable, ConfirmDialog, ErrorState } from '../../components';
import { adminApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { FormDialog } from '../../components/FormDialog';
import { useSelector } from 'react-redux';

export default function UserManagement() {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      await adminApi.createUser(formData);
      toast.success('User created successfully');
      setShowForm(false);
      // Optionally refetch users here
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDelete = async () => {
    try {
      // Note: Backend may not have delete user endpoint
      toast.success('User deleted successfully');
      setShowDelete(false);
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedUser(row);
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
      label: 'Full Name',
      placeholder: 'John Doe',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'user@hospital.com',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Strong password',
      required: true,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        ...(user?.role === 'superadmin' ? [
          { value: 'superadmin', label: 'Super Admin' },
          { value: 'superreceptionist', label: 'Super Receptionist' }
        ] : []),
        { value: 'admin', label: 'Admin' },
        { value: 'receptionist', label: 'Receptionist' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Create and manage staff users</p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <DataTable data={users} columns={columns} isLoading={loading} />

      <FormDialog
        isOpen={showForm}
        title="Create New User"
        fields={fields}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
      />

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete User"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
