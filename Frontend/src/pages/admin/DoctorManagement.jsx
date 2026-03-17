import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { departmentApi, doctorApi, locationApi, specializationApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { ChevronRight, Eye, History, Plus, RefreshCw, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  title: 'Consultant',
  departmentId: '',
  hospitalLocations: [],
  qualifications: [],
  experienceYears: '',
  consultationFee: '',
  consultationFeeVideo: '',
  about: '',
  expertise: [],
  profileImage: '',
  articles: [],
  media: [],
  locationFees: [],
  isActive: true,
  isPublished: false,
};

export default function DoctorManagement() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [filterOnboarding, setFilterOnboarding] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [lastCredential, setLastCredential] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadMasters = async () => {
    try {
      const [departmentData, locationData] = await Promise.all([
        departmentApi.getAll({ isActive: true }),
        locationApi.getAll({ isActive: true }),
      ]);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
    } catch {
      toast.error('Failed to load doctor master data.');
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getAdminAll({
        search,
        departmentId: filterDepartment || undefined,
        isActive: filterActive || undefined,
        isPublished: filterPublished || undefined,
        onboardingStatus: filterOnboarding || undefined,
      });
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [search, filterDepartment, filterActive, filterPublished, filterOnboarding]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setForm(initialForm);
    setEditingDoctor(null);
    setShowForm(false);
  };

  const startEdit = (doctor) => {
    setLastCredential(null);
    setEditingDoctor(doctor);
    setForm({
      firstName: doctor.userId?.firstName || doctor.userId?.name?.split(' ')[0] || '',
      middleName: doctor.userId?.middleName || '',
      lastName: doctor.userId?.lastName || doctor.userId?.name?.split(' ').slice(1).join(' ') || '',
      email: doctor.userId?.email || '',
      phone: doctor.userId?.phone || '',
      title: doctor.title || 'Consultant',
      departmentId: doctor.departmentId?._id || '',
      hospitalLocations: (doctor.hospitalLocations || []).map((item) => item._id),
      qualifications: doctor.qualifications || [],
      experienceYears: doctor.experienceYears ?? '',
      consultationFee: doctor.consultationFee ?? '',
      consultationFeeVideo: doctor.consultationFeeVideo ?? '',
      about: doctor.about || '',
      expertise: doctor.expertise || [],
      profileImage: doctor.profileImage || doctor.userId?.profileImage || '',
      articles: doctor.articles || [],
      media: doctor.media || [],
      locationFees: doctor.locationFees || [],
      isActive: doctor.isActive,
      isPublished: doctor.isPublished,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }

    setSaving(true);
    try {
      const cleanedArticles = (form.articles || [])
        .map((item) => ({
          title: item.title?.trim() || '',
          date: item.date?.trim() || '',
          link: item.link?.trim() || '',
          image: item.image?.trim() || '',
        }))
        .filter((item) => item.title || item.link || item.date || item.image);

      const cleanedMedia = (form.media || [])
        .map((item) => ({
          type: item.type || 'video',
          title: item.title?.trim() || '',
          url: item.url?.trim() || '',
          thumbnail: item.thumbnail?.trim() || '',
        }))
        .filter((item) => item.title || item.url || item.thumbnail);

      const cleanedLocationFees = (form.locationFees || [])
        .map((item) => ({
          locationId: item.locationId || '',
          fee: Number(item.fee) || 0,
        }))
        .filter((item) => item.locationId);

      const payload = {
        ...form,
        hospitalLocations: Array.isArray(form.hospitalLocations) ? form.hospitalLocations : [],
        qualifications: form.qualifications,
        expertise: form.expertise,
        articles: cleanedArticles,
        media: cleanedMedia,
        locationFees: cleanedLocationFees,
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: Number(form.consultationFee) || 0,
        consultationFeeVideo: form.consultationFeeVideo === '' ? null : Number(form.consultationFeeVideo) || 0,
      };

      if (editingDoctor) {
        await doctorApi.updateAdminDoctor(editingDoctor.id, payload);
        toast.success('Doctor profile updated successfully.');
      } else {
        const response = await doctorApi.createAdminDoctor(payload);
        setLastCredential(response.temporaryCredential || null);
        toast.success('Doctor created successfully.');
      }

      resetForm();
      loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save doctor.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (doctor) => {
    try {
      await doctorApi.toggleActive(doctor.id);
      toast.success(`${doctor.userId?.name || 'Doctor'} has been ${doctor.isActive ? 'deactivated' : 'activated'}.`);
      loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update doctor status.');
    }
  };

  const handleTogglePublished = async (doctor) => {
    try {
      await doctorApi.togglePublished(doctor.id);
      toast.success(`${doctor.userId?.name || 'Doctor'} has been ${doctor.isPublished ? 'unpublished' : 'published'}.`);
      loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update publish status.');
    }
  };

  const handleSoftDelete = async (doctor) => {
    if (!window.confirm(`Are you sure you want to delete Dr. ${doctor.userId?.name || 'this doctor'}? This action is irreversible.`)) {
      return;
    }

    try {
      await doctorApi.softDelete(doctor.id);
      toast.success('Doctor deleted successfully.');
      loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete doctor.');
    }
  };

  const handleProfileImageUpload = async (doctorId, file) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      await doctorApi.uploadProfileImage(doctorId, formData);
      toast.success('Doctor profile image updated successfully.');
      loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload doctor image.');
    }
  };

  const onboardingOptions = useMemo(
    () => ['created', 'invited', 'profileIncomplete', 'active', 'published', 'suspended'],
    []
  );

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Doctor Administration</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Doctors</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Create doctor employee accounts, assign departments, and locations, and control whether profiles are active and ready for public publishing later.
          </p>
        </div>
        <Button onClick={() => navigate('/employee/manage-roles/add?role=doctor')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {lastCredential && (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">Temporary doctor credential generated</p>
          <p className="mt-2 text-sm text-amber-800">
            Email: <strong>{lastCredential.email}</strong> | Employee ID: <strong>{lastCredential.employeeId}</strong> | Temporary Password: <strong>{lastCredential.temporaryPassword}</strong>
          </p>
          <p className="mt-2 text-xs text-amber-700">This password is returned once at creation time and should be shared securely with the doctor.</p>
        </article>
      )}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr),200px,170px,190px,220px,60px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by doctor name or email"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select value={filterDepartment} onChange={(event) => setFilterDepartment(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select value={filterActive} onChange={(event) => setFilterActive(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All Active</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select value={filterPublished} onChange={(event) => setFilterPublished(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All Published</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        <select value={filterOnboarding} onChange={(event) => setFilterOnboarding(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All Onboarding</option>
          {onboardingOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={loadDoctors}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="doccure-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Doctor Cards</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Quick doctor snapshot</h3>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <>
              <DoctorCardSkeleton />
              <DoctorCardSkeleton />
              <DoctorCardSkeleton />
            </>
          )}
          {!loading && doctors.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No doctors to display yet. New doctor profiles created by admins will appear here automatically.
            </div>
          )}
          {!loading && doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onView={() => { setSelectedDoctor(doctor); setShowDetail(true); }} />
          ))}
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Onboarding</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Loading doctors...</td>
                </tr>
              )}
              {!loading && doctors.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No doctors found.</td>
                </tr>
              )}
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={doctor.profileImage || doctor.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
                        alt={doctor.userId?.name || 'Doctor'}
                        className="h-10 w-10 rounded-full border border-border object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">{doctor.userId?.name}</p>
                        <p className="text-xs text-muted-foreground">{doctor.userId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doctor.departmentId?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">₹{Number(doctor.consultationFee || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${doctor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${doctor.isPublished ? 'bg-sky-100 text-sky-800' : 'bg-muted text-foreground'}`}>
                        {doctor.isPublished ? 'Published' : 'Unpublished'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{doctor.onboardingStatus || 'created'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedDoctor(doctor); setShowDetail(true); }}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(doctor)}>Edit</Button>
                      <Button type="button" variant={doctor.isActive ? 'destructive' : 'outline'} size="sm" onClick={() => handleToggleActive(doctor)}>
                        {doctor.isActive ? <UserX className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                        {doctor.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                       <Button type="button" variant="outline" size="sm" onClick={() => handleTogglePublished(doctor)}>
                        {doctor.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedDoctor(doctor); setShowHistory(true); }}>
                        <History className="mr-1 h-3 w-3" />
                        History
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleSoftDelete(doctor)}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {showForm && (
        <DoctorFormModal
          departments={departments}
          form={form}
          locations={locations}
          onChange={setForm}
          onClose={resetForm}
          onSubmit={handleSubmit}
          saving={saving}
          showPasswordHint={!editingDoctor}
        />
      )}

      {showDetail && selectedDoctor && (
        <DoctorDetailModal
          doctor={selectedDoctor}
          onClose={() => setShowDetail(false)}
          onUploadImage={handleProfileImageUpload}
        />
      )}

      {showHistory && selectedDoctor && (
        <DoctorHistoryModal
          doctor={selectedDoctor}
          onClose={() => setShowHistory(false)}
        />
      )}
    </motion.section>
  );
}

function DoctorHistoryModal({ doctor, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Doctor History</h3>
              <p className="text-sm text-muted-foreground">Detailed activity log for Dr. {doctor.userId?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <Plus className="h-5 w-5 rotate-45" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {(doctor.history || []).length > 0 ? (
              [...(doctor.history || [])].reverse().map((log, idx) => (
                <div key={idx} className="relative flex gap-4">
                  {idx !== (doctor.history?.length || 0) - 1 && (
                    <div className="absolute left-[19px] top-10 h-full w-px bg-border" />
                  )}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm z-10">
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold capitalize text-foreground">{log.action}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                    <div className="flex items-center gap-2">
                       <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {log.performedBy?.name?.charAt(0) || 'S'}
                          </span>
                       </div>
                       <span className="text-xs font-medium text-foreground">
                         {log.performedBy?.name} 
                         <span className="ml-1 text-[10px] uppercase text-muted-foreground font-normal">
                           ({log.performedBy?.role})
                         </span>
                       </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No history records found for this doctor.</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-muted/30 p-4 flex justify-end">
          <Button onClick={onClose} className="rounded-2xl px-8">Close History</Button>
        </div>
      </motion.div>
    </div>
  );
}

const formatDateForInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
};

function DoctorFormModal({ departments, form, locations, onChange, onClose, onSubmit, saving, showPasswordHint }) {
  const toggleArrayValue = (field, value) => {
    const current = form[field] || [];
    const exists = current.includes(value);
    onChange({
      ...form,
      [field]: exists ? current.filter((item) => item !== value) : [...current, value],
    });
  };

  const updateArticle = (index, field, value) => {
    const next = [...(form.articles || [])];
    next[index] = { ...next[index], [field]: value };
    onChange({ ...form, articles: next });
  };

  const addArticle = () => {
    onChange({
      ...form,
      articles: [...(form.articles || []), { title: '', date: '', link: '', image: '' }],
    });
  };

  const removeArticle = (index) => {
    const next = [...(form.articles || [])];
    next.splice(index, 1);
    onChange({ ...form, articles: next });
  };

  const updateMedia = (index, field, value) => {
    const next = [...(form.media || [])];
    next[index] = { ...next[index], [field]: value };
    onChange({ ...form, media: next });
  };

  const addMedia = () => {
    onChange({
      ...form,
      media: [...(form.media || []), { type: 'video', title: '', url: '', thumbnail: '' }],
    });
  };

  const removeMedia = (index) => {
    const next = [...(form.media || [])];
    next.splice(index, 1);
    onChange({ ...form, media: next });
  };

  const updateLocationFee = (index, field, value) => {
    const next = [...(form.locationFees || [])];
    next[index] = { ...next[index], [field]: value };
    onChange({ ...form, locationFees: next });
  };

  const addLocationFee = () => {
    onChange({
      ...form,
      locationFees: [...(form.locationFees || []), { locationId: '', fee: '' }],
    });
  };

  const removeLocationFee = (index) => {
    const next = [...(form.locationFees || [])];
    next.splice(index, 1);
    onChange({ ...form, locationFees: next });
  };

  const [newSpecName, setNewSpecName] = useState('');

  // eslint-disable-next-line no-unused-vars
  const handleCreateSpecialization = async () => {
    if (!form.departmentId) {
      toast.error('Select a department first.');
      return;
    }
    if (!newSpecName.trim()) {
      toast.error('Enter a specialization name.');
      return;
    }
    try {
      await specializationApi.create({ name: newSpecName.trim(), departmentId: form.departmentId });
      toast.success('Specialization created.');
      setNewSpecName('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create specialization.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{showPasswordHint ? 'Create Doctor' : 'Edit Doctor'}</h3>
            {showPasswordHint && (
              <p className="mt-1 text-sm text-muted-foreground">A temporary password will be generated automatically when you create this doctor account.</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="First Name">
            <input type="text" value={form.firstName} onChange={(e) => onChange({ ...form, firstName: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Middle Name">
            <input type="text" value={form.middleName} onChange={(e) => onChange({ ...form, middleName: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
          <Field label="Last Name">
            <input type="text" value={form.lastName} onChange={(e) => onChange({ ...form, lastName: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Email" className="md:col-span-1">
            <input type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Phone">
            <input type="text" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
          <Field label="Title">
            <input type="text" value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Department">
            <select value={form.departmentId} onChange={(e) => onChange({ ...form, departmentId: e.target.value, specializationIds: [] })} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary" required>
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Consultation Fee">
            <input type="number" value={form.consultationFee} onChange={(e) => onChange({ ...form, consultationFee: e.target.value })} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary" />
          </Field>
          <Field label="Video Consultation Fee (optional)">
            <input type="number" value={form.consultationFeeVideo} onChange={(e) => onChange({ ...form, consultationFeeVideo: e.target.value })} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary" />
          </Field>
          <Field label="Years of Experience">
            <input type="number" value={form.experienceYears} onChange={(e) => onChange({ ...form, experienceYears: e.target.value })} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary" />
          </Field>
          <Field label="Profile Image URL">
            <input type="text" value={form.profileImage} onChange={(e) => onChange({ ...form, profileImage: e.target.value })} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary" />
          </Field>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Qualifications</h4>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...form, qualifications: [...(form.qualifications || []), ''] })}>Add qualification</Button>
          </div>
          {(form.qualifications || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Add qualifications for this doctor.</p>
          )}
          <div className="flex flex-col gap-3">
            {(form.qualifications || []).map((qual, index) => (
              <div key={`param-qual-${index}`} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MCh - Cardiothoracic Surgery"
                  value={qual}
                  onChange={(e) => {
                    const next = [...(form.qualifications || [])];
                    next[index] = e.target.value;
                    onChange({ ...form, qualifications: next });
                  }}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => {
                  const next = [...(form.qualifications || [])];
                  next.splice(index, 1);
                  onChange({ ...form, qualifications: next });
                }}>Remove</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Expertise</h4>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...form, expertise: [...(form.expertise || []), ''] })}>Add expertise</Button>
          </div>
          {(form.expertise || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Add areas of expertise for this doctor.</p>
          )}
          <div className="flex flex-col gap-3">
            {(form.expertise || []).map((exp, index) => (
              <div key={`param-exp-${index}`} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Heart Transplantation"
                  value={exp}
                  onChange={(e) => {
                    const next = [...(form.expertise || [])];
                    next[index] = e.target.value;
                    onChange({ ...form, expertise: next });
                  }}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => {
                  const next = [...(form.expertise || [])];
                  next.splice(index, 1);
                  onChange({ ...form, expertise: next });
                }}>Remove</Button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Bio / About" className="mt-4">
          <textarea value={form.about} onChange={(e) => onChange({ ...form, about: e.target.value })} className="min-h-[120px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary" />
        </Field>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Articles</h4>
            <Button type="button" variant="outline" size="sm" onClick={addArticle}>Add article</Button>
          </div>
          {(form.articles || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Add articles written by this doctor.</p>
          )}
          {(form.articles || []).map((article, index) => (
            <div key={`article-${index}`} className="rounded-2xl border border-border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Article title"
                  value={article.title || ''}
                  onChange={(e) => updateArticle(index, 'title', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  type="date"
                  placeholder="Publish date"
                  value={formatDateForInput(article.date)}
                  onChange={(e) => updateArticle(index, 'date', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary dark:[color-scheme:dark]"
                />
              </div>
              <input
                type="text"
                placeholder="Article link"
                value={article.link || ''}
                onChange={(e) => updateArticle(index, 'link', e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Thumbnail image URL (optional)"
                value={article.image || ''}
                onChange={(e) => updateArticle(index, 'image', e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <div className="flex justify-end">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeArticle(index)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Location-based fees (optional)</h4>
            <Button type="button" variant="outline" size="sm" onClick={addLocationFee}>Add location fee</Button>
          </div>
          {(form.locationFees || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Set optional fees per hospital location.</p>
          )}
          {(form.locationFees || []).map((feeRow, index) => (
            <div key={`location-fee-${index}`} className="rounded-2xl border border-border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={feeRow.locationId || ''}
                  onChange={(e) => updateLocationFee(index, 'locationId', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Select location</option>
                  {locations.map((item) => (
                    <option key={item._id} value={item._id}>{item.name} ({item.city})</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Fee"
                  value={feeRow.fee || ''}
                  onChange={(e) => updateLocationFee(index, 'fee', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeLocationFee(index)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Media</h4>
            <Button type="button" variant="outline" size="sm" onClick={addMedia}>Add media</Button>
          </div>
          {(form.media || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Add videos, images, or other media for this doctor.</p>
          )}
          {(form.media || []).map((mediaItem, index) => (
            <div key={`media-${index}`} className="rounded-2xl border border-border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  value={mediaItem.type || 'video'}
                  onChange={(e) => updateMedia(index, 'type', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="article">Article</option>
                </select>
                <input
                  type="text"
                  placeholder="Media title"
                  value={mediaItem.title || ''}
                  onChange={(e) => updateMedia(index, 'title', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Media URL"
                  value={mediaItem.url || ''}
                  onChange={(e) => updateMedia(index, 'url', e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <input
                type="text"
                placeholder="Thumbnail URL (optional)"
                value={mediaItem.thumbnail || ''}
                onChange={(e) => updateMedia(index, 'thumbnail', e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <div className="flex justify-end">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeMedia(index)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Field label="Hospital Locations">
            <div className="rounded-2xl border border-border p-4">
              <div className="space-y-2">
                {locations.map((item) => (
                  <label key={item._id} className="flex items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.hospitalLocations.includes(item._id)}
                      onChange={() => toggleArrayValue('hospitalLocations', item._id)}
                      className="accent-primary"
                    />
                    {item.name} ({item.city})
                  </label>
                ))}
              </div>
            </div>
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
            <input type="checkbox" checked={form.isActive} onChange={(e) => onChange({ ...form, isActive: e.target.checked })} />
            Active internally
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => onChange({ ...form, isPublished: e.target.checked })} />
            Published for future public visibility
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : showPasswordHint ? 'Create Doctor' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}

function DoctorDetailModal({ doctor, onClose, onUploadImage }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Doctor Profile</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
          <article className="rounded-2xl border border-border p-5 text-center">
            <img
              src={doctor.profileImage || doctor.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.userId?.name || 'Doctor')}`}
              alt={doctor.userId?.name || 'Doctor'}
              className="mx-auto h-28 w-28 rounded-full border border-border object-cover"
            />
            <label className="mt-4 inline-flex cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Update Photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadImage(doctor.id, e.target.files[0])} />
            </label>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Name" value={doctor.userId?.name} />
            <Detail label="Email" value={doctor.userId?.email} />
            <Detail label="Employee ID" value={doctor.userId?.employeeId} />
            <Detail label="Department" value={doctor.departmentId?.name} />
            <Detail label="Title" value={doctor.title} />
            <Detail label="Fee" value={`₹${Number(doctor.consultationFee || 0).toLocaleString()}`} />
            <Detail label="Experience" value={`${doctor.experienceYears || 0} years`} />
            <Detail label="Onboarding" value={doctor.onboardingStatus} />
            <Detail label="Locations" value={Array.isArray(doctor.hospitalLocations) ? doctor.hospitalLocations.map((item) => `${item.name}${item.city ? ` (${item.city})` : ''}`).join(', ') : '—'} className="md:col-span-2" />
            <Detail label="Qualifications" value={Array.isArray(doctor.qualifications) ? doctor.qualifications.join(', ') : (typeof doctor.qualifications === 'string' ? doctor.qualifications : '—')} className="md:col-span-2" />
            <Detail label="Expertise" value={Array.isArray(doctor.expertise) ? doctor.expertise.join(', ') : (typeof doctor.expertise === 'string' ? doctor.expertise : '—')} className="md:col-span-2" />
            <Detail label="About" value={doctor.about || '—'} className="md:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Detail({ className = '', label, value }) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );
}

function DoctorCard({ doctor, onView }) {
  const name = doctor.userId?.name || 'Doctor';
  const email = doctor.userId?.email || 'No email';
  const department = doctor.departmentId?.name || 'No department';
  return (
    <div className="doccure-card-soft p-5">
      <div className="flex items-start gap-4">
        <img
          src={doctor.profileImage || doctor.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`}
          alt={name}
          className="h-14 w-14 rounded-2xl border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <p className="mt-2 text-xs text-muted-foreground">{department}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${doctor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {doctor.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className={`rounded-full px-2.5 py-1 font-semibold ${doctor.isPublished ? 'bg-sky-100 text-sky-700' : 'bg-muted text-foreground'}`}>
          {doctor.isPublished ? 'Published' : 'Unpublished'}
        </span>
      </div>
      <button
        type="button"
        onClick={onView}
        className="mt-4 w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        View profile
      </button>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div className="doccure-card-soft p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-8 w-full rounded-xl bg-muted" />
    </div>
  );
}
