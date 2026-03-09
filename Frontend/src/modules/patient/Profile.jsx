import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useRef } from 'react';
import { User, Activity, MapPin, Camera } from 'lucide-react';
import { userApi } from '../../services/apiServices';
import { updateUser } from '../../store/authSlice';
import { toast } from 'sonner';

export default function PatientProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       toast.error('Please select a valid image file');
       return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('profileImage', file);

      const res = await userApi.uploadProfileImage(formData);
      if (res.data.success) {
        dispatch(updateUser({ profileImage: res.data.data.profileImage }));
        toast.success(res.data.message || 'Profile image updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
          <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <div 
              className="relative w-32 h-32 rounded-full border-4 border-background shadow-xl overflow-hidden mb-4 bg-muted group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
               <img 
                 src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} 
                 alt="Avatar" 
                 className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`} 
               />
               <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="w-8 h-8 text-white mb-1" />
                 <span className="text-white text-xs font-medium">{isUploading ? 'Uploading...' : 'Change'}</span>
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </div>
            <h3 className="text-xl font-bold">{user?.name || 'Patient Name'}</h3>
            <p className="text-sm text-muted-foreground capitalize flex items-center justify-center gap-1 mt-1">
              <User className="w-3 h-3" /> {user?.role || 'Patient'}
            </p>
            
            <Separator className="my-6" />
            
            <div className="w-full space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4"/> Blood Group</span>
                <span className="font-medium bg-primary/10 text-primary px-2 rounded-md">O+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</span>
                <span className="font-medium">New York, USA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={user?.name || 'John Doe'} disabled={!isEditing} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" defaultValue={user?.email || 'patient@example.com'} disabled={!isEditing} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" defaultValue="+1 (555) 123-4567" disabled={!isEditing} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" defaultValue="1985-06-15" disabled={!isEditing} className="bg-background/50" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input defaultValue="123 Health Ave, Medical City, NY 10001" disabled={!isEditing} className="bg-background/50" />
                </div>
              </div>
              
              {isEditing && (
                <div className="flex justify-end pt-4 border-t border-border/50 mt-6">
                  <Button type="button" onClick={() => setIsEditing(false)}>Save Changes</Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
