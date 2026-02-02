import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';
import ReturnMaterial from './pages/ReturnMaterial';
import AdminAudit from './pages/AdminAudit';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

import Home from './pages/Home';
import { RequestMaterial, MRSList, Inventory, RaisePI, PIApprovals, InwardEntry, Reports, MaterialDetails, UserManagement, Notifications } from './pages/Placeholders';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="request-material" element={<RequestMaterial />} />
        <Route path="mrs-list" element={<MRSList />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="raise-pi" element={<RaisePI />} />
        <Route path="pi-approvals" element={<PIApprovals />} />
        <Route path="inward-entry" element={<InwardEntry />} />
        <Route path="return-material" element={<ReturnMaterial />} />
        <Route path="reports" element={<Reports />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierDetails />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="inventory/:id" element={<MaterialDetails />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<AdminAudit />} />
      </Route>
    </Routes>
  );
};

import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
