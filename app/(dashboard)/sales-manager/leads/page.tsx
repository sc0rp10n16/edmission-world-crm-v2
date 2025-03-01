'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';

import { useRBAC } from '@/hooks/auth/useRBAC';
import LoadingSpinner from '@/components/LoadingSpinner';
import LeadManagementContent from '@/components/leads/LeadManagementContent';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function LeadsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: rbacLoading } = useRBAC();

  useEffect(() => {
    // Redirect to dashboard if user doesn't have the appropriate role
    if (!authLoading && !rbacLoading && !hasRole('sales_manager') && !hasRole('admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, rbacLoading, hasRole, router]);

  if (authLoading || rbacLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full p-10">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      {/* This would be your actual lead management component */}
      <LeadManagementContent />
    </DashboardLayout>
  );
}