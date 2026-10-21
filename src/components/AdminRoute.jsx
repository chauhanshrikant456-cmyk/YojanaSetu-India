import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import EmptyState from '@/components/common/EmptyState';

export default function AdminRoute() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== 'admin') {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Administrator access required"
        description="This console manages the opportunity catalog, eligibility rules, documents and verification. Ask an existing administrator to grant you the admin role."
        className="mt-8"
      />
    );
  }

  return <Outlet />;
}