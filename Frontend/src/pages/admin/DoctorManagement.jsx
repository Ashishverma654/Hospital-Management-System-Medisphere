import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { departmentApi, doctorApi, locationApi, specializationApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Eye, Plus, RefreshCw, Search, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  title: 'Consultant',
  departmentId: '',
  specializationIds: [],
  hospitalLocations: [],
  qualifications: '',
  experienceYears: '',
  consultationFee: '',
  about: '',
  expertise: '',
  profileImage: '',
  isActive: true,
  isPublished: false,
  isFeatured: false,
  featureOrder: '',
};

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
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
  }, [search, filterDepartment, filterActive, filterPublished, filterOnboarding]);

  useEffect(() => {
    const loadSpecializations = async () => {
      if (!form.departmentId) {
        setSpecializations([]);
        return;
      }

      try {
        const data = await specializationApi.getAll({ departmentId: form.departmentId, isActive: true });
        setSpecializations(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load specializations for that department.');
      }
    };

    loadSpecializations();
  }, [form.departmentId]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingDoctor(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setLastCredential(null);
    setEditingDoctor(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const startEdit = (doctor) => {
    setLastCredential(null);
    setEditingDoctor(doctor);
    setForm({
      name: doctor.userId?.name || '',
      email: doctor.userId?.email || '',
      phone: doctor.userId?.phone || '',
      title: doctor.title || 'Consultant',
      departmentId: doctor.departmentId?._id || '',
      specializationIds: (doctor.specializationIds || []).map((item) => item._id),
      hospitalLocations: (doctor.hospitalLocations || []).map((item) => item._id),
      qualifications: (doctor.qualifications || []).join(', '),
      experienceYears: doctor.experienceYears ?? '',
      consultationFee: doctor.consultationFee ?? '',
      about: doctor.about || '',
      expertise: (doctor.expertise || []).join(', '),
      profileImage: doctor.profileImage || doctor.userId?.profileImage || '',
      isActive: doctor.isActive,
      isPublished: doctor.isPublished,
      isFeatured: doctor.isFeatured || false,
      featureOrder: doctor.featureOrder ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        qualifications: form.qualifications,
        expertise: form.expertise,
        experienceYears: Number(form.experienceYears) || 0,
        consultationFee: Number(form.consultationFee) || 0,
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
            Create doctor employee accounts, assign departments, multiple specializations, and locations, and control whether profiles are active and ready for public publishing later.
          </p>
        </div>
        <Button onClick={startCreate}>
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
                <th className="px-4 py-3 font-medium">Specializations</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Featured</th>
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
                  <td className="px-4 py-3 text-muted-foreground">{(doctor.specializationIds || []).map((item) => item.name).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">₹{Number(doctor.consultationFee || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {doctor.isFeatured ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Featured #{doctor.featureOrder || 0}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
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
          specializations={specializations}
        />
      )}

      {showDetail && selectedDoctor && (
        <DoctorDetailModal
          doctor={selectedDoctor}
          onClose={() => setShowDetail(false)}
          onUploadImage={handleProfileImageUpload}
        />
      )}
    </motion.section>
  );
}

function DoctorFormModal({ departments, form, locations, onChange, onClose, onSubmit, saving, showPasswordHint, specializations }) {
  const toggleArrayValue = (field, value) => {
    const current = form[field] || [];
    const exists = current.includes(value);
    onChange({
      ...form,
      [field]: exists ? current.filter((item) => item !== value) : [...current, value],
    });
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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Doctor Name">
            <input type="text" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Phone">
            <input type="text" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
          <Field label="Title">
            <input type="text" value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required />
          </Field>
          <Field label="Department">
            <select value={form.departmentId} onChange={(e) => onChange({ ...form, departmentId: e.target.value, specializationIds: [] })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Consultation Fee">
            <input type="number" value={form.consultationFee} onChange={(e) => onChange({ ...form, consultationFee: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
          <Field label="Years of Experience">
            <input type="number" value={form.experienceYears} onChange={(e) => onChange({ ...form, experienceYears: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
          <Field label="Profile Image URL">
            <input type="text" value={form.profileImage} onChange={(e) => onChange({ ...form, profileImage: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
          <Field label="Feature Order">
            <input type="number" value={form.featureOrder} onChange={(e) => onChange({ ...form, featureOrder: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
          </Field>
        </div>

        <Field label="Qualifications (comma separated)" className="mt-4">
          <input type="text" value={form.qualifications} onChange={(e) => onChange({ ...form, qualifications: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
        </Field>

        <Field label="Expertise (comma separated)" className="mt-4">
          <input type="text" value={form.expertise} onChange={(e) => onChange({ ...form, expertise: e.target.value })} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
        </Field>

        <Field label="Bio / About" className="mt-4">
          <textarea value={form.about} onChange={(e) => onChange({ ...form, about: e.target.value })} className="min-h-[120px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
        </Field>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Specializations">
            <div className="rounded-2xl border border-border p-4">
              {specializations.length === 0 && <p className="text-sm text-muted-foreground">Select a department to load valid specializations.</p>}
              <div className="space-y-2">
                {specializations.map((item) => (
                  <label key={item._id} className="flex items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.specializationIds.includes(item._id)}
                      onChange={() => toggleArrayValue('specializationIds', item._id)}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
          </Field>
          <Field label="Hospital Locations">
            <div className="rounded-2xl border border-border p-4">
              <div className="space-y-2">
                {locations.map((item) => (
                  <label key={item._id} className="flex items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.hospitalLocations.includes(item._id)}
                      onChange={() => toggleArrayValue('hospitalLocations', item._id)}
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
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground md:col-span-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => onChange({ ...form, isFeatured: e.target.checked })} />
            Feature this doctor on the public website
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
            <Detail label="Specializations" value={(doctor.specializationIds || []).map((item) => item.name).join(', ') || '—'} className="md:col-span-2" />
            <Detail label="Locations" value={(doctor.hospitalLocations || []).map((item) => `${item.name}${item.city ? ` (${item.city})` : ''}`).join(', ') || '—'} className="md:col-span-2" />
            <Detail label="Qualifications" value={(doctor.qualifications || []).join(', ') || '—'} className="md:col-span-2" />
            <Detail label="Expertise" value={(doctor.expertise || []).join(', ') || '—'} className="md:col-span-2" />
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
  const specializations = (doctor.specializationIds || []).map((item) => item.name).join(', ') || 'No specializations';
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
          <p className="text-xs text-muted-foreground line-clamp-2">{specializations}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${doctor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {doctor.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className={`rounded-full px-2.5 py-1 font-semibold ${doctor.isPublished ? 'bg-sky-100 text-sky-700' : 'bg-muted text-foreground'}`}>
          {doctor.isPublished ? 'Published' : 'Unpublished'}
        </span>
        {doctor.isFeatured && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
            Featured #{doctor.featureOrder || 0}
          </span>
        )}
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
