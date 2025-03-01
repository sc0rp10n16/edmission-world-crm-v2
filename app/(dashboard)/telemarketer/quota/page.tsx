'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/auth/useAuth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface QuotaMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  dailyTarget: number;
  weeklyTarget: number;
  successRate: number;
}

export default function TelemarketersQuotaPage() {
  const [quotaMetrics, setQuotaMetrics] = useState<QuotaMetrics>({
    totalLeads: 0,
    qualifiedLeads: 0,
    dailyTarget: 20,  // Default daily target
    weeklyTarget: 100, // Default weekly target
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [leadBreakdown, setLeadBreakdown] = useState<{
    status: string;
    count: number;
  }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuotaMetrics = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const leadsRef = collection(db, 'leads');
        
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Get leads for current telemarketer in the last 7 days
        const leadsQuery = query(
          leadsRef, 
          where('assignedTo', '==', user.uid),
          where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
        );

        const snapshot = await getDocs(leadsQuery);
        const leads = snapshot.docs.map(doc => doc.data());

        // Calculate metrics
        const totalLeads = leads.length;
        const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
        const successRate = totalLeads > 0 
          ? ((qualifiedLeads / totalLeads) * 100) 
          : 0;

        // Lead status breakdown
        const statusBreakdown = Object.entries(
          leads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([status, count]) => ({ status, count }));

        setQuotaMetrics({
          totalLeads,
          qualifiedLeads,
          dailyTarget: 20,
          weeklyTarget: 100,
          successRate
        });

        setLeadBreakdown(statusBreakdown);
      } catch (error) {
        console.error('Error fetching quota metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotaMetrics();
  }, [user]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'in_progress': return 'outline';
      case 'qualified': return 'default';
      case 'not_interested': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-6">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>

        {/* Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{quotaMetrics.totalLeads}</div>
              <Progress 
                value={(quotaMetrics.totalLeads / quotaMetrics.weeklyTarget) * 100} 
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Weekly Target: {quotaMetrics.weeklyTarget}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qualified Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{quotaMetrics.qualifiedLeads}</div>
              <Progress 
                value={(quotaMetrics.qualifiedLeads / quotaMetrics.qualifiedLeads) * 100} 
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Success Rate: {quotaMetrics.successRate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(quotaMetrics.totalLeads / 7).toFixed(1)} leads/day
              </div>
              <Progress 
                value={(quotaMetrics.totalLeads / (quotaMetrics.dailyTarget * 7)) * 100} 
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Daily Target: {quotaMetrics.dailyTarget}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadBreakdown.map((item) => (
                  <TableRow key={item.status}>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>
                      {((item.count / quotaMetrics.totalLeads) * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}