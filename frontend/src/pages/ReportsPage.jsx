import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ReportsPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Reports" 
          subtitle="View analytics and reports" 
        />
        <div className="p-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Reports & Analytics</h2>
            <p className="text-gray-600">This feature is coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;