import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FormDialog, LoadingSkeleton, ErrorState } from '../../components';
import { patientApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Plus, UserPlus } from 'lucide-react';

export default function ReceptionistPatientRegistration() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const formFields = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'John',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Doe',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'john@example.com',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      required: true,
      placeholder: '+91 9876543210',
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'date',
      required: true,
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: ['Male', 'Female', 'Other'],
    },
    {
      name: 'bloodGroup',
      label: 'Blood Group',
      type: 'select',
      options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      placeholder: '123 Main Street',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'New York',
    },
    {
      name: 'state',
      label: 'State',
      type: 'text',
      placeholder: 'NY',
    },
    {
      name: 'medicalHistory',
      label: 'Medical History',
      type: 'textarea',
      placeholder: 'Any previous medical conditions...',
    },
  ];

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const submitData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
      };
      await patientApi.create(submitData);
      toast.success('Patient registered successfully');
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patient Registration</h2>
          <p className="text-muted-foreground">Register new patients at the front desk</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Register Patient
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> New Registration
          </CardTitle>
          <CardDescription>
            Fill in the patient's information to create a new record in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Click the "Register Patient" button above to begin registration.</p>
        </CardContent>
      </Card>

      <FormDialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title="Register New Patient"
        description="Enter the patient's information"
        fields={formFields}
      />
    </div>
  );
}
