import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FlaskConical, FileText, Clock, Upload } from 'lucide-react';
import api from '../../lib/api.js';

export default function LabTechDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/lab-techs/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch lab tech dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Lab Section", value: stats?.labSection || "—", icon: FlaskConical, color: "bg-teal-500" },
    { title: "Pending Reports", value: stats?.pendingReports || 0, icon: Clock, color: "bg-orange-500" },
    { title: "My Uploads", value: stats?.myUploads || 0, icon: Upload, color: "bg-indigo-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lab Technician Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full uppercase tracking-wider">
          {user?.employeeId || "Lab Tech"}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.title} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.color} text-white`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 capitalize">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Pending Reports", "Upload Results", "Report History", "My Profile"].map((action) => (
            <button key={action} className="p-4 bg-gray-50 hover:bg-teal-50 rounded-xl text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors border border-gray-100 hover:border-teal-200">
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
