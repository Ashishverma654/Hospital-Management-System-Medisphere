import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { adminApi, departmentApi, doctorApi, locationApi, specializationApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { History, Plus, RefreshCw, Search, Shield, UserCheck, UserX } from 'lucide-react';
import { ROLE_COLORS, ROLE_LABELS } from '../../auth/constants.js';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: '',
  phone: '',
  gender: '',
  dob: '',
  address: '',
  title: 'Consultant',
  departmentId: '',
  specializationIds: [],
  hospitalLocations: [],
  qualifications: [],
  experienceYears: '',
  consultationFee: '',
  consultationFeeVideo: '',
  about: '',
  expertise: [],
  profileImage: '',
  isPublished: false,
  isFeatured: false,
  featureOrder: '',
};

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creatableRoles, setCreatableRoles] = useState([]);
  const [manageableRoles, setManageableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [form, setForm] = useState(initialForm);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowForm(true);
    }
  }, [location.search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterRole) params.role = filterRole;
      if (search) params.search = search;
      if (filterStatus) params.isActive = filterStatus;

      const res = await adminApi.getAllUsers(params);
      setUsers(res.users || []);
      setPagination(res.pagination || {});
      setManageableRoles(res.manageableRoles || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterStatus, page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    adminApi
      .getCreatableRoles()
      .then((res) => {
        const allowedRoles = Array.isArray(res?.allowedRoles) ? res.allowedRoles : [];
        setCreatableRoles(allowedRoles);
        setManageableRoles(res.manageableRoles || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showForm || form.role !== 'doctor') {
      return;
    }

    const loadDoctorMasters = async () => {
      try {
        const [departmentData, locationData] = await Promise.all([
          departmentApi.getAll({ isActive: true }),
          locationApi.getAll({ isActive: true }),
        ]);
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
        setLocations(Array.isArray(locationData) ? locationData : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load doctor setup data.');
      }
    };

    loadDoctorMasters();
  }, [form.role, showForm]);

  useEffect(() => {
    if (!showForm || form.role !== 'doctor' || !form.departmentId) {
      setSpecializations([]);
      return;
    }

    const loadSpecializations = async () => {
      try {
        const data = await specializationApi.getAll({ departmentId: form.departmentId, isActive: true });
        setSpecializations(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load specializations.');
      }
    };

    loadSpecializations();
  }, [form.departmentId, form.role, showForm]);

  const resetForm = () => {
    setForm(initialForm);
    setShowForm(false);
    setSubmitAttempted(false);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!form.name || !form.email || !form.role) {
      toast.error(
        form.role === 'doctor'
          ? 'Name, email, and department are required for doctor creation.'
          : 'Name, email, and role are required.'
      );
      return;
    }

    if (form.role === 'doctor' && !form.departmentId) {
      toast.error('Department is required for doctor creation.');
      return;
    }

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }

    setFormLoading(true);
    try {
      if (form.role === 'doctor') {
        const response = await doctorApi.createAdminDoctor({
          name: form.name,
          email: form.email,
          phone: form.phone,
          title: form.title,
          departmentId: form.departmentId,
          specializationIds: form.specializationIds,
          hospitalLocations: form.hospitalLocations,
          qualifications: form.qualifications,
          experienceYears: Number(form.experienceYears) || 0,
          consultationFee: Number(form.consultationFee) || 0,
          consultationFeeVideo: Number(form.consultationFeeVideo) || 0,
          about: form.about,
          expertise: form.expertise,
          profileImage: form.profileImage,
          isActive: true,
          isPublished: form.isPublished,
          isFeatured: form.isFeatured,
          featureOrder: Number(form.featureOrder) || 0,
        });

        const temporary = response?.temporaryCredential;
        toast.success(
          temporary
            ? `Doctor created. Temporary password: ${temporary.temporaryPassword}`
            : 'Doctor created successfully.'
        );
      } else {
        await adminApi.createUser(form);
        toast.success(`${ROLE_LABELS[form.role] || form.role} created successfully.`);
      }
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (userId, isActive, userName) => {
    try {
      await adminApi.toggleActiveUser(userId);
      toast.success(`${userName} has been ${isActive ? 'deactivated' : 'reactivated'}`);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const loadHistory = async () => {
    try {
      const res = await adminApi.getHistory();
      setLogs(res.logs || []);
      setShowHistory(true);
    } catch {
      toast.error('Failed to load history');
    }
  };

  const employeeRows = users.filter((user) => user.role !== 'patient');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Roles</h2>
          <p className="text-muted-foreground">
            Manage employee roles and staff accounts while signed in as{' '}
            <strong className="capitalize">{currentUser?.role}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <History className="mr-2 h-4 w-4" /> History
          </Button>
          <Button size="sm" onClick={() => navigate('/employee/manage-roles/add')}>
            <Plus className="mr-2 h-4 w-4" /> Create User
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterRole}
          onChange={(event) => {
            setFilterRole(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Employee Roles</option>
          {Object.entries(ROLE_LABELS)
            .filter(([value]) => value !== 'patient')
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
        <select
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button variant="outline" size="sm" onClick={loadUsers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Employee ID</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Created By</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Onboarding</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : employeeRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                employeeRows.map((user) => (
                  <tr
                    key={user._id}
                    className={`border-b border-border transition-colors hover:bg-muted/30 ${
                      !user.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.createdBy ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {user.createdBy.name} <span className="opacity-60">({user.createdBy.role})</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-muted-foreground">
                      {user.onboardingStatus || 'active'}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'superadmin' && manageableRoles.includes(user.role) ? (
                        <Button
                          size="sm"
                          variant={user.isActive ? 'destructive' : 'outline'}
                          onClick={() => handleToggleActive(user._id, user.isActive, user.name)}
                          className="h-7 text-xs"
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-1 h-3 w-3" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-1 h-3 w-3" />
                              Activate
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Restricted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                Prev
              </Button>
              <span className="flex items-center px-2 text-sm">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Create New Staff Role</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {[
                { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'user@hospital.com' },
                { name: 'phone', label: 'Phone (Optional)', type: 'text', placeholder: '9876543210' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="mb-1 block text-sm font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={(event) => {
                      let val = event.target.value;
                      if (field.name === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
                      setForm((current) => ({ ...current, [field.name]: val }));
                    }}
                    maxLength={field.name === 'phone' ? 10 : undefined}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${(submitAttempted && field.name !== 'phone' && !form[field.name] && field.name !== 'address') ? 'border-red-500' : 'border-border'}`}
                  />
                  {submitAttempted && field.name === 'phone' && form.phone && !/^\d{10}$/.test(form.phone) && (
                    <p className="mt-1 text-[10px] font-bold text-red-500 italic">Enter exactly 10 digits</p>
                  )}
                </div>
              ))}

                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary font-medium">
                  A secure temporary password will be auto-generated and sent to the user's email.
                </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Address</label>
                <textarea
                  placeholder="Enter full address..."
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  className="min-h-[60px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                      ...(event.target.value === 'doctor'
                        ? {}
                        : {
                            departmentId: '',
                            specializationIds: [],
                            hospitalLocations: [],
                            qualifications: [],
                            experienceYears: '',
                            consultationFee: '',
                            about: '',
                            expertise: [],
                            profileImage: '',
                            isPublished: false,
                            isFeatured: false,
                            featureOrder: '',
                          }),
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                  required
                >
                  <option value="">Select role...</option>
                  {creatableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role] || role}
                    </option>
                  ))}
                </select>
              </div>

              {form.role === 'doctor' && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Doctor Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Consultant"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Department</label>
                    <select
                      value={form.departmentId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          departmentId: event.target.value,
                          specializationIds: [],
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                      required
                    >
                      <option value="">Select department...</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Experience (years)</label>
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Consultation Fee (In-Hospital)</label>
                    <input
                      type="number"
                      value={form.consultationFee}
                      onChange={(event) => setForm((current) => ({ ...current, consultationFee: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Consultation Fee (Video)</label>
                    <input
                      type="number"
                      value={form.consultationFeeVideo}
                      onChange={(event) => setForm((current) => ({ ...current, consultationFeeVideo: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Qualifications</label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setForm(current => ({ ...current, qualifications: [...(current.qualifications || []), ''] }))}>Add</Button>
                    </div>
                    {(form.qualifications || []).map((qual, index) => (
                      <div key={`qual-${index}`} className="flex gap-2">
                        <input
                          type="text"
                          value={qual}
                          onChange={(e) => {
                            const next = [...(form.qualifications || [])];
                            next[index] = e.target.value;
                            setForm(current => ({ ...current, qualifications: next }));
                          }}
                          placeholder="MBBS, MD"
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                          const next = [...(form.qualifications || [])];
                          next.splice(index, 1);
                          setForm(current => ({ ...current, qualifications: next }));
                        }}>✕</Button>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Expertise</label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setForm(current => ({ ...current, expertise: [...(current.expertise || []), ''] }))}>Add</Button>
                    </div>
                    {(form.expertise || []).map((exp, index) => (
                      <div key={`exp-${index}`} className="flex gap-2">
                        <input
                          type="text"
                          value={exp}
                          onChange={(e) => {
                            const next = [...(form.expertise || [])];
                            next[index] = e.target.value;
                            setForm(current => ({ ...current, expertise: next }));
                          }}
                          placeholder="Cardiac surgery"
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                          const next = [...(form.expertise || [])];
                          next.splice(index, 1);
                          setForm(current => ({ ...current, expertise: next }));
                        }}>✕</Button>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">About</label>
                    <textarea
                      value={form.about}
                      onChange={(event) => setForm((current) => ({ ...current, about: event.target.value }))}
                      className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>



                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Hospital Locations</label>
                    <div className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm">
                      {locations.map((item) => (
                        <label key={item._id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.hospitalLocations.includes(item._id)}
                            onChange={() =>
                              setForm((current) => ({
                                ...current,
                                hospitalLocations: current.hospitalLocations.includes(item._id)
                                  ? current.hospitalLocations.filter((id) => id !== item._id)
                                  : [...current.hospitalLocations, item._id],
                              }))
                            }
                          />
                          {item.name} {item.city ? `(${item.city})` : ''}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Gender (Optional)</label>
                <select
                  value={form.gender}
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Creation History</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                Close
              </Button>
            </div>
            {logs.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No creation history found.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log._id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div
                      className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                        log.action === 'created'
                          ? 'bg-green-500'
                          : log.action === 'deactivated'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-primary">{log.creatorName}</span>
                        <span className="text-muted-foreground"> ({log.creatorRole}) </span>
                        <span className="capitalize font-bold">{log.action}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-primary">{log.createdUserName}</span>
                        <span className="text-muted-foreground"> ({log.createdUserRole})</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{log.createdUserEmail}</p>
                    </div>
                    <p className="flex-shrink-0 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
