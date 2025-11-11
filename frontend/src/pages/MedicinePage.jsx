import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MedicineDashboard from '../components/MedicineDashboard';

const MedicinePage = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Medicine Tracker" 
          
        />
        <MedicineDashboard />
      </div>
    </div>
  );
};

export default MedicinePage;