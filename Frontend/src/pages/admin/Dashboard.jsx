import { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/adminService';
import { FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiActivity, FiClock } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import './AdminPages.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  const pieData = [
    { name: 'Completed', value: stats?.completedAppointments || 0 },
    { name: 'Cancelled', value: stats?.cancelledAppointments || 0 },
    { name: 'Booked', value: (stats?.totalAppointments || 0) - (stats?.completedAppointments || 0) - (stats?.cancelledAppointments || 0) },
  ];

  const COLORS = ['#00D4AA', '#FF6B6B', '#6C63FF'];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of hospital management statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: '#6C63FF' }}>
            <FiUsers />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalDoctors || 0}</h3>
            <p>Total Doctors</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 212, 170, 0.15)', color: '#00D4AA' }}>
            <FiActivity />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalPatients || 0}</h3>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(84, 160, 255, 0.15)', color: '#54A0FF' }}>
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h3>{stats?.totalAppointments || 0}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 179, 71, 0.15)', color: '#FFB347' }}>
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats?.todayAppointments || 0}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card card">
          <h3>Appointment Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {pieData.map((item, idx) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-dot" style={{ background: COLORS[idx] }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="quick-stats-card card">
          <h3>Quick Stats</h3>
          <div className="quick-stat">
            <div className="quick-stat-label">
              <FiCheckCircle color="#00D4AA" />
              <span>Completed</span>
            </div>
            <span className="quick-stat-value">{stats?.completedAppointments || 0}</span>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-label">
              <FiXCircle color="#FF6B6B" />
              <span>Cancelled</span>
            </div>
            <span className="quick-stat-value">{stats?.cancelledAppointments || 0}</span>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-label">
              <FiCalendar color="#54A0FF" />
              <span>Today</span>
            </div>
            <span className="quick-stat-value">{stats?.todayAppointments || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
