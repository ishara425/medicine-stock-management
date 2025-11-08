import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StockManagementDashboard from '../components/StockManagementDashboard';

const StockPage = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Stock Management" 
          subtitle="Monitor and manage medicine inventory levels" 
        />
        <StockManagementDashboard />
      </div>
    </div>
  );
};

export default StockPage;