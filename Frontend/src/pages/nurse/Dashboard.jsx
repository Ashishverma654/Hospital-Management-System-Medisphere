import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Activity, Clock, Stethoscope, BedDouble } from 'lucide-react';
import api from '../../lib/api.js';

export default function NurseDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/nurses/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch nurse dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Assigned Ward", value: stats?.assignedWard || "—", icon: BedDouble, color: "bg-blue-500" },
    { title: "Current Shift", value: stats?.shift || "—", icon: Clock, color: "bg-green-500" },
    { title: "Assigned Doctors", value: stats?.assignedDoctorsCount || 0, icon: Stethoscope, color: "bg-purple-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nurse Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
          {user?.employeeId || "Nurse"}
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
          {["View Patients", "Update Ward", "Duty Schedule", "Reports"].map((action) => (
            <button key={action} className="p-4 bg-gray-50 hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-100 hover:border-blue-200">
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
