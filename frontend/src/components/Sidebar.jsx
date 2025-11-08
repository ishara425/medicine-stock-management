import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pill, Package, Send, BarChart3, AlertTriangle, Users } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { path: '/medicines', icon: Pill, label: 'Medicines', subtitle: 'Manage medicine records' },
    { path: '/stock', icon: Package, label: 'Stock', subtitle: 'Monitor inventory levels' },
    { path: '/distributions', icon: Send, label: 'Distributions', subtitle: 'Track medicine distributions' },
    { path: '/restock-requests', icon: AlertTriangle, label: 'Restock Requests', subtitle: 'Officer restock requests' },
    { path: '/officer-tracking', icon: Users, label: 'Officer Tracking', subtitle: 'Monitor officer inventory' },
    { path: '/reports', icon: BarChart3, label: 'Reports', subtitle: 'View analytics and reports' }
  ];

  return (
    <div className="w-64 bg-blue-900 text-white h-screen flex flex-col fixed">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Medicine Tracker</h1>
            <p className="text-xs text-blue-300">PHI System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg mb-2 transition-colors ${
                isActive 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:bg-blue-800/50'
              }`}
            >
              <Icon className="w-5 h-5 mt-0.5" />
              <div className="text-left">
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs opacity-75">{item.subtitle}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="text-xs text-blue-300">
          <div>Ministry of Health</div>
          <div>Medicine Tracking System v2.0</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;