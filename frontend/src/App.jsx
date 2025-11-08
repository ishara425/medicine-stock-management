import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Loginpage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// PHI Admin Pages
import MedicinePage from './pages/MedicinePage';
import StockPage from './pages/StockPage';
import DistributionsPage from './pages/DistributionsPage';
import RestockRequestsPage from './pages/RestockRequestsPage';
import ReportsPage from './pages/ReportsPage';
import OfficerTrackingPage from './pages/OfficerTrackingPage';

// Officer Pages
import OfficerDashboard from './pages/OfficerDashboard';

import PrivateRoute from './components/PrivateRoute';

// Layout wrapper for PHI pages
const PHILayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Medicine Tracker" 
          subtitle="Public Health Inspector Dashboard" 
        />
        {children}
      </div>
    </div>
  );
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const role = localStorage.getItem('role');
  
  if (role === 'OFFICER') {
    return <Navigate to="/officer/dashboard" replace />;
  } else {
    return <Navigate to="/medicines" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* PHI Admin Routes */}
        <Route 
          path="/medicines" 
          element={
            <PrivateRoute>
              
                <MedicinePage />
             
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/stock" 
          element={
            <PrivateRoute>
              
                <StockPage />
      
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/distributions" 
          element={
            <PrivateRoute>
              
                <DistributionsPage />
             
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/restock-requests" 
          element={
            <PrivateRoute>
             <PHILayout>
                <RestockRequestsPage />
              </PHILayout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/officer-tracking" 
          element={
            <PrivateRoute>
              <PHILayout>
                <OfficerTrackingPage />
              </PHILayout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <PrivateRoute>
             
                <ReportsPage />
              
            </PrivateRoute>
          } 
        />
        
        {/* Officer Routes */}
        <Route 
          path="/officer/dashboard" 
          element={
            <PrivateRoute>
              <OfficerDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Default Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <RoleBasedRedirect />
            </PrivateRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;