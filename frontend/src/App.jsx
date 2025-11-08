import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MedicinePage from './pages/MedicinePage';
import StockPage from './pages/StockPage';
import DistributionsPage from './pages/DistributionsPage';
import RestockRequestsPage from './pages/RestockRequestsPage';
import ReportsPage from './pages/ReportsPage';
import OfficerTrackingPage from './pages/OfficerTrackingPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
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
              <RestockRequestsPage />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/officer-tracking" 
          element={
            <PrivateRoute>
              <OfficerTrackingPage />
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
        
        <Route path="/" element={<Navigate to="/medicines" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;