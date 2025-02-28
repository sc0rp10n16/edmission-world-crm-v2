import { User, UserRole } from '../types/user';

// Define permissions for each role
export type Permission = 
  // Admin permissions
  | 'manage:users'
  | 'view:analytics'
  | 'manage:teams'
  // Sales manager permissions
  | 'upload:leads'
  | 'manage:team_members'
  | 'assign:leads'
  | 'view:team_performance'
  // Telemarketer permissions
  | 'view:assigned_leads'
  | 'update:lead_status'
  | 'track:daily_quota'
  // Counselor permissions
  | 'manage:student_applications'
  | 'update:application_status'
  | 'review:documents'
  // Student permissions
  | 'view:application_status'
  | 'upload:documents'
  | 'track:progress';

// Map roles to permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'manage:users',
    'view:analytics',
    'manage:teams',
    'upload:leads',
    'manage:team_members',
    'assign:leads',
    'view:team_performance',
    'manage:student_applications',
    'update:application_status',
    'review:documents'
  ],
  sales_manager: [
    'upload:leads',
    'manage:team_members',
    'assign:leads',
    'view:team_performance',
    'view:assigned_leads'
  ],
  telemarketer: [
    'view:assigned_leads',
    'update:lead_status',
    'track:daily_quota'
  ],
  counselor: [
    'manage:student_applications',
    'update:application_status',
    'review:documents'
  ],
  student: [
    'view:application_status',
    'upload:documents',
    'track:progress'
  ]
};

// Check if a user has a specific permission
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

// Check if a user has a specific role
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

// Get all permissions for a user
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];
  return rolePermissions[user.role] || [];
}
