'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/auth/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CallDialog } from '@/components/call-dialog';

// Enhanced Lead interface to match the new Call Dialog requirements
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
  followUpStage?: number;
  lastContactedAt?: Date | null;
  totalCallAttempts?: number;
  lastFollowUpDate?: Timestamp;
  nextFollowUpDate?: Timestamp;
  notes?: string;
}

export default function TelemarketersLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    course: '',
    dateFrom: '',
    dateTo: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const leadsRef = collection(db, 'leads');
        
        // Construct query with filters
        let leadsQuery = query(
          leadsRef, 
          where('assignedTo', '==', user.uid)
        );

        const snapshot = await getDocs(leadsQuery);
        const fetchedLeads = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastContactedAt: doc.data().lastContactedAt 
            ? new Date(doc.data().lastContactedAt.toDate()) 
            : null
        } as Lead));

        setLeads(fetchedLeads);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [user]);

  const LeadStatusBadge = ({ status }: { status: string }) => {
    const getStatusVariant = (status: string) => {
      switch (status) {
        case 'new': return 'secondary';
        case 'in_progress': return 'outline';
        case 'follow_up1': return 'default';
        case 'follow_up2': return 'default';
        case 'follow_up3': return 'default';
        case 'qualified': return 'default';
        case 'not_interested': return 'destructive';
        default: return 'secondary';
      }
    };

    return (
      <Badge variant={getStatusVariant(status)}>
        {status.replace('_', ' ')}
      </Badge>
    );
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Leads</h1>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Select 
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.course}
            onValueChange={(value) => setFilters(prev => ({ ...prev, course: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MBA">MBA</SelectItem>
              <SelectItem value="MS">MS</SelectItem>
              {/* Add more courses */}
            </SelectContent>
          </Select>

          <Input 
            type="date" 
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            placeholder="From Date" 
          />

          <Input 
            type="date" 
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            placeholder="To Date" 
          />
        </div>

        {/* Leads Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contacted</TableHead>
              <TableHead>Call Attempts</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map(lead => (
              <TableRow key={lead.id}>
                <TableCell>{lead.name}</TableCell>
                <TableCell>
                  {lead.email} <br />
                  {lead.phone}
                </TableCell>
                <TableCell>{lead.course}</TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell>
                  {lead.lastContactedAt 
                    ? lead.lastContactedAt.toLocaleDateString() 
                    : 'Never'}
                </TableCell>
                <TableCell>{lead.totalCallAttempts || 0}</TableCell>
                <TableCell>
                  <CallDialog lead={lead} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}