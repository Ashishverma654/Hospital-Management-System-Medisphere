import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { adminApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, UserCheck, UserX, History, Shield } from 'lucide-react';
import { ROLE_COLORS, ROLE_LABELS } from '../../auth/constants.js';

export default function UserManagement() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creatableRoles, setCreatableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({ 
    name: '', email: '', password: '', role: '', phone: '', gender: '', dob: '', address: '',
    // Doctor specific fields
    departmentId: '', title: '', qualifications: '', experienceYears: '', consultationFee: '', about: '', expertise: '', specialization: ''
  });
  const [formLoading, setFormLoading] = useState(false);

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
      const res = await adminApi.getAllUsers(params);
      setUsers(res.users || []);
      setPagination(res.pagination || {});
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, filterRole, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    adminApi.getCreatableRoles()
      .then(res => {
        // Interceptor returns res.data directly
        const roles = res.allowedRoles || (Array.isArray(res) ? res : []);
        setCreatableRoles(roles);
      })
      .catch(() => {});
    
    // Fetch departments for doctor creation
    import('../../services/apiServices').then(m => m.departmentApi.getAll())
      .then(res => setDepartments(res || []))
      .catch(() => {});
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      return toast.error('Name, email, password, and role are required.');
    }
    setFormLoading(true);
    try {
      const payload = { ...form };
      if (form.role === 'doctor') {
        payload.qualifications = form.qualifications.split(',').map(s => s.trim()).filter(Boolean);
        payload.expertise = form.expertise.split(',').map(s => s.trim()).filter(Boolean);
        payload.experienceYears = Number(form.experienceYears);
        payload.consultationFee = Number(form.consultationFee);
      }
      
      await adminApi.createUser(payload);
      toast.success(`${ROLE_LABELS[form.role] || form.role} created successfully!`);
      setShowForm(false);
      setForm({ 
        name: '', email: '', password: '', role: '', phone: '', gender: '', dob: '', address: '',
        departmentId: '', title: '', qualifications: '', experienceYears: '', consultationFee: '', about: '', expertise: '', specialization: ''
      });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (userId, isActive, userName) => {
    try {
      await adminApi.toggleActiveUser(userId);
      toast.success(`${userName} has been ${isActive ? 'deactivated' : 'reactivated'}`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Roles</h2>
          <p className="text-muted-foreground">
            Manage employee roles and staff accounts — logged in as <strong className="capitalize">{currentUser?.role}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <History className="w-4 h-4 mr-2" /> History
          </Button>
          <Button size="sm" onClick={() => { 
            setForm({ 
              name: '', email: '', password: '', role: '', phone: '', gender: '', dob: '', address: '',
              departmentId: '', title: '', qualifications: '', experienceYears: '', consultationFee: '', about: '', expertise: '', specialization: ''
            }); 
            setShowForm(true); 
          }}>
            <Plus className="w-4 h-4 mr-2" /> Create User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
        >
          <option value="">All Employee Roles</option>
          {Object.entries(ROLE_LABELS).filter(([val]) => val !== 'patient').map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={loadUsers}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee ID</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Created By</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Loading users…</td></tr>
              ) : users.filter((user) => user.role !== 'patient').length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No users found</td></tr>
              ) : (
                users.filter((user) => user.role !== 'patient').map(u => (
                  <tr key={u._id} className={`border-b border-border hover:bg-muted/30 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-800'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.employeeId || u.patientId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.createdBy ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {u.createdBy.name} <span className="opacity-60">({u.createdBy.role})</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'superadmin' && (
                        <Button
                          size="sm"
                          variant={u.isActive ? 'destructive' : 'outline'}
                          onClick={() => handleToggleActive(u._id, u.isActive, u.name)}
                          className="text-xs h-7"
                        >
                          {u.isActive ? <><UserX className="w-3 h-3 mr-1" />Deactivate</> : <><UserCheck className="w-3 h-3 mr-1" />Activate</>}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="flex items-center text-sm px-2">{page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New Staff Role</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {[
                { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { name: 'email', label: 'Email', type: 'email', placeholder: 'user@hospital.com' },
                { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
                { name: 'phone', label: 'Phone (Optional)', type: 'text', placeholder: '9876543210' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  placeholder="Enter full address..."
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                  required
                >
                  <option value="">Select role…</option>
                  {creatableRoles.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                  ))}
                </select>
              </div>

              {form.role === 'doctor' && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Doctor Profile Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        placeholder="e.g. Director, Senior Consultant"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required={form.role === 'doctor'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <select
                        value={form.departmentId}
                        onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                        required={form.role === 'doctor'}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Qualifications</label>
                    <input
                      placeholder="MBBS, MD (Comma separated)"
                      value={form.qualifications}
                      onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Exp (Years)</label>
                      <input
                        type="number"
                        value={form.experienceYears}
                        onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Consultation Fee</label>
                      <input
                        type="number"
                        value={form.consultationFee}
                        onChange={e => setForm(f => ({ ...f, consultationFee: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Expertise</label>
                    <textarea
                      placeholder="Expert in Luminal Gastroenterology, etc. (Comma separated)"
                      value={form.expertise}
                      onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bio / About</label>
                    <textarea
                      placeholder="Provide a professional summary..."
                      value={form.about}
                      onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Gender (Optional)</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={formLoading}>
                  {formLoading ? 'Creating…' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Creation History</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>Close</Button>
            </div>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No creation history found.</p>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log._id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      log.action === 'created' ? 'bg-green-500' :
                      log.action === 'deactivated' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <span className="text-primary">{log.creatorName}</span>
                        <span className="text-muted-foreground"> ({log.creatorRole}) </span>
                        <span className="capitalize font-bold">{log.action}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-primary">{log.createdUserName}</span>
                        <span className="text-muted-foreground"> ({log.createdUserRole})</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.createdUserEmail}</p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">
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
