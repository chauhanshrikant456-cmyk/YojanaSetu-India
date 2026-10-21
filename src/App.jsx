import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import AppLayout from '@/components/AppLayout';
import Landing from '@/pages/Landing';
import Opportunities from '@/pages/Opportunities';
import OpportunityDetail from '@/pages/OpportunityDetail';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Eligibility from '@/pages/Eligibility';
import Readiness from '@/pages/Readiness';
import Documents from '@/pages/Documents';
import Applications from '@/pages/Applications';
import Notifications from '@/pages/Notifications';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminOpportunities from '@/pages/admin/AdminOpportunities';
import AdminRules from '@/pages/admin/AdminRules';
import AdminDocuments from '@/pages/admin/AdminDocuments';
import AdminDependencies from '@/pages/admin/AdminDependencies';
import AdminScoring from '@/pages/admin/AdminScoring';
import AdminVerification from '@/pages/admin/AdminVerification';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminAuditLogs from '@/pages/admin/AdminAuditLogs';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/opportunities" element={<Opportunities />} />
      <Route path="/opportunities/:id" element={<OpportunityDetail />} />

      <Route path="/admin/login" element={<Navigate to="/login?returnTo=/admin" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/readiness" element={<Readiness />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/opportunities" element={<AdminOpportunities />} />
            <Route path="/admin/rules" element={<AdminRules />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/dependencies" element={<AdminDependencies />} />
            <Route path="/admin/scoring" element={<AdminScoring />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/audit" element={<AdminAuditLogs />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App