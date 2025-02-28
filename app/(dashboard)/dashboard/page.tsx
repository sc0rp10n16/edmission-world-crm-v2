'use client';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SalesManagerLayout from '@/components/layout/sales-manager-layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading, hasRole } = useRBAC();
  
  if (loading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }
  
  if (!user) {
    redirect('/login');
    return null;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Welcome {user.name}</h1>
      
      {hasRole('admin') && (
        <AdminDashboard/>
      )}
      
      {hasRole('sales_manager') && (
        <SalesManagerLayout/>
      )}
      
      {hasRole('telemarketer') && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-blue-800">Telemarketer Dashboard</h2>
          <p>You can view and update your assigned leads and track your daily quota.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <DashboardCard title="My Leads" href="/telemarketer/leads" />
            <DashboardCard title="Daily Quota" href="/telemarketer/quota" />
          </div>
        </div>
      )}
      
      {hasRole('counselor') && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-yellow-800">Counselor Dashboard</h2>
          <p>You can manage student applications, update application status, and review documents.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <DashboardCard title="Student Applications" href="/counselor/applications" />
            <DashboardCard title="Document Review" href="/counselor/documents" />
          </div>
        </div>
      )}
      
      {hasRole('student') && (
        <div className="bg-purple-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-purple-800">Student Dashboard</h2>
          <p>You can view your application status, upload documents, and track your progress.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <DashboardCard title="Application Status" href="/student/application" />
            <DashboardCard title="Upload Documents" href="/student/documents" />
            <DashboardCard title="Progress Tracker" href="/student/progress" />
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardCard({ title, href }: { title: string; href: string }) {
  return (
    <a 
      href={href}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
    >
      <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{title}</h5>
      <p className="font-normal text-gray-700">Click to access</p>
    </a>
  );
}
