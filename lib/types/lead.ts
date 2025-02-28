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