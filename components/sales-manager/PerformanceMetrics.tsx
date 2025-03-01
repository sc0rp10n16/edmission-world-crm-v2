// components/sales-manager/PerformanceMetrics.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// Mock data - replace with actual data from your hooks/services
const performanceData = {
  daily: [
    { name: 'Telemarketer 1', calls: 25, qualified: 4, notInterested: 15, followUps: 6 },
    { name: 'Telemarketer 2', calls: 22, qualified: 6, notInterested: 10, followUps: 6 },
    { name: 'Telemarketer 3', calls: 28, qualified: 3, notInterested: 18, followUps: 7 },
    { name: 'Telemarketer 4', calls: 19, qualified: 5, notInterested: 8, followUps: 6 },
  ],
  weekly: [
    { name: 'Week 1', calls: 120, qualified: 18, notInterested: 78, followUps: 24 },
    { name: 'Week 2', calls: 140, qualified: 22, notInterested: 85, followUps: 33 },
    { name: 'Week 3', calls: 135, qualified: 25, notInterested: 74, followUps: 36 },
    { name: 'Week 4', calls: 150, qualified: 30, notInterested: 80, followUps: 40 },
  ],
  monthly: [
    { name: 'Jan', calls: 520, qualified: 85, notInterested: 310, followUps: 125 },
    { name: 'Feb', calls: 480, qualified: 75, notInterested: 280, followUps: 125 },
    { name: 'Mar', calls: 540, qualified: 90, notInterested: 320, followUps: 130 },
    { name: 'Apr', calls: 570, qualified: 110, notInterested: 290, followUps: 170 },
  ],
};

const leadSourceData = [
  { name: 'Website', value: 35 },
  { name: 'Facebook', value: 25 },
  { name: 'Instagram', value: 18 },
  { name: 'Referrals', value: 15 },
  { name: 'Other', value: 7 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const conversionRateData = [
  { name: 'Jan', rate: 15.2 },
  { name: 'Feb', rate: 17.8 },
  { name: 'Mar', rate: 16.5 },
  { name: 'Apr', rate: 19.2 },
  { name: 'May', rate: 18.3 },
  { name: 'Jun', rate: 21.5 },
];

const PerformanceMetrics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [teamMember, setTeamMember] = useState<string>('all');

  // Get the maximum value for scaling
  const getMaxValue = (data: any[], key: string) => {
    return Math.max(...data.map(item => item[key]));
  };

  const maxCalls = getMaxValue(performanceData[timeframe], 'calls');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Analyze your team's performance and lead conversion rates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTimeframe(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="team">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Call Performance</CardTitle>
                  <CardDescription>Number of calls and outcomes by team member</CardDescription>
                </div>
                <Select value={teamMember} onValueChange={setTeamMember}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="1">Telemarketer 1</SelectItem>
                    <SelectItem value="2">Telemarketer 2</SelectItem>
                    <SelectItem value="3">Telemarketer 3</SelectItem>
                    <SelectItem value="4">Telemarketer 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Legend */}
                <div className="flex justify-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                    <span className="text-sm">Total Calls</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                    <span className="text-sm">Qualified Leads</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm mr-2"></div>
                    <span className="text-sm">Not Interested</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2"></div>
                    <span className="text-sm">Follow Ups</span>
                  </div>
                </div>
                
                {/* Bar chart */}
                <div className="space-y-4">
                  {performanceData[timeframe].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm w-32">{item.name}</span>
                        <div className="flex-1 space-y-1">
                          {/* Total Calls */}
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-4 bg-gray-100 rounded">
                              <div
                                className="h-4 bg-blue-500 rounded"
                                style={{ width: `${(item.calls / maxCalls) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-8 text-right">{item.calls}</span>
                          </div>
                          
                          {/* Qualified */}
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-green-500 rounded"
                                style={{ width: `${(item.qualified / maxCalls) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-8 text-right">{item.qualified}</span>
                          </div>
                          
                          {/* Not Interested */}
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-orange-500 rounded"
                                style={{ width: `${(item.notInterested / maxCalls) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-8 text-right">{item.notInterested}</span>
                          </div>
                          
                          {/* Follow Ups */}
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded">
                              <div
                                className="h-2 bg-yellow-500 rounded"
                                style={{ width: `${(item.followUps / maxCalls) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-8 text-right">{item.followUps}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Trends</CardTitle>
              <CardDescription>Percentage of leads that convert to applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pt-6">
                {/* Line chart using CSS */}
                <div className="relative h-64 mt-6">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
                    <div>25%</div>
                    <div>20%</div>
                    <div>15%</div>
                    <div>10%</div>
                    <div>5%</div>
                    <div>0%</div>
                  </div>
                  
                  {/* Chart area */}
                  <div className="absolute left-12 right-0 top-0 bottom-0 border-l border-b border-gray-300">
                    {/* Horizontal grid lines */}
                    <div className="absolute left-0 right-0 top-0 h-px bg-gray-200"></div>
                    <div className="absolute left-0 right-0 top-1/5 h-px bg-gray-200"></div>
                    <div className="absolute left-0 right-0 top-2/5 h-px bg-gray-200"></div>
                    <div className="absolute left-0 right-0 top-3/5 h-px bg-gray-200"></div>
                    <div className="absolute left-0 right-0 top-4/5 h-px bg-gray-200"></div>
                    
                    {/* Data points and lines */}
                    <div className="relative h-full">
                      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          points={conversionRateData
                            .map((point, index) => {
                              const x = (index / (conversionRateData.length - 1)) * 100;
                              const y = 100 - ((point.rate / 25) * 100); // Scale to 25% max
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="#8884d8"
                          strokeWidth="2"
                        />
                      </svg>
                      
                      {/* Data points */}
                      {conversionRateData.map((point, index) => {
                        const left = `${(index / (conversionRateData.length - 1)) * 100}%`;
                        const top = `${100 - ((point.rate / 25) * 100)}%`; // Scale to 25% max
                        return (
                          <div 
                            key={index}
                            className="absolute w-3 h-3 bg-purple-600 rounded-full -ml-1.5 -mt-1.5"
                            style={{ left, top }}
                            title={`${point.name}: ${point.rate}%`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="absolute left-12 right-0 bottom-0 translate-y-6 flex justify-between text-xs text-gray-500">
                    {conversionRateData.map((point, index) => (
                      <div key={index}>{point.name}</div>
                    ))}
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex justify-center mt-8">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                    <span className="text-sm">Conversion Rate (%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources Distribution</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-6">
                <div className="flex justify-center">
                  {/* Simple pie chart representation using CSS */}
                  <div className="relative w-64 h-64">
                    {leadSourceData.map((item, index, array) => {
                      // Calculate the slice positions
                      const total = array.reduce((sum, curr) => sum + curr.value, 0);
                      const startPercent = array
                        .slice(0, index)
                        .reduce((sum, curr) => sum + curr.value, 0) / total;
                      const endPercent = startPercent + item.value / total;
                      
                      const startAngle = startPercent * 360;
                      const endAngle = endPercent * 360;
                      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
                      
                      // Calculate coordinates
                      const startX = 32 + 32 * Math.cos((startAngle * Math.PI) / 180);
                      const startY = 32 + 32 * Math.sin((startAngle * Math.PI) / 180);
                      const endX = 32 + 32 * Math.cos((endAngle * Math.PI) / 180);
                      const endY = 32 + 32 * Math.sin((endAngle * Math.PI) / 180);
                      
                      return (
                        <div key={index} className="absolute top-0 left-0 w-full h-full">
                          {/* Display percentage in a separate div */}
                          <div 
                            className="absolute text-xs font-medium text-white"
                            style={{
                              left: `${32 + 20 * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)}%`,
                              top: `${32 + 20 * Math.sin(((startAngle + endAngle) / 2) * Math.PI / 180)}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            {Math.round(item.value)}%
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Simpler approach using colored squares to represent data */}
                    <div className="mt-20 grid grid-cols-2 gap-4">
                      {leadSourceData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 mr-2 rounded-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <div>
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.value}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Team Members</CardTitle>
            <CardDescription>Based on qualified leads this {timeframe.slice(0, -2)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData[timeframe]
                .sort((a, b) => b.qualified - a.qualified)
                .slice(0, 3)
                .map((member, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="flex items-center text-xs">
                        <span className="text-muted-foreground">{member.calls} calls</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">{member.qualified} qualified</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {((member.qualified / member.calls) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Conversion</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
            <CardDescription>Average time and calls per conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold">12.4</div>
                <div className="text-sm text-muted-foreground">
                  Avg. calls per qualified lead
                </div>
                <div className="text-xs text-green-600">
                  ↓ 2.1 from last {timeframe.slice(0, -2)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">3.2</div>
                <div className="text-sm text-muted-foreground">
                  Avg. follow-ups per lead
                </div>
                <div className="text-xs text-green-600">
                  ↓ 0.3 from last {timeframe.slice(0, -2)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">4.5</div>
                <div className="text-sm text-muted-foreground">
                  Avg. days to qualification
                </div>
                <div className="text-xs text-green-600">
                  ↓ 0.8 from last {timeframe.slice(0, -2)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold">18.3%</div>
                <div className="text-sm text-muted-foreground">
                  Overall conversion rate
                </div>
                <div className="text-xs text-green-600">
                  ↑ 2.1% from last {timeframe.slice(0, -2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetrics;