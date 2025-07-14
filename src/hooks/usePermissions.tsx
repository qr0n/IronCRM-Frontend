import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface PermissionCheckProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export function usePermissionCheck({ allowedRoles, redirectTo = '/dashboard' }: PermissionCheckProps) {
  const { user } = useAuth();
  const router = useRouter();

  const hasPermission = user?.role && allowedRoles.includes(user.role);

  useEffect(() => {
    if (user && !hasPermission) {
      router.push(redirectTo);
    }
  }, [user, hasPermission, router, redirectTo]);

  return {
    hasPermission,
    user,
    isLoading: !user // Still loading if no user data
  };
}

export function PermissionGuard({ 
  children, 
  allowedRoles, 
  fallbackComponent 
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackComponent?: React.ReactNode;
}) {
  const { hasPermission, isLoading } = usePermissionCheck({ allowedRoles });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return fallbackComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. 
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Required roles: {allowedRoles.join(', ')}
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
