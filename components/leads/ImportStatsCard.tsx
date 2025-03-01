// components/leads/ImportStatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, Calendar, BarChart } from 'lucide-react';

interface ImportStatsCardProps {
  total: number;
  successful: number;
  failed: number;
  lastImport: Date | null;
}

export default function ImportStatsCard({ total, successful, failed, lastImport }: ImportStatsCardProps) {
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Import Statistics</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <ArrowUpCircle className="h-3 w-3 mr-1" />
            {total} Total Leads
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-sm font-medium">Success Rate</p>
              <p className="text-sm font-medium">{successRate}%</p>
            </div>
            <Progress value={successRate} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <p>{successful} Successful</p>
              <p>{failed} Failed</p>
            </div>
          </div>
          
          {lastImport && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-sm text-gray-600">Last Import</p>
              </div>
              <p className="text-sm">{lastImport.toLocaleDateString()}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-600">Conversion Trend</p>
            </div>
            <Badge variant="outline" className="text-green-600">+12%</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}