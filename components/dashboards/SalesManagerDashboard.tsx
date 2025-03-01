'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/auth/useAuth';


export default function SalesManagerDashboard() {
  const [teamStats, setTeamStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    totalLeads: 0,
    convertedLeads: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        
        // Get teams managed by this sales manager
        const teamsQuery = query(
          collection(db, 'teams'),
          where('managerId', '==', user.uid)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          totalLeads: doc.data().totalLeads || 0,
          convertedLeads: doc.data().convertedLeads || 0,
          ...doc.data()
        }));
        
        // Get all team members
        let totalMembers = 0;
        let totalLeads = 0;
        let convertedLeads = 0;
        
        if (teamsData.length > 0) {
          const teamIds = teamsData.map(team => team.id);
          
          // Get team members
          const usersQuery = query(
            collection(db, 'users'),
            where('teamId', 'in', teamIds)
          );
          const usersSnapshot = await getDocs(usersQuery);
          totalMembers = usersSnapshot.docs.length;
          
          // Aggregate lead stats from teams
          teamsData.forEach(team => {
            totalLeads += team.totalLeads || 0;
            convertedLeads += team.convertedLeads || 0;
          });
        }
        
        setTeamStats({
          totalTeams: teamsData.length,
          totalMembers,
          totalLeads,
          convertedLeads
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center p-6"><LoadingSpinner size="lg" /></div>;
  }

  const conversionRate = teamStats.totalLeads > 0 
    ? ((teamStats.convertedLeads / teamStats.totalLeads) * 100).toFixed(1) 
    : '0';

  return (
    <div className="bg-green-50 p-4 rounded-lg mb-4">
      <h2 className="text-lg font-semibold text-green-800">Sales Manager Dashboard</h2>
      <p>Manage your sales teams, handle lead distribution, and track team performance.</p>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-6">
        <StatCard title="Teams" value={teamStats.totalTeams} />
        <StatCard title="Team Members" value={teamStats.totalMembers} />
        <StatCard title="Total Leads" value={teamStats.totalLeads} />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} />
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <DashboardCard 
          title="Team Overview" 
          description="View and manage your teams"
          href="/sales-manager/teams" 
          color="bg-blue-500"
        />
        <DashboardCard 
          title="Lead Management" 
          description="Upload, distribute and track leads"
          href="/sales-manager/leads" 
          color="bg-purple-500"
        />
        <DashboardCard 
          title="Performance Metrics" 
          description="Analytics and team performance"
          href="/sales-manager/analytics" 
          color="bg-amber-500"
        />
        <DashboardCard 
          title="Settings" 
          description="Configure distribution rules"
          href="/sales-manager/settings" 
          color="bg-emerald-500"
        />
      </div>
      
      {/* Recent Activity (placeholder) */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
        <div className="space-y-2">
          <ActivityItem 
            message="12 new leads were added to Team Alpha" 
            time="2 hours ago" 
          />
          <ActivityItem 
            message="John Smith converted 3 leads today" 
            time="4 hours ago" 
          />
          <ActivityItem 
            message="Team performance report is available" 
            time="Yesterday" 
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DashboardCard({ 
  title, 
  description,
  href, 
  color = "bg-blue-500" 
}: { 
  title: string; 
  description: string;
  href: string; 
  color?: string;
}) {
  return (
    <Link 
      href={href}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <h5 className="mb-1 text-xl font-bold tracking-tight text-gray-900">{title}</h5>
      <p className="font-normal text-sm text-gray-600">{description}</p>
    </Link>
  );
}

function ActivityItem({ message, time }: { message: string; time: string }) {
  return (
    <div className="pb-2 border-b border-gray-100">
      <p className="text-gray-800">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  );
}