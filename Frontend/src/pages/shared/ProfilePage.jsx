import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { 
  User, Mail, Phone, MapPin, Calendar, Droplets, 
  Shield, CreditCard, Save, Camera, Lock, Loader2,
  Globe, Heart, Hash, UserCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { userApi } from '../../services/apiServices';
import { updateUser } from '../../store/authSlice';
import { getRoleLabel } from '../../auth/constants';
import { staggerContainer, staggerItem } from '../../lib/animation-variants';
import { INDIAN_STATES, STATE_DISTRICTS, BLOOD_GROUPS } from '../../utils/locationData';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);
  
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    alternativeContact: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    maritalStatus: '',
    nationality: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
    saving: false
  });

  const deriveNameParts = (profile) => {
    if (!profile?.name) {
      return { firstName: '', middleName: '', lastName: '' };
    }
    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: '', middleName: '', lastName: '' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: '', lastName: '' };
    }
    if (parts.length === 2) {
      return { firstName: parts[0], middleName: '', lastName: parts[1] };
    }
    return {
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await userApi.getMe();
      const profile = response.data || response;
      const derivedNameParts = deriveNameParts(profile);
      
      const formData = {
        firstName: profile.firstName || derivedNameParts.firstName || '',
        middleName: profile.middleName || derivedNameParts.middleName || '',
        lastName: profile.lastName || derivedNameParts.lastName || '',
        phone: profile.phone || '',
        alternativeContact: profile.alternativeContact || '',
        gender: profile.gender || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '',
        bloodGroup: profile.bloodGroup || '',
        maritalStatus: profile.maritalStatus || '',
        nationality: profile.nationality || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postalCode: profile.postalCode || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        emergencyContactRelationship: profile.emergencyContactRelationship || '',
      };
      
      setForm(formData);
      setOriginalForm(formData);
      dispatch(updateUser(profile));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleCancel = () => {
    setForm(originalForm);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create a copy of the form for the payload
      const payload = { ...form };
      // Combine names for the 'name' field which is often used in the UI
      payload.name = `${form.firstName} ${form.lastName}`.trim();
      
      const response = await userApi.updateMe(payload);
      const profile = response.data || response;
      
      const updatedFormData = {
        firstName: profile.firstName || '',
        middleName: profile.middleName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        alternativeContact: profile.alternativeContact || '',
        gender: profile.gender || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '',
        bloodGroup: profile.bloodGroup || '',
        maritalStatus: profile.maritalStatus || '',
        nationality: profile.nationality || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postalCode: profile.postalCode || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        emergencyContactRelationship: profile.emergencyContactRelationship || '',
      };

      setOriginalForm(updatedFormData);
      setForm(updatedFormData);
      dispatch(updateUser(profile));
      setIsEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Image size must be under 2MB');
    }

    const formData = new FormData();
    formData.append('profileImage', file);
    setUploading(true);
    try {
      const response = await userApi.uploadProfileImage(formData);
      const profile = response.data || response;
      dispatch(updateUser(profile));
      toast.success('Profile image updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      return toast.error('Passwords do not match.');
    }
    if (passwordForm.next.length < 6) {
      return toast.error('New password must be at least 6 characters.');
    }

    setPasswordForm(prev => ({ ...prev, saving: true }));
    try {
      await userApi.changePassword({ 
        oldPassword: passwordForm.current, 
        newPassword: passwordForm.next 
      });
      toast.success('Password updated successfully.');
      setPasswordForm({ current: '', next: '', confirm: '', saving: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
      setPasswordForm(prev => ({ ...prev, saving: false }));
    }
  };

  return (
    <motion.div 
      variants={staggerContainer} 
      initial="initial" 
      animate="animate" 
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* Header Card */}
      <motion.section variants={staggerItem} className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="group relative">
            <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-background bg-muted shadow-xl transition-transform group-hover:scale-[1.02]">
              <img
                src={authUser?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser?.name || 'User')}`}
                alt={authUser?.name}
                className="h-full w-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95">
              <Camera className="h-5 w-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImage} disabled={uploading} />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {getRoleLabel(authUser?.role)} Account
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">{authUser?.name}</h1>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <Badge icon={Hash} label={authUser?.employeeId || authUser?.patientId || 'ID Pending'} />
              <Badge icon={Mail} label={authUser?.email} />
              <Badge icon={Shield} label={authUser?.onboardingStatus || 'active'} />
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <motion.form variants={staggerItem} onSubmit={handleSave} className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
              </div>
              {!isEditing ? (
                <Button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl h-10 px-6 font-bold"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancel}
                    className="rounded-xl h-10 px-6 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="rounded-xl h-10 px-6 font-bold"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Field label="First Name" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} disabled />
              <Field label="Middle Name" value={form.middleName} onChange={v => setForm({ ...form, middleName: v })} disabled />
              <Field label="Last Name" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} disabled />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <SelectField 
                label="Gender" 
                value={form.gender} 
                onChange={v => setForm({ ...form, gender: v })} 
                options={[
                  { label: 'Select Gender', value: '' },
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' }
                ]}
                disabled={!isEditing || loading}
              />
              <Field label="Date of Birth" type="date" value={form.dob} onChange={v => setForm({ ...form, dob: v })} disabled />
              <SelectField 
                label="Blood Group" 
                value={form.bloodGroup} 
                onChange={v => setForm({ ...form, bloodGroup: v })} 
                options={[{ label: 'Select', value: '' }, ...BLOOD_GROUPS.map(bg => ({ label: bg, value: bg }))]}
                disabled={!isEditing || loading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <SelectField 
                label="Marital Status" 
                value={form.maritalStatus} 
                onChange={v => setForm({ ...form, maritalStatus: v })} 
                options={[
                  { label: 'Select Status', value: '' },
                  { label: 'Single', value: 'single' },
                  { label: 'Married', value: 'married' },
                  { label: 'Divorced', value: 'divorced' },
                  { label: 'Widowed', value: 'widowed' }
                ]}
                disabled={!isEditing || loading}
              />
              <Field label="Nationality" value={form.nationality} onChange={v => setForm({ ...form, nationality: v })} disabled={!isEditing || loading} />
            </div>

            <div className="flex items-center gap-3 border-b border-border pb-5 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Contact Details</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Phone Number" value={form.phone} onChange={v => setForm({ ...form, phone: v.replace(/\D/g, '') })} maxLength={10} disabled={!isEditing || loading} />
              <Field label="Alternative Contact" value={form.alternativeContact} onChange={v => setForm({ ...form, alternativeContact: v.replace(/\D/g, '') })} maxLength={10} disabled={!isEditing || loading} />
            </div>

            <div className="space-y-6">
              <Field label="Full Address" value={form.address} onChange={v => setForm({ ...form, address: v })} disabled={!isEditing || loading} isTextarea />
              <div className="grid gap-6 md:grid-cols-3">
                <SelectField 
                  label="State" 
                  value={form.state} 
                  onChange={v => setForm({ ...form, state: v, city: '' })} 
                  options={[{ label: 'Select State', value: '' }, ...INDIAN_STATES.map(s => ({ label: s, value: s }))]}
                  disabled={!isEditing || loading}
                />
                <SelectField 
                  label="City / District" 
                  value={form.city} 
                  onChange={v => setForm({ ...form, city: v })} 
                  options={[{ label: 'Select City', value: '' }, ...(STATE_DISTRICTS[form.state] || []).map(d => ({ label: d, value: d }))]}
                  disabled={!isEditing || loading || !form.state}
                />
                <Field label="Postal Code" value={form.postalCode} onChange={v => setForm({ ...form, postalCode: v.replace(/\D/g, '') })} maxLength={6} disabled={!isEditing || loading} />
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-border pb-5 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                <Heart className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Emergency Contact</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Contact Name" value={form.emergencyContactName} onChange={v => setForm({ ...form, emergencyContactName: v })} disabled={!isEditing || loading} />
              <Field label="Contact Phone" value={form.emergencyContactPhone} onChange={v => setForm({ ...form, emergencyContactPhone: v.replace(/\D/g, '') })} maxLength={10} disabled={!isEditing || loading} />
              <Field label="Relationship" value={form.emergencyContactRelationship} onChange={v => setForm({ ...form, emergencyContactRelationship: v })} disabled={!isEditing || loading} />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={saving || loading} className="rounded-2xl px-12 h-14 font-bold shadow-lg shadow-primary/20">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </Button>
              </div>
            )}
          </motion.form>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <motion.section variants={staggerItem} className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Security</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Field label="Current Password" type="password" value={passwordForm.current} onChange={v => setPasswordForm({ ...passwordForm, current: v })} />
              <Field label="New Password" type="password" value={passwordForm.next} onChange={v => setPasswordForm({ ...passwordForm, next: v })} />
              <Field label="Confirm Password" type="password" value={passwordForm.confirm} onChange={v => setPasswordForm({ ...passwordForm, confirm: v })} />
              
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full h-12 rounded-xl mt-2 font-bold border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                disabled={passwordForm.saving}
              >
                {passwordForm.saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Update Password'}
              </Button>
            </form>
          </motion.section>

          <motion.section variants={staggerItem} className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Status
            </h2>
            
            <div className="space-y-4">
              <StatusRow label="Role" value={getRoleLabel(authUser?.role)} icon={UserCircle} />
              <StatusRow label="Status" value={authUser?.onboardingStatus || 'Active'} icon={Shield} />
              <StatusRow label="Member Since" value={new Date(authUser?.createdAt).toLocaleDateString()} icon={Calendar} />
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 text-xs text-muted-foreground leading-relaxed">
              Your profile information is used for hospital records and care coordination. Some fields may be locked for security. Contact HR to update system-locked data.
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, value, onChange, type = 'text', disabled = false, isTextarea = false, maxLength }) {
  const InputComponent = isTextarea ? 'textarea' : 'input';
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{label}</label>
      <InputComponent
        type={type}
        value={value || ''}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 disabled:opacity-60 ${isTextarea ? 'min-h-[100px] resize-none' : ''}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 disabled:opacity-60 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function Badge({ icon: Icon, label }) { // eslint-disable-line no-unused-vars
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

function StatusRow({ label, value, icon: Icon }) { // eslint-disable-line no-unused-vars
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
