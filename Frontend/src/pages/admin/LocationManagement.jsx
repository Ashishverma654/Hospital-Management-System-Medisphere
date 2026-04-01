import { useEffect, useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { locationApi, fileApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, UserCheck, UserX, History, Clock, User, Calendar, Shield, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer } from '../../lib/animation-variants.js'; 
import { INDIAN_STATES, STATE_DISTRICTS } from '../../utils/locationData.js';

const initialForm = {
  name: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  address: '',
  phone: '',
  email: '',
  mapUrl: '',
  image: '',
  locationType: 'hospital',
};

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Validation Logic
  useEffect(() => {
    if (!showForm) {
      setErrors({});
      return;
    }
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Location name is required';
    if (!form.state) newErrors.state = 'State is required';
    if (!form.city && !form.district) newErrors.city = 'District/City is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) {
      newErrors.pincode = '6-digit pincode required';
    } else if (!form.pincode) {
      newErrors.pincode = 'Pincode is required';
    }

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
  }, [form, showForm]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await locationApi.getAll({
        search,
        isActive: filterStatus || undefined,
      });
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [search, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
    setSubmitAttempted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size should be less than 5MB');
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fileApi.uploadImage(formData);
      setForm((prev) => ({ ...prev, image: res.url || res.data?.url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return toast.error('Please fix the errors before saving.');
    setSaving(true);
    try {
      if (editingItem) {
        await locationApi.update(editingItem._id, form);
        toast.success('Location updated successfully.');
      } else {
        await locationApi.create(form);
        toast.success('Location created successfully.');
      }
      resetForm();
      loadLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await locationApi.toggleActive(item._id);
      toast.success(`${item.name} has been ${item.isActive ? 'deactivated' : 'activated'}.`);
      loadLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update location.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Hospital Locations</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Manage hospital branches and care locations so later doctor assignment, public discovery, and booking filters use one clean source of truth.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setForm(initialForm);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or city"
            className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button type="button" variant="outline" onClick={loadLocations}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Pincode</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading locations...</td>
                </tr>
              )}
              {!loading && locations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No locations found.</td>
                </tr>
              )}
              {locations.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-10 w-10 shrink-0 rounded-lg object-cover bg-muted" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Plus className="h-5 w-5" />
                        </div>
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.city}{item.state ? `, ${item.state}` : ''}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.address}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{item.pincode || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.phone || item.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setForm({
                            name: item.name || '',
                            city: item.city || '',
                            district: item.district || '',
                            state: item.state || '',
                            pincode: item.pincode || '',
                            address: item.address || '',
                            phone: item.phone || '',
                            email: item.email || '',
                            mapUrl: item.mapUrl || '',
                            image: item.image || '',
                            locationType: item.locationType || 'hospital',
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowHistory(item)}
                        title="View History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant={item.isActive ? 'destructive' : 'outline'} size="sm" onClick={() => handleToggle(item)}>
                        {item.isActive ? <UserX className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm text-foreground">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Location History</h3>
                    <p className="text-sm text-muted-foreground">{showHistory.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistory(null)} 
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="mt-8 space-y-6">
                {/* Creation Info */}
                <div className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[2px] before:bg-border last:before:hidden">
                  <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-2 border-primary bg-background flex items-center justify-center z-10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Plus className="h-4 w-4 text-emerald-500" />
                      Created On
                    </p>
                    <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(showHistory.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} at {new Date(showHistory.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Created by: <span className="font-semibold text-foreground">{showHistory.createdBy?.name || 'System'}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/60 ml-7">
                        <Shield className="h-3 w-3" />
                        <span className="capitalize">{showHistory.createdBy?.role || 'admin'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Update Info */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-2 border-primary bg-background flex items-center justify-center z-10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      Last Updated
                    </p>
                    <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(showHistory.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })} at {new Date(showHistory.updatedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Last modified by: <span className="font-semibold text-foreground">{showHistory.updatedBy?.name || 'System'}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/60 ml-7">
                        <Shield className="h-3 w-3" />
                        <span className="capitalize">{showHistory.updatedBy?.role || 'admin'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Button 
                  onClick={() => setShowHistory(null)} 
                  className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
                >
                  Close History
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-xl font-semibold text-foreground">{editingItem ? 'Edit Location' : 'Add Location'}</h3>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Location Name *" error={submitAttempted ? errors.name : null}>
                <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.name) ? 'border-red-500' : 'border-border'}`} required />
              </Field>
              <Field label="Location Type">
                <select value={form.locationType} onChange={(e) => setForm((c) => ({ ...c, locationType: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="lab">Lab</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="State *" error={submitAttempted ? errors.state : null}>
                <select 
                  value={form.state} 
                  onChange={(e) => setForm((c) => ({ ...c, state: e.target.value, city: '', district: '' }))} 
                  className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.state) ? 'border-red-500' : 'border-border'}`}
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="District/City *" error={submitAttempted ? errors.city : null}>
                <select 
                  value={form.city || form.district} 
                  onChange={(e) => setForm((c) => ({ ...c, city: e.target.value, district: e.target.value }))} 
                  className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.city) ? 'border-red-500' : 'border-border'}`}
                  required
                  disabled={!form.state}
                >
                  <option value="">Select District</option>
                  {form.state && STATE_DISTRICTS[form.state]?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Pincode *" error={submitAttempted ? errors.pincode : null}>
                <input type="text" maxLength="6" value={form.pincode} onChange={(e) => setForm((c) => ({ ...c, pincode: e.target.value.replace(/\D/g, '') }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.pincode) ? 'border-red-500' : 'border-border'}`} required />
              </Field>
              <Field label="Phone" error={submitAttempted ? errors.phone : null}>
                <input 
                  type="text" 
                  maxLength="10"
                  value={form.phone} 
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value.replace(/\D/g, '') }))} 
                  className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.phone) ? 'border-red-500' : 'border-border'}`} 
                  placeholder="10-digit mobile number"
                />
              </Field>
              <Field label="Email" error={submitAttempted ? errors.email : null}>
                <input type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.email) ? 'border-red-500' : 'border-border'}`} />
              </Field>
              <Field label="Map URL">
                <input type="text" value={form.mapUrl} onChange={(e) => setForm((c) => ({ ...c, mapUrl: e.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>
            
            <Field label="Location Image" className="mt-4">
              <div className="flex items-center gap-4">
                {form.image ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
                    <img src={form.image} alt="Location" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <Camera className="mb-1 h-6 w-6" />
                    <span className="text-[10px] font-medium">{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  </button>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Recommended size: 800x600px</p>
                  <p>Max file size: 5MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </Field>

            <Field label="Address *" className="mt-4" error={submitAttempted ? errors.address : null}>
              <textarea value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} className={`min-h-[110px] w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.address) ? 'border-red-500' : 'border-border'}`} required />
            </Field>
 
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving || (submitAttempted && Object.keys(errors).length > 0)}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Location'}</Button>
            </div>
          </form>
        </div>
      )}
    </motion.section>
  );
}

function Field({ children, className = '', label, error }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-[11px] font-bold text-red-500 italic pl-1 flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" /> {error}
      </p>}
    </div>
  );
}
