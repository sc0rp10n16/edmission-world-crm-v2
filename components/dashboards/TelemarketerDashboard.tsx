'use client';

import { useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/auth/useAuth';
import { PhoneCall, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function TelemarketerDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    followUps: 0,
    qualified: 0,
    notInterested: 0,
    callsToday: 0,
    dailyQuota: 30, // Default quota, can be fetched from user settings
    conversionRate: 0
  });
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<Array<{
      notes: any;
      phone: ReactNode;
      name: ReactNode; id: string; nextFollowUp: Date | null; status?: string 
}>>([]);
  const [recentLeads, setRecentLeads] = useState<Array<{
      source: string;
      phone: ReactNode;
      name: ReactNode; id: string; createdAt: Date | null; status?: string 
}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        
        // Get leads assigned to this telemarketer
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', user.uid)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsData = leadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{ id: string; status?: string }>;
        
        // Get leads with upcoming follow-ups
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const tomorrow = new Date(todayDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const followUpsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', user.uid),
          where('nextFollowUp', '>=', todayDate),
          where('nextFollowUp', '<', tomorrow),
          orderBy('nextFollowUp', 'asc')
        );
        const followUpsSnapshot = await getDocs(followUpsQuery);
        const followUpsData = followUpsSnapshot.docs.map(doc => ({
          id: doc.id,
          phone: doc.data().phone || 'N/A',
          name: doc.data().name || 'N/A',
          notes: doc.data().notes || 'No notes',
          ...doc.data(),
          nextFollowUp: doc.data().nextFollowUp?.toDate()
        }));
        
        // Get recent leads
        const recentLeadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentLeadsSnapshot = await getDocs(recentLeadsQuery);
        const recentLeadsData = recentLeadsSnapshot.docs.map(doc => ({
          id: doc.id,
          phone: doc.data().phone || 'N/A',
          name: doc.data().name || 'N/A',
          source: doc.data().source || 'Unknown',
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        // Count leads by status
        const followUpsCount = leadsData.filter(lead => 
          ['inProgress', 'followUp1', 'followUp2', 'followUp3'].includes((lead.status?.toLowerCase() || ''))
        ).length;
        
        const qualifiedCount = leadsData.filter(lead => 
          lead.status?.toLowerCase() === 'qualified'
        ).length;
        
        const notInterestedCount = leadsData.filter(lead => 
          lead.status?.toLowerCase() === 'notinterested'
        ).length;
        
        // Calculate conversion rate
        const conversionRate = leadsData.length > 0 
          ? ((qualifiedCount / leadsData.length) * 100).toFixed(1) 
          : '0';
        
        // Get call logs for today (assuming you have a callLogs collection)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // This is just a placeholder. Implement actual call tracking if you have it
        const callsToday = Math.floor(Math.random() * 20); // Random number for demo
        
        setDashboardStats({
          totalLeads: leadsData.length,
          followUps: followUpsCount,
          qualified: qualifiedCount,
          notInterested: notInterestedCount,
          callsToday: callsToday,
          dailyQuota: 30, // Default value, should be fetched from settings
          conversionRate: parseFloat(conversionRate)
        });
        
        setUpcomingFollowUps(followUpsData);
        setRecentLeads(recentLeadsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center p-6"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Telemarketer Dashboard</h1>
          <p className="text-gray-600">Manage your leads and track your daily performance</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/telemarketer/leads" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            View All Leads
          </Link>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Leads" 
          value={dashboardStats.totalLeads} 
          icon={<PhoneCall className="h-5 w-5 text-blue-600" />} 
        />
        <StatCard 
          title="Active Follow-ups" 
          value={dashboardStats.followUps} 
          icon={<Calendar className="h-5 w-5 text-amber-600" />} 
        />
        <StatCard 
          title="Qualified Leads" 
          value={dashboardStats.qualified} 
          icon={<CheckCircle className="h-5 w-5 text-green-600" />} 
        />
        <StatCard 
          title="Not Interested" 
          value={dashboardStats.notInterested} 
          icon={<XCircle className="h-5 w-5 text-red-600" />} 
        />
      </div>
      
      {/* Daily Quota Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Daily Call Quota</CardTitle>
          <CardDescription>
            {dashboardStats.callsToday} of {dashboardStats.dailyQuota} calls completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(dashboardStats.callsToday / dashboardStats.dailyQuota) * 100} 
            className="h-2" 
          />
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-gray-500">
            {Math.round((dashboardStats.callsToday / dashboardStats.dailyQuota) * 100)}% of daily target
          </p>
        </CardFooter>
      </Card>
      
      {/* Performance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Performance Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{dashboardStats.conversionRate}%</p>
            <p className="text-xs text-gray-500">Leads qualified vs total leads</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Avg. Call Duration</p>
            <p className="text-2xl font-bold text-blue-600">4m 32s</p>
            <p className="text-xs text-gray-500">Average time per call</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Leads Per Day</p>
            <p className="text-2xl font-bold text-blue-600">5.3</p>
            <p className="text-xs text-gray-500">Average leads processed daily</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Today's Follow-ups</CardTitle>
            <CardDescription>Leads that need follow-up today</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingFollowUps.length > 0 ? (
              <div className="space-y-3">
                {upcomingFollowUps.slice(0, 5).map((followUp) => (
                  <Link 
                    key={followUp.id} 
                    href={`/telemarketer/leads/${followUp.id}`}
                    className="block p-3 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{followUp.name}</p>
                        <p className="text-sm text-gray-500">{followUp.phone}</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {followUp.nextFollowUp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                        {formatStatus(followUp.status || '')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {followUp.notes ? 'Has notes' : 'No notes'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No follow-ups scheduled for today</p>
            )}
          </CardContent>
          <CardFooter>
            <Link 
              href="/telemarketer/leads?filter=followup" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all follow-ups →
            </Link>
          </CardFooter>
        </Card>
        
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Recently Assigned Leads</CardTitle>
            <CardDescription>Latest leads assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <Link 
                    key={lead.id} 
                    href={`/telemarketer/leads/${lead.id}`}
                    className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.phone}</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="text-xs">
                          {lead.createdAt?.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                        {formatStatus(lead.status || '')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {lead.source || 'Unknown source'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No leads have been assigned recently</p>
            )}
          </CardContent>
          <CardFooter>
            <Link 
              href="/telemarketer/leads?filter=recent" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all leads →
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatStatus(status: string) {
  if (!status) return 'New';
  
  switch(status.toLowerCase()) {
    case 'inprogress': return 'In Progress';
    case 'followup1': return 'Follow-up 1';
    case 'followup2': return 'Follow-up 2';
    case 'followup3': return 'Follow-up 3';
    case 'qualified': return 'Qualified';
    case 'notinterested': return 'Not Interested';
    case 'needsfuturefollowup': return 'Future Follow-up';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}