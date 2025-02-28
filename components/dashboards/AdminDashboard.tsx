
'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/auth/useRBAC';
import LoadingSpinner from '@/components/LoadingSpinner';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  Phone, 
  FileCheck, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Briefcase,
  Layers,
  AlertCircle
} from 'lucide-react';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Analytics Card Component
const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  loading = false 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ElementType; 
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  loading?: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
          <div className="flex items-center mt-2">
            {trend === 'up' && (
              <div className="flex items-center text-green-500 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trendValue}
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center text-red-500 text-xs">
                <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                {trendValue}
              </div>
            )}
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

// Quick Access Link Component
const QuickAccessCard = ({ 
  title, 
  description, 
  icon: Icon,
  href
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  href: string;
}) => (
  <Link href={href}>
    <Card className="h-full cursor-pointer hover:bg-gray-50 transition-colors">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  </Link>
);

// Recent Activity Item
const ActivityItem = ({ title, time, description }: { title: string; time: string; description: string }) => (
  <div className="flex items-start space-x-4 py-3 border-b last:border-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <div className="text-xs text-gray-400">{time}</div>
  </div>
);

// Team Member Item
const TeamMemberItem = ({ 
  name, 
  role, 
  leads, 
  conversion 
}: { 
  name: string; 
  role: string; 
  leads: number; 
  conversion: number 
}) => (
  <div className="flex items-center justify-between py-3 border-b last:border-0">
    <div className="flex items-center">
      <div className="h-8 w-8 rounded-full bg-gray-200 grid place-items-center text-sm font-medium">
        {name.charAt(0)}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium">{leads} leads</p>
      <p className={`text-xs ${conversion >= 30 ? 'text-green-500' : 'text-orange-500'}`}>
        {conversion}% conversion
      </p>
    </div>
  </div>
);

// Alert Item Component
const AlertItem = ({ 
  title, 
  severity, 
  time 
}: { 
  title: string; 
  severity: 'high' | 'medium' | 'low'; 
  time: string; 
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center py-2 border-b last:border-0">
      <div className={`w-2 h-2 rounded-full ${getSeverityColor()} mr-3`}></div>
      <div className="flex-1">
        <p className="text-sm">{title}</p>
      </div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, loading, hasRole } = useRBAC();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [stats, setStats] = useState({
    totalManagers: 0,
    totalTelemarketers: 0,
    totalLeads: 0,
    totalApplications: 0,
  });

  // Mock data for initial rendering
  const mockTeamMembers = [
    { name: 'Sarah Johnson', role: 'Sales Manager', leads: 120, conversion: 38 },
    { name: 'Michael Chen', role: 'Sales Manager', leads: 98, conversion: 42 },
    { name: 'Priya Sharma', role: 'Sales Manager', leads: 105, conversion: 35 },
  ];

  const mockActivities = [
    { 
      title: 'New team created', 
      time: '2h ago', 
      description: 'Sarah created a new team for International Programs' 
    },
    { 
      title: 'Performance review', 
      time: '4h ago', 
      description: 'Monthly performance report was generated' 
    },
    { 
      title: 'New user registered', 
      time: '8h ago', 
      description: 'Michael Chen joined as a Sales Manager' 
    },
    { 
      title: 'Lead batch imported', 
      time: '12h ago', 
      description: 'Priya imported 45 new leads from the USA region' 
    },
  ];

  const mockAlerts = [
    { title: 'Lead conversion rate below target for Asia team', severity: 'high', time: '3h ago' },
    { title: 'Application processing delay in Europe region', severity: 'medium', time: '6h ago' },
    { title: '5 counselors have overdue tasks', severity: 'medium', time: '8h ago' },
    { title: 'System backup completed successfully', severity: 'low', time: '12h ago' },
  ];

  useEffect(() => {
    // Check if user has admin role
    if (!loading && !hasRole('admin')) {
      redirect('/dashboard');
    }
  }, [loading, hasRole]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real application, you would fetch actual data from Firestore
        // This is just a simulation for demo purposes
        
        setStats({
          totalManagers: 5,
          totalTelemarketers: 23,
          totalLeads: 543,
          totalApplications: 128,
        });
        
        // Simulate loading
        setTimeout(() => {
          setDashboardLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardLoading(false);
      }
    };

    if (!loading && user) {
      fetchData();
    }
  }, [loading, user]);

  if (loading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }

  if (!user) {
    redirect('/login');
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your educational consultancy CRM.</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Managers"
          value={stats.totalManagers}
          description="Active team managers"
          icon={UserCheck}
          trend="up"
          trendValue="10% from last month"
          loading={dashboardLoading}
        />
        <StatCard
          title="Total Telemarketers"
          value={stats.totalTelemarketers}
          description="Across all teams"
          icon={Users}
          trend="up"
          trendValue="5% from last month"
          loading={dashboardLoading}
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          description="Generated this month"
          icon={Phone}
          trend="up"
          trendValue="15% from last month"
          loading={dashboardLoading}
        />
        <StatCard
          title="Applications"
          value={stats.totalApplications}
          description="Submitted this month"
          icon={FileCheck}
          trend="down"
          trendValue="3% from last month"
          loading={dashboardLoading}
        />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAccessCard
            title="Manage Teams"
            description="Create and manage sales teams and team managers"
            icon={Users}
            href="/admin/teams"
          />
          <QuickAccessCard
            title="Analytics"
            description="View detailed system analytics and reports"
            icon={BarChart3}
            href="/admin/analytics"
          />
          <QuickAccessCard
            title="Leads Management"
            description="Monitor and manage leads across all teams"
            icon={Briefcase}
            href="/admin/leads"
          />
          <QuickAccessCard
            title="System Settings"
            description="Configure system-wide settings and preferences"
            icon={Settings}
            href="/admin/settings"
          />
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Top Performers</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
        </TabsList>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Managers</CardTitle>
              <CardDescription>Managers with the highest lead conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {dashboardLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  mockTeamMembers.map((member, i) => (
                    <TeamMemberItem
                      key={i}
                      name={member.name}
                      role={member.role}
                      leads={member.leads}
                      conversion={member.conversion}
                    />
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/teams">View All Team Performance</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Recent Activities Tab */}
        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {dashboardLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  mockActivities.map((activity, i) => (
                    <ActivityItem
                      key={i}
                      title={activity.title}
                      time={activity.time}
                      description={activity.description}
                    />
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Activities
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* System Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important system notifications that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {dashboardLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  mockAlerts.map((alert, i) => (
                    <AlertItem
                      key={i}
                      title={alert.title}
                      severity={alert.severity as 'high' | 'medium' | 'low'}
                      time={alert.time}
                    />
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Alerts
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Status Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Lead Status Overview</h2>
        <Card>
          <CardContent className="pt-6">
            {dashboardLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">New</TableCell>
                    <TableCell className="text-right">78</TableCell>
                    <TableCell className="text-right">14.4%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">In Progress</TableCell>
                    <TableCell className="text-right">145</TableCell>
                    <TableCell className="text-right">26.7%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Follow Up</TableCell>
                    <TableCell className="text-right">192</TableCell>
                    <TableCell className="text-right">35.4%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Qualified</TableCell>
                    <TableCell className="text-right">128</TableCell>
                    <TableCell className="text-right">23.5%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/leads">View Detailed Lead Analysis</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}