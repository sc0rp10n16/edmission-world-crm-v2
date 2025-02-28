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