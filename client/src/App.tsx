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
import { RequestMaterial, MRSList, Inventory, RaisePI, PIApprovals, InwardEntry, MaterialDetails, UserManagement, Notifications } from './pages/Placeholders';

// Production Module
import MachineMaster from './pages/production/MachineMaster';
import FabricLotList from './pages/production/FabricLotList';
import ScheduleBatch from './pages/production/ScheduleBatch';
import MyBatches from './pages/production/MyBatches';
import BatchExecution from './pages/production/BatchExecution';
import LiveMonitor from './pages/production/LiveMonitor';
import ReportConfig from './pages/production/ReportConfig';

// Analytics Module
import AnalyticsLayout from './pages/analytics/AnalyticsLayout';
import AnalyticsInventory from './pages/analytics/AnalyticsInventory';
import AnalyticsProduction from './pages/analytics/AnalyticsProduction';
import AnalyticsWorkers from './pages/analytics/AnalyticsWorkers';
import AnalyticsSuppliers from './pages/analytics/AnalyticsSuppliers';

// Settings Module
import SettingsLayout from './pages/settings/SettingsLayout';

// HR Module
import HrLayout from './pages/hr/HrLayout';
import HRWorkerList from './pages/hr/HRWorkerList';
import AttendanceTracker from './pages/hr/AttendanceTracker';
import HRPerformance from './pages/hr/HRPerformance';

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
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierDetails />} />
        <Route path="inventory/:id" element={<MaterialDetails />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<AdminAudit />} />

        {/* System Settings */}
        <Route path="settings" element={<SettingsLayout />}>
          <Route path="users" element={<UserManagement />} />
          <Route path="reports" element={<ReportConfig />} />
        </Route>

        {/* HR Module */}
        <Route path="hr" element={<HrLayout />}>
          <Route path="workers" element={<HRWorkerList />} />
          <Route path="attendance" element={<AttendanceTracker />} />
          <Route path="performance" element={<HRPerformance />} />
        </Route>

        {/* Production Module Routes */}
        <Route path="production/machines" element={<MachineMaster />} />
        <Route path="production/lots" element={<FabricLotList />} />
        <Route path="production/schedule" element={<ScheduleBatch />} />
        <Route path="production/my-batches" element={<MyBatches />} />
        <Route path="production/batch/:id/execute" element={<BatchExecution />} />
        <Route path="production/monitor" element={<LiveMonitor />} />
        <Route path="production/settings" element={<ReportConfig />} />

        {/* Enterprise Analytics */}
        <Route path="analytics" element={<AnalyticsLayout />}>
          <Route path="inventory" element={<AnalyticsInventory />} />
          <Route path="production" element={<AnalyticsProduction />} />
          <Route path="workers" element={<AnalyticsWorkers />} />
          <Route path="suppliers" element={<AnalyticsSuppliers />} />
        </Route>
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
