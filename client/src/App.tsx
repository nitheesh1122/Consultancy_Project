import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';
import ReturnMaterial from './pages/ReturnMaterial';
import ReportsModule from './pages/ReportsModule';
import Unauthorized from './components/Unauthorized';

// Customer Portal
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerLayout from './layouts/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateOrder from './pages/customer/CreateOrder';
import OrderTracking from './pages/customer/OrderTracking';

// Supplier Portal
import SupplierLogin from './pages/supplier/SupplierLogin';
import SupplierLayout from './layouts/SupplierLayout';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import RFQList from './pages/supplier/RFQList';
import SubmitQuotation from './pages/supplier/SubmitQuotation';
import SupplierPurchaseOrders from './pages/supplier/SupplierPurchaseOrders';

// Internal: Customer Orders & Procurement
import CustomerOrders from './pages/CustomerOrders';
import Procurement from './pages/Procurement';
import DispatchPage from './pages/DispatchPage';
import ManageCustomers from './pages/ManageCustomers';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const CustomerRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/customer/login" />;
  if (user?.role !== 'CUSTOMER') return <Navigate to="/unauthorized" />;
  return children;
};

const SupplierRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/supplier/login" />;
  if (user?.role !== 'SUPPLIER') return <Navigate to="/unauthorized" />;
  return children;
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
import DecisionBoard from './pages/analytics/DecisionBoard';

// Settings Module
import SettingsLayout from './pages/settings/SettingsLayout';

// HR Module
import HrLayout from './pages/hr/HrLayout';
import HRWorkerList from './pages/hr/HRWorkerList';
import AttendanceTracker from './pages/hr/AttendanceTracker';
import HRPerformance from './pages/hr/HRPerformance';
import ShiftManagement from './pages/hr/ShiftManagement';
import LeaveRequests from './pages/hr/LeaveRequests';
import WorkerAssignment from './pages/hr/WorkerAssignment';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Customer Portal */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer" element={<CustomerRoute><CustomerLayout /></CustomerRoute>}>
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="create-order" element={<CreateOrder />} />
        <Route path="order/:id" element={<OrderTracking />} />
      </Route>

      {/* Supplier Portal */}
      <Route path="/supplier/login" element={<SupplierLogin />} />
      <Route path="/supplier" element={<SupplierRoute><SupplierLayout /></SupplierRoute>}>
        <Route path="dashboard" element={<SupplierDashboard />} />
        <Route path="rfq" element={<RFQList />} />
        <Route path="rfq/:rfqId" element={<SubmitQuotation />} />
        <Route path="purchase-orders" element={<SupplierPurchaseOrders />} />
      </Route>

      {/* Internal Dashboard */}
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
        <Route path="reports" element={<ReportsModule />} />
        <Route path="audit-logs" element={<Navigate to="/reports" />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* Customer Orders (Manager) */}
        <Route path="customer-orders" element={<CustomerOrders />} />
        <Route path="manage-customers" element={<ManageCustomers />} />

        {/* Procurement (Manager/Store Manager) */}
        <Route path="procurement" element={<Procurement />} />

        {/* Dispatch (Store Manager/Manager) */}
        <Route path="dispatch" element={<DispatchPage />} />

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
          <Route path="shifts" element={<ShiftManagement />} />
          <Route path="leaves" element={<LeaveRequests />} />
          <Route path="assignments" element={<WorkerAssignment />} />
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
          <Route path="decision-board" element={<DecisionBoard />} />
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
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
