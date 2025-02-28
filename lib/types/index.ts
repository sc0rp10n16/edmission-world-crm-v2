// types/index.ts

// User-related types
export type UserRole = 'admin' | 'sales_manager' | 'telemarketer' | 'counselor' | 'student';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  teamId?: string; // For telemarketers assigned to a sales manager
  createdAt: Date;
  updatedAt: Date;
}

// Lead-related types
export type LeadStatus = 
  | 'new'
  | 'in_progress'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'follow_up_3'
  | 'qualified'
  | 'not_interested'
  | 'completed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  assignedTo?: string;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Team-related types
export interface Team {
  id: string;
  name: string;
  managerId: string;
  members: string[]; // User IDs of team members
  createdAt: Date;
  updatedAt: Date;
}

// Performance metrics
export interface PerformanceMetrics {
  userId: string;
  period: string; // e.g., '2025-02', '2025-Q1', '2025'
  leadsAssigned: number;
  leadsContacted: number;
  leadsQualified: number;
  conversionRate: number;
  averageResponseTime: number; // in hours
  createdAt: Date;
  updatedAt: Date;
}

// Distribution settings
export type DistributionMethod = 'round_robin' | 'capacity_based' | 'performance_based';

export interface DistributionSettings {
  id: string;
  teamId: string;
  method: DistributionMethod;
  autoAssignEnabled: boolean;
  maxLeadsPerDay: number;
  reassignmentHours: number;
  prioritizeFreshLeads: boolean;
  updatedAt: Date;
  updatedBy: string;
}