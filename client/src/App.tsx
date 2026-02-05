import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
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
import CustomersPage from './pages/CustomersPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import PayrollPage from './pages/PayrollPage';
import QuoteComparisonPage from './pages/QuoteComparisonPage';
import RevenuePage from './pages/RevenuePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BranchKpiPage from './pages/BranchKpiPage';
import ApprovalsPage from './pages/ApprovalsPage';
import RenewalsPage from './pages/RenewalsPage';
import { NotificationProvider } from './contexts/NotificationContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard/sales" element={<SalesDashboard />} />
              <Route path="dashboard/cancellations" element={<CancellationDashboard />} />
              <Route path="kpi" element={<BranchKpiPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="policy-types" element={<PolicyTypesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="commissions" element={<CommissionsPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="renewals" element={<RenewalsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="commission-rules" element={<CommissionRulesPage />} />
              <Route path="messaging" element={<MessagingPage />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerProfilePage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="quotes/compare" element={<QuoteComparisonPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;

