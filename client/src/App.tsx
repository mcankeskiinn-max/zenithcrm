import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import PolicyTypesPage from './pages/PolicyTypesPage';
import BranchesPage from './pages/BranchesPage';
import UsersPage from './pages/UsersPage';
import SalesPage from './pages/SalesPage';
import CommissionsPage from './pages/CommissionsPage';
import TasksPage from './pages/TasksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CommissionRulesPage from './pages/CommissionRulesPage';
import SettingsPage from './pages/SettingsPage';
import SalesDashboard from './pages/SalesDashboard';
import CancellationDashboard from './pages/CancellationDashboard';
import MessagingPage from './pages/MessagingPage';
import AuditLogsPage from './pages/AuditLogsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/sales" element={<SalesDashboard />} />
          <Route path="dashboard/cancellations" element={<CancellationDashboard />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="policy-types" element={<PolicyTypesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="commissions" element={<CommissionsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="commission-rules" element={<CommissionRulesPage />} />
          <Route path="messaging" element={<MessagingPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
