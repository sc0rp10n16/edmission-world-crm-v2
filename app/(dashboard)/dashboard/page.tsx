
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRBAC } from '@/hooks/auth/useRBAC';

import LoadingSpinner from '@/components/LoadingSpinner';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SalesManagerDashboard from '@/components/dashboards/SalesManagerDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, CalendarClock, CheckCircle, Clock, Users, FileText, BarChart3, UserPlus, Building, } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TelemarketerDashboard from '@/components/dashboards/TelemarketerDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: rbacLoading } = useRBAC();
  const [stats, setStats] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    pendingTasks: 0,
    activeTeams: 0
  });
  
  // Fetch dashboard stats
  useEffect(() => {
    // In a real app, you'd fetch this from your database
    // This is just mock data for demonstration
    setStats({
      totalLeads: 256,
      convertedLeads: 128,
      pendingTasks: 12,
      activeTeams: 4
    });
  }, []);

  if (authLoading || rbacLoading) {
    return (
      <DashboardLayout>
        <div className="flex jusDashboardLayouttify-center items-center h-full p-10">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Function to get appropriate welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Current date formatted nicely
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}, {user.name}</h1>
          <p className="text-gray-500 flex items-center">
            <CalendarClock className="h-4 w-4 mr-2" />
            <span>{getCurrentDate()}</span>
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Leads</p>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-green-600 flex items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                  <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>8% increase</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Converted</p>
                  <p className="text-2xl font-bold">{stats.convertedLeads}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-green-600 flex items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                  <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>12% increase</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Tasks</p>
                  <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  <Clock size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-red-600 flex items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                  <path d="M6 2.5V9.5M6 9.5L9.5 6M6 9.5L2.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>2 new tasks</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Teams</p>
                  <p className="text-2xl font-bold">{stats.activeTeams}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <span>No change</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Role-Specific Dashboards */}
        {hasRole('admin') && (
          <AdminDashboard />
        )}
        
        {hasRole('sales_manager') && (
          <SalesManagerDashboard />
        )}
        
        {hasRole('telemarketer') && (
          <TelemarketerDashboard />
        )}
        
        {hasRole('counselor') && (
          <CounselorDashboard />
        )}
        
        {hasRole('student') && (
          <StudentDashboard />
        )}
        
      </div>
    </DashboardLayout>
  );
}

// Role-specific dashboard components


function CounselorDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Counselor Dashboard</CardTitle>
        <CardDescription>Manage student applications and documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Student Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">18</div>
                <Button size="sm">Manage</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Documents for Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">7</div>
                <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Dashboard</CardTitle>
        <CardDescription>Track your application progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
              <Button size="sm" className="w-full mt-3">View Details</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-2">3/5 Uploaded</div>
              <Button size="sm" className="w-full">Upload</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Counselor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-2">Sarah Johnson</div>
              <Button size="sm" className="w-full">Contact</Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}