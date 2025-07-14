// Frontend Permission Configuration
// This defines which roles can access different parts of the application

export const PAGE_PERMISSIONS = {
  // Dashboard pages - all authenticated users can access
  DASHBOARD: ['AGENT', 'MANAGER', 'ADMIN'],
  PROPERTIES: ['AGENT', 'MANAGER', 'ADMIN'],
  CLIENTS: ['AGENT', 'MANAGER', 'ADMIN'],
  VIEWINGS: ['AGENT', 'MANAGER', 'ADMIN'],
  
  // Settings page - only managers and admins
  SETTINGS: ['MANAGER', 'ADMIN'],
  
  // Administrative functions (if we add them)
  USER_MANAGEMENT: ['ADMIN'],
  SYSTEM_CONFIG: ['ADMIN'],
} as const;

export const FEATURE_PERMISSIONS = {
  // Property management
  CREATE_PROPERTY: ['AGENT', 'MANAGER', 'ADMIN'],
  EDIT_PROPERTY: ['AGENT', 'MANAGER', 'ADMIN'], // Backend handles ownership checks
  DELETE_PROPERTY: ['MANAGER', 'ADMIN'],
  
  // Client management
  CREATE_CLIENT: ['AGENT', 'MANAGER', 'ADMIN'],
  EDIT_CLIENT: ['AGENT', 'MANAGER', 'ADMIN'], // Backend handles ownership checks
  DELETE_CLIENT: ['MANAGER', 'ADMIN'],
  
  // Viewing management
  CREATE_VIEWING: ['AGENT', 'MANAGER', 'ADMIN'],
  EDIT_VIEWING: ['AGENT', 'MANAGER', 'ADMIN'], // Backend handles ownership checks
  DELETE_VIEWING: ['MANAGER', 'ADMIN'],
  
  // Settings management
  MANAGE_PARISHES: ['MANAGER', 'ADMIN'],
  MANAGE_BUDGET_TIERS: ['MANAGER', 'ADMIN'],
  MANAGE_USERS: ['ADMIN'],
} as const;

// Helper type for role checking
export type UserRole = 'AGENT' | 'MANAGER' | 'ADMIN';
export type PermissionKey = keyof typeof PAGE_PERMISSIONS | keyof typeof FEATURE_PERMISSIONS;

// Helper function to check if a user role has permission
export function hasPermission(userRole: UserRole, permission: PermissionKey): boolean {
  const allowedRoles = (PAGE_PERMISSIONS as any)[permission] || (FEATURE_PERMISSIONS as any)[permission];
  
  return allowedRoles ? (allowedRoles as string[]).includes(userRole) : false;
}
