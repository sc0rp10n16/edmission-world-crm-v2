import { useEffect, useState } from 'react';
import { getUserById } from '@/lib/firebase/firestore';
import { User, UserRole } from '@/lib/types/user';
import { Permission, hasPermission as checkPermission, hasRole as checkRole } from '@/lib/auth/rbac';
import { useAuth } from './useAuth';

export function useRBAC() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserById(authUser.uid);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchUserData();
    }
  }, [authUser, authLoading]);

  return {
    user,
    loading: loading || authLoading,
    hasPermission: (permission: Permission) => checkPermission(user, permission),
    hasRole: (role: UserRole) => checkRole(user, role)
  };
}