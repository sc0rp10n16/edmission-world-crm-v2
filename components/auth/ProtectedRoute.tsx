import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { Permission } from '@/lib/auth/rbac';
import LoadingSpinner from '../LoadingSpinner';


interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
  fallbackUrl?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  fallbackUrl = '/login'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, hasPermission } = useRBAC();

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push(fallbackUrl);
    return null;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}