import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { awardApi, doctorApi, locationApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { Plus, RefreshCw, Search, Eye, EyeOff, Star, ArrowUpRight, Award as AwardIcon, History, Clock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

const initialForm = {
  type: 'hospital',
  doctorId: '',
  title: '',
  category: 'Hospital Excellence',
  organization: '',
  issuedByType: 'Government',
  awardDate: '',
  location: '',
  description: '',
  certificateUrl: '',
  isPublic: true,
  featured: false,
  displayOrder: 0,
  status: 'Active',
};

const CATEGORIES = ['Hospital Excellence', 'Doctor Achievement', 'Patient Care', 'Innovation', 'Accreditation'];
const ISSUED_BY_TYPES = ['Government', 'Private Organization', 'International Body'];

export default function AwardManagement() {
  const [awards, setAwards] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const data = await awardApi.getAll({ search, type: filterType || undefined, status: filterStatus || undefined });
      setAwards(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load awards.');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [docs, locs] = await Promise.all([
        doctorApi.getAdminAll({ isActive: true }),
        locationApi.getAll({ isActive: true })
      ]);
      setDoctors(Array.isArray(docs) ? docs : []);
      setLocations(Array.isArray(locs) ? locs : []);
    } catch {
      toast.error('Failed to load dependency data.');
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    loadAwards();
  }, [search, filterType, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validation Logic
  useEffect(() => {
    if (!showForm) {
      setErrors({});
      return;
    }
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.organization.trim()) newErrors.organization = 'Issuing organization is required';
    if (!form.awardDate) newErrors.awardDate = 'Award date is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (form.type === 'doctor' && !form.doctorId) newErrors.doctorId = 'Select a doctor';
    if (!editingItem && !imageFile) newErrors.image = 'Award image is required';
    if (form.certificateUrl && !/^https?:\/\/.+/.test(form.certificateUrl)) newErrors.certificateUrl = 'Enter a valid URL (http:// or https://)';
    
    setErrors(newErrors);
  }, [form, showForm, imageFile, editingItem]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingItem(null);
    setShowForm(false);
    setSubmitAttempted(false);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('Image size must be less than 5MB');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return toast.error('Please fix the errors before saving.');
    
    setSaving(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      formData.append(key, form[key]);
    });
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editingItem) {
        await awardApi.update(editingItem._id, formData);
        toast.success('Award updated successfully.');
      } else {
        await awardApi.create(formData);
        toast.success('Award created successfully.');
      }
      resetForm();
      loadAwards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save award.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await awardApi.toggleActive(item._id);
      toast.success(`Award status updated.`);
      loadAwards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update award.');
    }
  };

  const openHistory = async (item) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const logs = await awardApi.getHistory(item._id);
      setHistoryLogs(Array.isArray(logs) ? logs : []);
    } catch {
      toast.error('Failed to load history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <AwardIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Reputation Management</p>
            <h2 className="mt-1 text-3xl font-semibold text-foreground">Awards & Achievements</h2>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="h-12 rounded-2xl px-6">
          <Plus className="mr-2 h-5 w-5" />
          New Award
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or organization"
            className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary transition-all shadow-sm"
        >
          <option value="">All Types</option>
          <option value="hospital">Hospital</option>
          <option value="doctor">Doctor</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary transition-all shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Hidden">Hidden</option>
        </select>
        <Button type="button" variant="outline" onClick={loadAwards} className="h-auto rounded-2xl p-3.5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="px-6 py-4 font-semibold">Award Details</th>
                <th className="px-6 py-4 font-semibold">Organization</th>
                <th className="px-6 py-4 font-semibold text-center">Featured</th>
                <th className="px-6 py-4 font-semibold text-center">Visibility</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">Loading records...</td></tr>
              ) : awards.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No awards found.</td></tr>
              ) : awards.map((item) => (
                <tr key={item._id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover bg-muted border border-border" />
                      <div>
                        <p className="font-bold text-foreground line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.category} &bull; {new Date(item.awardDate).getFullYear()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{item.organization}</p>
                    <p className="text-xs text-muted-foreground">{item.issuedByType}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.featured ? <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" /> : <Star className="mx-auto h-5 w-5 text-muted-foreground/30" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.isPublic ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">Public</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-bold text-slate-500">Admin Only</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-border" onClick={() => {
                        setEditingItem(item);
                        setForm({
                          ...item,
                          awardDate: item.awardDate ? item.awardDate.split('T')[0] : '',
                          location: item.location?._id || '',
                          doctorId: item.doctorId?._id || '',
                        });
                        setImagePreview(item.image);
                        setShowForm(true);
                      }}>Edit</Button>
                      <Button variant={item.status === 'Active' ? 'ghost' : 'outline'} size="sm" className="h-9 rounded-xl border-border" onClick={() => handleToggle(item)}>
                        {item.status === 'Active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-border hover:bg-primary/5 hover:text-primary" onClick={() => openHistory(item)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.form 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSubmit} 
              className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-card shadow-2xl border border-border flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-8 py-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{editingItem ? 'Edit Award Record' : 'Post New Achievement'}</h3>
                  <p className="text-sm text-muted-foreground">Complete all fields to maintain data integrity and public credibility.</p>
                </div>
                <button type="button" onClick={resetForm} className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">✕</button>
              </div>

              <div className="overflow-y-auto p-8 custom-scrollbar">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <Field label="Award Title *" error={submitAttempted ? errors.title : null}>
                      <input type="text" value={form.title} onChange={(e) => setForm(c => ({...c, title: e.target.value}))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.title) ? 'border-red-500' : 'border-border'}`} placeholder="e.g. Best Specialized Hospital 2026" />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Category *">
                        <select value={form.category} onChange={(e) => setForm(c => ({...c, category: e.target.value}))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Award Date *" error={submitAttempted ? errors.awardDate : null}>
                        <input type="date" value={form.awardDate} onChange={(e) => setForm(c => ({...c, awardDate: e.target.value}))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.awardDate) ? 'border-red-500' : 'border-border'}`} />
                      </Field>
                    </div>

                    <Field label="Organization *" error={submitAttempted ? errors.organization : null}>
                      <input type="text" value={form.organization} onChange={(e) => setForm(c => ({...c, organization: e.target.value}))} className={`w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.organization) ? 'border-red-500' : 'border-border'}`} placeholder="Issuing Body" />
                    </Field>

                    <Field label="Issued By Type">
                      <select value={form.issuedByType} onChange={(e) => setForm(c => ({...c, issuedByType: e.target.value}))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                        {ISSUED_BY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>

                  <div className="space-y-6">
                    <Field label="Award Image *" error={submitAttempted ? errors.image : null}>
                      <div className="relative group">
                        <input type="file" onChange={handleImageChange} className="absolute inset-0 z-10 cursor-pointer opacity-0" accept="image/*" />
                        <div className={`flex aspect-video flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${imagePreview ? 'border-primary bg-primary/5' : (submitAttempted && errors.image) ? 'border-red-500 bg-red-500/5' : 'border-border bg-muted/30 group-hover:border-primary/50'}`}>
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-full w-full rounded-2xl object-cover" />
                          ) : (
                            <>
                              <Plus className="mb-2 h-8 w-8 text-muted-foreground" />
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Click to upload</p>
                            </>
                          )}
                        </div>
                      </div>
                    </Field>

                    <Field label="Mapping (Optional)">
                      <div className="grid grid-cols-2 gap-4">
                        <select value={form.type} onChange={(e) => setForm(c => ({...c, type: e.target.value, doctorId: ''}))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                          <option value="hospital">Hospital Wide</option>
                          <option value="doctor">Specific Doctor</option>
                        </select>
                        {form.type === 'doctor' ? (
                          <select value={form.doctorId} onChange={(e) => setForm(c => ({...c, doctorId: e.target.value}))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select Doctor</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.userId?.name}</option>)}
                          </select>
                        ) : (
                          <select value={form.location} onChange={(e) => setForm(c => ({...c, location: e.target.value}))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                            <option value="">All Locations</option>
                            {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                          </select>
                        )}
                      </div>
                    </Field>
                  </div>
                </div>

                <Field label="Detailed Description *" className="mt-6" error={submitAttempted ? errors.description : null}>
                  <textarea value={form.description} onChange={(e) => setForm(c => ({...c, description: e.target.value}))} className={`min-h-[120px] w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.description) ? 'border-red-500' : 'border-border'}`} placeholder="Briefly explain the significance of this award..." />
                </Field>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Field label="Verification URL (Proof)" error={submitAttempted ? errors.certificateUrl : null}>
                    <div className="relative">
                      <input type="text" value={form.certificateUrl} onChange={(e) => setForm(c => ({...c, certificateUrl: e.target.value}))} className={`w-full rounded-2xl border bg-background/50 pl-4 pr-12 py-3 outline-none focus:border-primary transition-colors ${(submitAttempted && errors.certificateUrl) ? 'border-red-500' : 'border-border'}`} placeholder="Link to official page" />
                      <ArrowUpRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </Field>
                  <Field label="Display Priority">
                    <input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm(c => ({...c, displayOrder: e.target.value}))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
                  </Field>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <ControlToggle label="Show on Homepage" checked={form.isPublic} onChange={v => setForm(c => ({...c, isPublic: v}))} />
                  <ControlToggle label="Featured (Highlight)" checked={form.featured} onChange={v => setForm(c => ({...c, featured: v}))} />
                  <div className="flex border border-border rounded-2xl overflow-hidden shadow-sm">
                    <button type="button" onClick={() => setForm(c => ({...c, status: 'Active'}))} className={`flex-1 px-4 py-3 text-xs font-black uppercase transition-all ${form.status === 'Active' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground'}`}>Active</button>
                    <button type="button" onClick={() => setForm(c => ({...c, status: 'Hidden'}))} className={`flex-1 px-4 py-3 text-xs font-black uppercase transition-all ${form.status === 'Hidden' ? 'bg-slate-700 text-white' : 'bg-transparent text-muted-foreground'}`}>Hidden</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-8 bg-muted/30 border-t border-border">
                <Button type="button" variant="outline" className="h-14 flex-1 rounded-2xl text-lg font-semibold border-border" onClick={resetForm}>Cancel</Button>
                <Button type="submit" className="h-14 flex-1 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" disabled={saving || (submitAttempted && Object.keys(errors).length > 0)}>
                  {saving ? 'Processing...' : editingItem ? 'Save Updates' : 'Publish Award'}
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-card shadow-2xl border border-border flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Audit History</h3>
                    <p className="text-sm text-muted-foreground">{historyItem.title}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setHistoryItem(null)} className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">✕</button>
              </div>
 
              <div className="overflow-y-auto p-8 custom-scrollbar space-y-6">
                {loadingHistory ? (
                  <div className="py-20 text-center text-muted-foreground">Loading history logs...</div>
                ) : historyLogs.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">No history items recorded for this award.</div>
                ) : (
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {historyLogs.map((log, idx) => (
                      <div key={log._id || idx} className="relative flex items-start gap-6 pl-12 transition-all">
                        <div className="absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1.5 rounded-2xl border border-border bg-muted/20 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">
                              {log.action.replace('award_', '').replace('_', ' ')}
                            </span>
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm font-semibold text-foreground">{log.actorName}</p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">{log.actorRole}</span>
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 text-[10px]">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-bold text-muted-foreground uppercase">{key}:</span>
                                  <span className="text-foreground truncate">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
 
              <div className="p-6 bg-muted/30 border-t border-border text-center">
                <Button variant="outline" className="rounded-xl border-border px-8" onClick={() => setHistoryItem(null)}>Close History</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Field({ children, className = '', label, error }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-[10px] font-black uppercase text-red-500 flex items-center gap-1 pl-1 italic underline decoration-red-500/30 underline-offset-4 tracking-tighter decoration-2">{error}</p>}
    </div>
  );
}

function ControlToggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex items-center justify-between rounded-2xl border px-5 py-3 transition-all ${checked ? 'border-primary bg-primary/5 shadow-inner' : 'border-border bg-card'}`}>
      <span className={`text-xs font-bold uppercase transition-colors ${checked ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
      <div className={`h-2.5 w-2.5 rounded-full transition-all ${checked ? 'bg-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-muted-foreground/30 scale-100'}`} />
    </button>
  );
}
