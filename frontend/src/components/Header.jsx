import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Header = ({ title, subtitle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const username = localStorage.getItem('username') ;

  return (
    <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title || 'Medicine Tracker'}</h1>
        <p className="text-sm text-gray-500">{subtitle || 'Admin Dashboard'}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Welcome, {username}</span>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;