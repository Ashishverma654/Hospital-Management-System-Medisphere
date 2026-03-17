import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Stethoscope, 
  ShieldCheck, 
  UserCircle, 
  ArrowLeft, 
  Save, 
  Info,
  Calendar,
  MapPin,
  ClipboardList,
  Shield,
  FileText,
  Upload,
  UserCheck,
  Phone,
  Droplets,
  HeartPulse,
  Home,
  Building2,
  CheckCircle2,
  X,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { adminApi, departmentApi, locationApi, doctorApi, fileApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { ROLE_LABELS, ROLE_COLORS } from '../../auth/constants';
import { INDIAN_STATES, STATE_DISTRICTS, BLOOD_GROUPS } from '../../utils/locationData';

const PHONE_REGEX = /^[0-9]{10}$/;
const PINCODE_REGEX = /^[0-9]{6}$/;

const validatePhone = (num) => PHONE_REGEX.test(num);
const validatePincode = (pin) => PINCODE_REGEX.test(pin);
const validateDOB = (date) => {
  if (!date) return true;
  const dob = new Date(date);
  const now = new Date();
  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(now.getFullYear() - 100);
  return dob <= now && dob >= hundredYearsAgo;
};

const FORM_SECTIONS = {
  PERSONAL: 'Personal Information',
  PROFESSIONAL: 'Professional Information',
  HOSPITAL: 'Hospital Specific Information',
  DOCUMENTS: 'Document Uploads',
  EMERGENCY: 'Emergency Contact'
};

const STAFF_SECTIONS = {
  PERSONAL: 'Personal & Personal Details',
  CONTACT: 'Contact & Address',
  PROFESSIONAL: 'Professional & Role Details',
  QUALIFICATIONS: 'Qualifications & Skills',
  ACCOUNT: 'Account & Security'
};

const INITIAL_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  alternativeContact: '',
  gender: '',
  bloodGroup: '',
  dob: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  maritalStatus: '',
  nationality: '',
  profileImage: '',
  role: '',
  password: '', 
  
  // Professional / Role specific
  title: '',
  departmentId: '',
  specializationIds: [],
  specialization: '', // for other roles
  hospitalLocations: [],
  qualifications: [],
  education: [],
  certifications: [],
  skills: [],
  experienceYears: '',
  consultationFee: '',
  consultationFeeVideo: '',
  about: '',
  expertise: [],
  licenseNumber: '',
  licenseExpiryDate: '',
  joiningDate: '',
  roomNumber: '',
  employmentType: 'full-time',
  emergencyContactName: '',
  emergencyContactNumber: '',
  emergencyContactRelationship: '',
  labSection: '', // for lab tech
  docLicense: '',
  docEducation: '',
  docAdditional: '',
};

export default function AddUserPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Form
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState({}); // { field: File }
  const [creatableRoles, setCreatableRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeSection, setActiveSection] = useState(FORM_SECTIONS.PERSONAL);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) {
      setForm(prev => ({ ...prev, role: roleParam }));
      setStep(2);
    }

    adminApi.getCreatableRoles().then(res => {
      setCreatableRoles(res.allowedRoles || []);
    }).catch(() => {});

    departmentApi.getAll({ isActive: true }).then(res => {
      setDepartments(res || []);
    }).catch(() => {});

    locationApi.getAll({ isActive: true }).then(res => {
      setLocations(res || []);
    }).catch(() => {});
  }, [searchParams]);

  // Real-time validation
  useEffect(() => {
    const newErrors = {};
    if (!form.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email?.trim()) newErrors.email = 'Email is required';
    if (!form.phone?.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!validatePhone(form.phone)) {
      newErrors.phone = 'Enter a valid 10-digit number';
    }
    
    if (form.alternativeContact && !validatePhone(form.alternativeContact)) {
      newErrors.alternativeContact = 'Must be 10 digits';
    }

    if (form.postalCode && !validatePincode(form.postalCode)) {
      newErrors.postalCode = 'Must be 6 digits';
    }

    if (!form.dob?.trim()) {
      newErrors.dob = 'DOB is required';
    } else if (!validateDOB(form.dob)) {
      newErrors.dob = 'Invalid date of birth';
    }

    if (form.role === 'doctor') {
      if (!form.title?.trim()) newErrors.title = 'Title is required';
      if (!form.departmentId) newErrors.departmentId = 'Department is required';
      if (!form.licenseNumber?.trim()) newErrors.licenseNumber = 'License is required';
      if (!form.licenseExpiryDate) newErrors.licenseExpiryDate = 'Expiry is required';
      if (!form.joiningDate) newErrors.joiningDate = 'Joining date is required';
      if (form.hospitalLocations.length === 0) newErrors.hospitalLocations = 'Select at least one location';
      if (!form.emergencyContactNumber?.trim()) {
        newErrors.emergencyContactNumber = 'Emergency number required';
      } else if (!validatePhone(form.emergencyContactNumber)) {
        newErrors.emergencyContactNumber = 'Must be 10 digits';
      }
    } else {
      if (!form.state) newErrors.state = 'State is required';
      if (!form.city) newErrors.city = 'District is required';
      
      if (!form.address?.trim()) newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
  }, [form, searchParams]);

  const handleRoleSelect = (role) => {
    setForm(prev => ({ ...prev, role, title: ROLE_LABELS[role] || '' }));
    setStep(2);
    if (role === 'doctor') {
      setActiveSection(FORM_SECTIONS.PERSONAL);
    } else {
      setActiveSection(STAFF_SECTIONS.PERSONAL);
    }
  };

  const handleInputChange = (field, value) => {
    // Numeric filtering for specific fields
    const numericFields = ['phone', 'alternativeContact', 'postalCode', 'emergencyContactNumber', 'experienceYears', 'consultationFee', 'consultationFeeVideo'];
    let finalValue = value;
    
    if (numericFields.includes(field)) {
      finalValue = value.replace(/\D/g, '');
    }

    setForm(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleFileSelect = (field, file) => {
    if (!file) {
      setPendingFiles(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setForm(prev => ({ ...prev, [field]: '' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) return toast.error('File size must be under 5MB');

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setPendingFiles(prev => ({ ...prev, [field]: file }));
    setForm(prev => ({ ...prev, [field]: previewUrl })); // Temporary preview URL
  };

  const handleArrayChange = (field, index, value) => {
    const next = [...(form[field] || [])];
    next[index] = value;
    handleInputChange(field, next);
  };

  const addArrayItem = (field) => {
    handleInputChange(field, [...(form[field] || []), '']);
  };

  const removeArrayItem = (field, index) => {
    const next = [...(form[field] || [])];
    next.splice(index, 1);
    handleInputChange(field, next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors before processing');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Pending Files
      const updatedForm = { ...form };
      const uploadFields = Object.keys(pendingFiles);
      
      if (uploadFields.length > 0) {
        toast.info(`Uploading ${uploadFields.length} file(s)...`);
        for (const field of uploadFields) {
          const file = pendingFiles[field];
          const formData = new FormData();
          formData.append('image', file);
          const res = await fileApi.uploadImage(formData);
          updatedForm[field] = res.url;
        }
      }

      // 2. Create User
      if (form.role === 'doctor') {
        const res = await doctorApi.createAdminDoctor(updatedForm);
        const temp = res?.temporaryCredential?.temporaryPassword;
        toast.success(`Doctor created successfully. ${temp ? `Password: ${temp}` : ''}`, { duration: 10000 });
        navigate('/employee/doctors');
      } else {
        const res = await adminApi.createUser(updatedForm);
        const temp = res?.temporaryCredential?.temporaryPassword;
        toast.success(
          temp 
            ? `${ROLE_LABELS[form.role]} created successfully. Temporary password: ${temp}` 
            : `${ROLE_LABELS[form.role]} created successfully.`,
          { duration: 8000 }
        );
        navigate('/employee/manage-roles');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Select User Role</h2>
        <p className="mt-2 text-muted-foreground text-lg">Choose the type of staff member you want to add to the system.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {creatableRoles.map((role) => (
          <motion.button
            key={role}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect(role)}
            className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary hover:bg-primary/5 shadow-sm"
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${ROLE_COLORS[role]} shadow-inner`}>
              {role === 'doctor' ? <Stethoscope className="h-8 w-8" /> : 
               role.includes('admin') ? <ShieldCheck className="h-8 w-8" /> : 
               <UserCircle className="h-8 w-8" />}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">{ROLE_LABELS[role] || role}</h3>
              <p className="mt-1 text-sm text-muted-foreground uppercase tracking-widest font-semibold opacity-70">{role}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderSectionTab = (section, Icon) => (
    <button
      type="button"
      onClick={() => setActiveSection(section)}
      className={`flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all border-l-2 ${
        activeSection === section 
          ? 'border-primary bg-primary/10 text-primary' 
          : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {section}
    </button>
  );

  const renderDoctorForm = () => (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {renderSectionTab(FORM_SECTIONS.PERSONAL, UserCircle)}
          {renderSectionTab(FORM_SECTIONS.PROFESSIONAL, ClipboardList)}
          {renderSectionTab(FORM_SECTIONS.HOSPITAL, Building2)}
          {renderSectionTab(FORM_SECTIONS.DOCUMENTS, Upload)}
          {renderSectionTab(FORM_SECTIONS.EMERGENCY, HeartPulse)}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          
          {/* PERSONAL INFORMATION */}
          <AnimatePresence mode="wait">
            {activeSection === FORM_SECTIONS.PERSONAL && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{FORM_SECTIONS.PERSONAL}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field label="First Name*" placeholder="Enter first name" required value={form.firstName} onChange={v => handleInputChange('firstName', v)} icon={UserCircle} error={submitAttempted ? errors.firstName : null} />
                  <Field label="Middle Name" placeholder="Optional" value={form.middleName} onChange={v => handleInputChange('middleName', v)} icon={UserCircle} />
                  <Field label="Last Name*" placeholder="Enter last name" required value={form.lastName} onChange={v => handleInputChange('lastName', v)} icon={UserCircle} error={submitAttempted ? errors.lastName : null} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Email Address*" type="email" placeholder="doctor@hospital.com" required value={form.email} onChange={v => handleInputChange('email', v)} icon={FileText} error={submitAttempted ? errors.email : null} />
                  <Field label="Mobile Number*" placeholder="10-digit mobile number" required value={form.phone} onChange={v => handleInputChange('phone', v)} icon={Phone} maxLength={10} error={submitAttempted ? errors.phone : null} />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Gender*</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      value={form.gender}
                      onChange={e => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-red-500 flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5" /> Blood Group*
                    </label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      value={form.bloodGroup}
                      onChange={e => handleInputChange('bloodGroup', e.target.value)}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <Field label="Date of Birth*" type="date" required value={form.dob} onChange={v => handleInputChange('dob', v)} icon={Calendar} error={submitAttempted ? errors.dob : null} max={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Alternative Contact" placeholder="Secondary phone number" value={form.alternativeContact} onChange={v => handleInputChange('alternativeContact', v)} icon={Phone} maxLength={10} error={submitAttempted ? errors.alternativeContact : null} />
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold">Address*</label>
                    <textarea 
                      placeholder="Street address, apartment, etc."
                      className="min-h-[100px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                      required
                      value={form.address}
                      onChange={e => handleInputChange('address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> State*
                    </label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      value={form.state}
                      onChange={e => {
                        const state = e.target.value;
                        setForm(prev => ({ ...prev, state, city: '' }));
                      }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> District/City*
                    </label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      disabled={!form.state}
                      value={form.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                    >
                      <option value="">Select District</option>
                      {(STATE_DISTRICTS[form.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <Field label="Postal Code*" placeholder="6-digit Pincode" required value={form.postalCode} onChange={v => handleInputChange('postalCode', v)} icon={MapPin} maxLength={6} error={submitAttempted ? errors.postalCode : null} />
                </div>
              </motion.div>
            )}

            {activeSection === FORM_SECTIONS.PROFESSIONAL && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{FORM_SECTIONS.PROFESSIONAL}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Designation Title*</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Consultant"
                      required
                      readOnly
                      className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-not-allowed"
                      value={form.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Department*</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      value={form.departmentId}
                      onChange={e => handleInputChange('departmentId', e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field label="Years of Experience*" type="number" placeholder="0" required value={form.experienceYears} onChange={v => handleInputChange('experienceYears', v)} icon={Info} />
                  <Field label="Consultation Fee (In-House)*" type="number" placeholder="0.00" required value={form.consultationFee} onChange={v => handleInputChange('consultationFee', v)} icon={CreditCard} />
                  <Field label="Video Consultation Fee" type="number" placeholder="0.00" value={form.consultationFeeVideo} onChange={v => handleInputChange('consultationFeeVideo', v)} icon={CreditCard} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Medical License Number*" placeholder="Unique license ID" required value={form.licenseNumber} onChange={v => handleInputChange('licenseNumber', v)} icon={Shield} />
                  <Field label="License Expiry Date*" type="date" required value={form.licenseExpiryDate} onChange={v => handleInputChange('licenseExpiryDate', v)} icon={Calendar} max="9999-12-31" />
                </div>

                <ArrayField label="Qualifications*" placeholder="e.g. MBBS, MD (Medicine)" items={form.qualifications} onAdd={() => addArrayItem('qualifications')} onRemove={i => removeArrayItem('qualifications', i)} onChange={(i, v) => handleArrayChange('qualifications', i, v)} />
                <ArrayField label="Specialized Education" placeholder="e.g. Fellowship in Cardiology" items={form.education} onAdd={() => addArrayItem('education')} onRemove={i => removeArrayItem('education', i)} onChange={(i, v) => handleArrayChange('education', i, v)} />
                <ArrayField label="Certifications" placeholder="e.g. Board Certified Surgeons" items={form.certifications} onAdd={() => addArrayItem('certifications')} onRemove={i => removeArrayItem('certifications', i)} onChange={(i, v) => handleArrayChange('certifications', i, v)} />
                <ArrayField label="Key Expertise/Services" placeholder="e.g. Robotic Surgery" items={form.expertise} onAdd={() => addArrayItem('expertise')} onRemove={i => removeArrayItem('expertise', i)} onChange={(i, v) => handleArrayChange('expertise', i, v)} />

                <div>
                    <label className="mb-2 block text-sm font-semibold">About Doctor / Professional Bio</label>
                    <textarea 
                      placeholder="Briefly describe the doctor's professional background and philosophy of care..."
                      className="min-h-[150px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                      value={form.about}
                      onChange={e => handleInputChange('about', e.target.value)}
                    />
                  </div>
              </motion.div>
            )}

            {activeSection === FORM_SECTIONS.HOSPITAL && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{FORM_SECTIONS.HOSPITAL}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Joining Date*" type="date" required value={form.joiningDate} onChange={v => handleInputChange('joiningDate', v)} icon={Calendar} max="9999-12-31" />
                  <Field label="OPD Room Number" placeholder="e.g. Room 102" value={form.roomNumber} onChange={v => handleInputChange('roomNumber', v)} icon={MapPin} />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold">Associated Hospital Locations*</label>
                  <p className="text-xs text-muted-foreground mb-4">Select all clinic or hospital branches where this doctor will be consulting.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {locations.map((loc) => (
                      <label 
                        key={loc._id} 
                        className={`flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer ${
                          form.hospitalLocations.includes(loc._id) 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={form.hospitalLocations.includes(loc._id)}
                          onChange={() => {
                            const next = form.hospitalLocations.includes(loc._id)
                              ? form.hospitalLocations.filter(id => id !== loc._id)
                              : [...form.hospitalLocations, loc._id];
                            handleInputChange('hospitalLocations', next);
                          }}
                        />
                        <div>
                          <p className="text-sm font-bold">{loc.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{loc.city}, {loc.state}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === FORM_SECTIONS.DOCUMENTS && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{FORM_SECTIONS.DOCUMENTS}</h3>
                </div>

                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-dashed border-border mb-6">
                  Please upload valid scanned copies of the doctor's credentials. These will be used for internal verification.
                  Supported formats: JPG, PNG, PDF (Max 5MB per file).
                </p>

                <div className="grid gap-8 sm:grid-cols-2">
                  <UploadBox label="Profile Photo*" subtitle="Professional headshot for portal" icon={UserCircle} value={form.profileImage} onSelect={file => handleFileSelect('profileImage', file)} />
                  <UploadBox label="Medical License*" subtitle="Copy of state/national license" icon={Shield} value={form.docLicense} onSelect={file => handleFileSelect('docLicense', file)} />
                  <UploadBox label="Education Certificates" subtitle="Post-grad/Degree certificates" icon={ArrowLeft} value={form.docEducation} onSelect={file => handleFileSelect('docEducation', file)} />
                  <UploadBox label="Identity/Other Proof" subtitle="Passport, Aadhar, or SSN copy" icon={FileText} value={form.docAdditional} onSelect={file => handleFileSelect('docAdditional', file)} />
                </div>
              </motion.div>
            )}

            {activeSection === FORM_SECTIONS.EMERGENCY && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{FORM_SECTIONS.EMERGENCY}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Emergency Contact Name*" placeholder="Full name of contact" required value={form.emergencyContactName} onChange={v => handleInputChange('emergencyContactName', v)} icon={UserCircle} error={submitAttempted ? errors.emergencyContactName : null} />
                  <Field label="Emergency Contact Number*" placeholder="Primary phone for emergency" required value={form.emergencyContactNumber} onChange={v => handleInputChange('emergencyContactNumber', v)} icon={Phone} maxLength={10} error={submitAttempted ? errors.emergencyContactNumber : null} />
                  <Field label="Relationship*" placeholder="e.g. Spouse, Parent, Brother" required value={form.emergencyContactRelationship} onChange={v => handleInputChange('emergencyContactRelationship', v)} icon={Info} error={submitAttempted ? errors.emergencyContactRelationship : null} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t border-border pt-8">
            <Button type="button" variant="outline" size="lg" className="rounded-xl px-10" onClick={() => navigate(-1)}>Cancel</Button>
            <div className="flex gap-4">
               {/* Show Next or Save depending on section */}
               {activeSection !== FORM_SECTIONS.EMERGENCY ? (
                 <Button 
                   type="button" 
                   size="lg" 
                   className="rounded-xl px-10"
                   onClick={() => {
                     const sections = Object.values(FORM_SECTIONS);
                     const next = sections[sections.indexOf(activeSection) + 1];
                     setActiveSection(next);
                   }}
                 >
                   Continue to Next Section
                 </Button>
               ) : (
                 <Button type="submit" size="lg" disabled={loading} className="rounded-xl px-10 bg-primary hover:bg-primary/90">
                   {loading ? 'Creating Doctor Profile...' : 'Save & Create Account'}
                   {!loading && <Save className="ml-2 h-4 w-4" />}
                 </Button>
               )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderStaffForm = () => (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {renderSectionTab(STAFF_SECTIONS.PERSONAL, UserCircle)}
          {renderSectionTab(STAFF_SECTIONS.CONTACT, MapPin)}
          {renderSectionTab(STAFF_SECTIONS.PROFESSIONAL, ClipboardList)}
          {renderSectionTab(STAFF_SECTIONS.QUALIFICATIONS, FileText)}
          {renderSectionTab(STAFF_SECTIONS.ACCOUNT, Shield)}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          
          <AnimatePresence mode="wait">
            {activeSection === STAFF_SECTIONS.PERSONAL && (
              <motion.div
                key="staff-personal"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{STAFF_SECTIONS.PERSONAL}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field label="First Name*" placeholder="First name" required value={form.firstName} onChange={v => handleInputChange('firstName', v)} icon={UserCircle} error={submitAttempted ? errors.firstName : null} />
                  <Field label="Middle Name" placeholder="Optional" value={form.middleName} onChange={v => handleInputChange('middleName', v)} icon={UserCircle} />
                  <Field label="Last Name*" placeholder="Last name" required value={form.lastName} onChange={v => handleInputChange('lastName', v)} icon={UserCircle} error={submitAttempted ? errors.lastName : null} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Email Address*" type="email" placeholder="staff@hospital.com" required value={form.email} onChange={v => handleInputChange('email', v)} icon={FileText} error={submitAttempted ? errors.email : null} />
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Gender*</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required value={form.gender} onChange={e => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Field label="Date of Birth*" type="date" required value={form.dob} onChange={v => handleInputChange('dob', v)} icon={Calendar} error={submitAttempted ? errors.dob : null} max={new Date().toISOString().split('T')[0]} />
                  <div>
                    <label className="mb-2 block text-sm font-semibold flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5 text-red-500" /> Blood Group*
                    </label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required value={form.bloodGroup} onChange={e => handleInputChange('bloodGroup', e.target.value)}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Marital Status</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      value={form.maritalStatus} onChange={e => handleInputChange('maritalStatus', e.target.value)}
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="separated">Separated</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                   <Field label="Nationality" placeholder="e.g. Indian" value={form.nationality} onChange={v => handleInputChange('nationality', v)} icon={Info} />
                   <UploadBox label="Profile Photo" subtitle="Professional headshot" icon={UserCheck} value={form.profileImage} onSelect={file => handleFileSelect('profileImage', file)} />
                </div>
              </motion.div>
            )}

            {activeSection === STAFF_SECTIONS.CONTACT && (
              <motion.div
                key="staff-contact"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{STAFF_SECTIONS.CONTACT}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Mobile Number*" placeholder="10-digit number" required value={form.phone} onChange={v => handleInputChange('phone', v)} icon={Phone} maxLength={10} error={submitAttempted ? errors.phone : null} />
                  <Field label="Alternative Contact" placeholder="Secondary number" value={form.alternativeContact} onChange={v => handleInputChange('alternativeContact', v)} icon={Phone} maxLength={10} error={submitAttempted ? errors.alternativeContact : null} />
                </div>

                <div className="space-y-4">
                  <label className={`text-sm font-semibold ${(submitAttempted && errors.address) ? 'text-red-500' : ''}`}>Full Address*</label>
                  <textarea 
                    placeholder="House No, Street, Landmark"
                    className={`min-h-[100px] w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all focus:ring-4 focus:ring-primary/5 outline-none resize-none ${(submitAttempted && errors.address) ? 'border-red-500' : 'border-border focus:border-primary'}`}
                    required value={form.address} onChange={e => handleInputChange('address', e.target.value)}
                  />
                  {submitAttempted && errors.address && <p className="text-[10px] font-bold text-red-500 italic flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-red-500" /> {errors.address}</p>}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">State*</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required value={form.state}
                      onChange={e => {
                        const state = e.target.value;
                        setForm(prev => ({ ...prev, state, city: '' }));
                      }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">District/City*</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required disabled={!form.state} value={form.city} onChange={e => handleInputChange('city', e.target.value)}
                    >
                      <option value="">Select District</option>
                      {(STATE_DISTRICTS[form.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <Field label="Postal Code*" placeholder="6-digit Pincode" required value={form.postalCode} onChange={v => handleInputChange('postalCode', v)} icon={MapPin} maxLength={6} error={submitAttempted ? errors.postalCode : null} />
                </div>
              </motion.div>
            )}

            {activeSection === STAFF_SECTIONS.PROFESSIONAL && (
              <motion.div
                key="staff-professional"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{STAFF_SECTIONS.PROFESSIONAL}</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-4 border border-border">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Employee ID Prefix</p>
                    <p className="text-lg font-mono font-bold text-primary">
                      {form.role === 'nurse' ? 'NURS-' : 
                       form.role === 'receptionist' ? 'RECP-' : 
                       form.role === 'pharmacist' ? 'PHAR-' : 
                       form.role === 'labTechnician' ? 'LABT-' : 'EMP-'}XXXXXX
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground italic">System will generate unique ID automatically</p>
                  </div>
                  <Field label="Joining Date*" type="date" required value={form.joiningDate} onChange={v => handleInputChange('joiningDate', v)} icon={Calendar} max="9999-12-31" />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Designation*" placeholder="e.g. Senior Nurse" required value={form.title} onChange={v => handleInputChange('title', v)} icon={Info} readOnly />
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Employment Type*</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      required value={form.employmentType} onChange={e => handleInputChange('employmentType', e.target.value)}
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Experience (Years)" placeholder="e.g. 5" value={form.experienceYears} onChange={v => handleInputChange('experienceYears', v.replace(/\D/g, ''))} icon={Briefcase} />
                  {form.role === 'labTechnician' && (
                    <Field label="Lab Section" placeholder="e.g. Hematology, Pathology" value={form.labSection} onChange={v => handleInputChange('labSection', v)} icon={Building2} />
                  )}
                </div>
              </motion.div>
            )}

            {activeSection === STAFF_SECTIONS.QUALIFICATIONS && (
              <motion.div
                key="staff-qual"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{STAFF_SECTIONS.QUALIFICATIONS}</h3>
                </div>

                <ArrayField label="Educational Qualifications*" placeholder="e.g. B.Sc. Nursing" items={form.qualifications} onAdd={() => addArrayItem('qualifications')} onRemove={i => removeArrayItem('qualifications', i)} onChange={(i, v) => handleArrayChange('qualifications', i, v)} />
                <ArrayField label="Professional Certifications" placeholder="e.g. ACLS, BLS" items={form.certifications} onAdd={() => addArrayItem('certifications')} onRemove={i => removeArrayItem('certifications', i)} onChange={(i, v) => handleArrayChange('certifications', i, v)} />
                <ArrayField label="Key Skills" placeholder="e.g. Emergency Care, Patient Management" items={form.skills} onAdd={() => addArrayItem('skills')} onRemove={i => removeArrayItem('skills', i)} onChange={(i, v) => handleArrayChange('skills', i, v)} />

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Professional License Number" placeholder="If applicable" value={form.licenseNumber} onChange={v => handleInputChange('licenseNumber', v)} icon={Shield} />
                  <Field label="License Expiry" type="date" value={form.licenseExpiryDate} onChange={v => handleInputChange('licenseExpiryDate', v)} icon={Calendar} max="9999-12-31" />
                </div>
              </motion.div>
            )}

            {activeSection === STAFF_SECTIONS.ACCOUNT && (
              <motion.div
                key="staff-account"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{STAFF_SECTIONS.ACCOUNT}</h3>
                </div>

                <div className="rounded-2xl bg-primary/5 p-8 border border-primary/20 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                     <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Role: {ROLE_LABELS[form.role]}</h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This user will be registered as a <strong>{ROLE_LABELS[form.role]}</strong>. 
                    A secure temporary password will be auto-generated and sent to their email.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t border-border pt-8">
            <Button 
              type="button" 
              variant="outline" 
              size="lg" 
              className="rounded-xl px-10" 
              onClick={() => {
                const appropriateSections = form.role === 'doctor' ? Object.values(FORM_SECTIONS) : Object.values(STAFF_SECTIONS);
                const currentIndex = appropriateSections.indexOf(activeSection);
                
                if (currentIndex > 0) {
                  // Go to previous section
                  setActiveSection(appropriateSections[currentIndex - 1]);
                } else {
                  // If at first section, go back to role selection
                  setStep(1);
                  setForm(INITIAL_FORM);
                }
              }}
            >
              Back
            </Button>
            <div className="flex gap-4">
               {activeSection !== STAFF_SECTIONS.ACCOUNT && activeSection !== FORM_SECTIONS.EMERGENCY ? (
                 <Button 
                   type="button" size="lg" className="rounded-xl px-10"
                   onClick={() => {
                     const appropriateSections = form.role === 'doctor' ? Object.values(FORM_SECTIONS) : Object.values(STAFF_SECTIONS);
                     const currentIndex = appropriateSections.indexOf(activeSection);
                     if (currentIndex < appropriateSections.length - 1) {
                       setActiveSection(appropriateSections[currentIndex + 1]);
                     }
                   }}
                 >
                   Continue to Next Section
                 </Button>
               ) : (
                 <Button type="submit" size="lg" disabled={loading} className="rounded-xl px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                   {loading ? 'Creating Account...' : `Create ${ROLE_LABELS[form.role]}`}
                   {!loading && <UserPlus className="ml-2 h-4 w-4" />}
                 </Button>
               )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-8">
      {/* Breadcrumbs / Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => (step === 1 ? navigate(-1) : setStep(1))} className="rounded-full hover:bg-background">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Home className="h-3 w-3" />
              <span>Administration</span>
              <X className="h-2 w-2" />
              <span>User Management</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          </div>
        </div>
        {step === 2 && (
          <div className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${ROLE_COLORS[form.role]}`}>
            {ROLE_LABELS[form.role]} Role Selected
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="selection" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
             {renderRoleSelection()}
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
             {form.role === 'doctor' ? renderDoctorForm() : renderStaffForm()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, type = 'text', placeholder, required, value, onChange, icon: Icon, maxLength, error, max, readOnly }) {
  return (
    <div className="space-y-2">
      <label className={`text-sm font-semibold flex items-center gap-1.5 ${error ? 'text-red-500' : ''}`}>
        {Icon && <Icon className={`h-3.5 w-3.5 ${error ? 'text-red-500' : 'text-muted-foreground'}`} />}
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value || ''}
        maxLength={maxLength}
        max={max}
        readOnly={readOnly}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-4 focus:ring-primary/5 outline-none font-medium ${readOnly ? 'bg-muted cursor-not-allowed border-border' : (error ? 'border-red-500 bg-background' : 'border-border focus:border-primary bg-background')}`}
        onChange={e => !readOnly && onChange(e.target.value)}
      />
      {error && (
        <p className="text-[10px] font-bold text-red-500 italic flex items-center gap-1 pl-1">
          <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" /> {error}
        </p>
      )}
    </div>
  );
}

function ArrayField({ label, placeholder, items = [], onAdd, onRemove, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="h-7 rounded-lg text-[10px] uppercase font-bold tracking-wider">
           + Add Row
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={`${label}-${i}`} className="flex gap-2">
            <input
              type="text"
              placeholder={placeholder}
              value={item || ''}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary outline-none"
              onChange={e => onChange(i, e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(i)} className="rounded-xl text-destructive hover:bg-destructive/10">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground italic pl-1">No items added yet.</p>}
      </div>
    </div>
  );
}

function UploadBox({ label, subtitle, icon: Icon, value, onSelect }) {
  const fileInputRef = import.meta.env.PROD ? null : { current: null }; // placeholder

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  };

  return (
    <div className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 transition-all hover:border-primary hover:bg-primary/5">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        id={`upload-${label}`}
        onChange={handleFileChange}
      />
      {value ? (
         <div className="relative aspect-square w-24 overflow-hidden rounded-xl bg-muted ring-2 ring-primary ring-offset-2">
            <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onSelect(null)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white shadow-lg transition-transform hover:rotate-90">
              <X className="h-3 w-3" />
            </button>
            <div className="absolute inset-x-0 bottom-0 bg-primary/80 py-0.5 text-[8px] font-bold text-white text-center uppercase tracking-tighter">
              Selected
            </div>
         </div>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm transition-transform group-hover:scale-110">
            <Icon className="h-7 w-7" />
          </div>
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">{subtitle}</p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-6 rounded-lg font-bold"
            onClick={() => document.getElementById(`upload-${label}`).click()}
          >
             Select Photo
          </Button>
        </>
      )}
    </div>
  );
}
