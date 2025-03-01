'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';

export default function PerformanceMetricsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { hasRole, loading } = useRBAC();
  
  useEffect(() => {
    const fetchTeams = async () => {
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
          ...doc.data(),
        }));
        
        setTeams(teamsData);
        
        // Select the first team by default if available
        if (teamsData.length > 0 && !selectedTeam) {
          setSelectedTeam(teamsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, [user, selectedTeam]);
  
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!selectedTeam) return;
      
      try {
        setIsLoading(true);
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeRange === 'week') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeRange === 'quarter') {
          startDate.setMonth(startDate.getMonth() - 3);
        } else {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }
        
        // Fetch leads for the selected team and time range
        const leadsQuery = query(
          collection(db, 'leads'),
          where('teamId', '==', selectedTeam),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsData = leadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Generate conversion data
        const groupedByStatus = leadsData.reduce((acc: any, lead: any) => {
          if (!acc[lead.status]) {
            acc[lead.status] = 0;
          }
          acc[lead.status]++;
          return acc;
        }, {});
        
        const conversionChartData = Object.entries(groupedByStatus).map(([status, count]: [string, any]) => ({
          status,
          count,
          percentage: ((count / leadsData.length) * 100).toFixed(1)
        }));
        
        setConversionData(conversionChartData);
        
        // Fetch team members for performance ranking
        const usersQuery = query(
          collection(db, 'users'),
          where('teamId', '==', selectedTeam)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown', // Ensure name property exists
            ...data,
          };
        });
        
        // Calculate performance metrics for each team member
        const performanceData = usersData.map(user => {
          const userLeads = leadsData.filter((lead: any) => lead.assignedTo === user.id);
          const qualifiedLeads = userLeads.filter((lead: any) => lead.status === 'qualified').length;
          const conversionRate = userLeads.length > 0 ? (qualifiedLeads / userLeads.length) * 100 : 0;
          
          return {
            id: user.id,
            name: user.name,
            totalLeads: userLeads.length,
            qualifiedLeads,
            conversionRate: conversionRate.toFixed(1),
          };
        });
        
        // Sort by conversion rate and get top performers
        const sortedPerformers = [...performanceData].sort((a, b) => 
          parseFloat(b.conversionRate) - parseFloat(a.conversionRate)
        );
        
        setTopPerformers(sortedPerformers.slice(0, 5)); // Top 5 performers
        
        // Group leads by source
        const groupedBySource = leadsData.reduce((acc: any, lead: any) => {
          const source = lead.source || 'Unknown';
          if (!acc[source]) {
            acc[source] = {
              total: 0,
              qualified: 0,
            };
          }
          acc[source].total++;
          if (lead.status === 'qualified') {
            acc[source].qualified++;
          }
          return acc;
        }, {});
        
        const sourceChartData = Object.entries(groupedBySource).map(([source, data]: [string, any]) => ({
          source,
          total: data.total,
          qualified: data.qualified,
          conversionRate: data.total > 0 ? ((data.qualified / data.total) * 100).toFixed(1) : '0',
        }));
        
        setLeadSourceData(sourceChartData);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [selectedTeam, timeRange]);
  
  if (loading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }
  
  if (!hasRole('sales_manager') && !hasRole('admin')) {
    redirect('/dashboard');
    return null;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Performance Metrics</h1>
        <p className="text-gray-600">Analyze your team's performance and lead conversion rates</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Team Selection */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Team
          </label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedTeam || ''}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Time Range Selection */}
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Range
          </label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Conversion Rate Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Lead Conversion Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {conversionData.map((item) => (
                <div key={item.status} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">{item.status.toUpperCase()}</p>
                  <p className="text-xl font-bold">{item.count}</p>
                  <p className="text-sm text-gray-500">{item.percentage}% of total</p>
                </div>
              ))}
            </div>
            
            {/* Add visualization here if needed */}
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Conversion rate chart visualization</p>
            </div>
          </div>
          
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Top Performers</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qualified Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topPerformers.length > 0 ? (
                    topPerformers.map((performer, index) => (
                      <tr key={performer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <div className="ml-4 text-sm font-medium text-gray-900">
                              {performer.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {performer.totalLeads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {performer.qualifiedLeads}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 font-medium">
                              {performer.conversionRate}%
                            </span>
                            <div className="ml-2 w-32 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${Math.min(parseFloat(performer.conversionRate), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Lead Source Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Lead Source Analysis</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qualified Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leadSourceData.length > 0 ? (
                    leadSourceData.map((source) => (
                      <tr key={source.source}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {source.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {source.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {source.qualified}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 font-medium">
                              {source.conversionRate}%
                            </span>
                            <div className="ml-2 w-32 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-green-600 h-2.5 rounded-full" 
                                style={{ width: `${Math.min(parseFloat(source.conversionRate), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}