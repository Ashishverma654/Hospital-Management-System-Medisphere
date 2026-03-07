import { useState, useEffect } from 'react';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../services/departmentService';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AdminPages.css';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreate = () => {
    setEditingDept(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditingDept(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    try {
      if (editingDept) {
        await updateDepartment(editingDept._id, form);
        toast.success('Department updated');
      } else {
        await createDepartment(form);
        toast.success('Department created');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await deleteDepartment(id);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete department');
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Departments</h1>
        <p>Manage hospital departments</p>
      </div>

      <div className="page-actions">
        <button className="btn btn-primary" onClick={openCreate} id="add-department-btn">
          <FiPlus /> Add Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <h3>No departments yet</h3>
          <p>Create your first department to get started</p>
        </div>
      ) : (
        <div className="dept-grid">
          {departments.map((dept) => (
            <div key={dept._id} className="dept-card">
              <div className="dept-card-header">
                <h3>{dept.name}</h3>
                <div className="dept-card-actions">
                  <button className="icon-btn" onClick={() => openEdit(dept)} title="Edit">
                    <FiEdit2 />
                  </button>
                  <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(dept._id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <p>{dept.description || 'No description provided'}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cardiology"
                  id="dept-name-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                  id="dept-desc-input"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} id="dept-submit">
                {editingDept ? 'Update Department' : 'Create Department'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
