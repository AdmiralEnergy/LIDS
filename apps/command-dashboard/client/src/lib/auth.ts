/**
 * Authentication Utilities for Command Dashboard
 *
 * Phase 4: LiveWire AutoGen Intelligence - RBAC Implementation
 *
 * Key Principles:
 * 1. Twenty CRM is the SOLE identity provider
 * 2. workspaceMemberId is PERMANENT, email is MUTABLE
 * 3. All Twenty API calls go through server-side proxy
 * 4. Only @admiralenergy.ai domain emails are allowed
 */

export type UserRole = 'owner' | 'coo' | 'admin' | 'standard';

export interface AuthUser {
  id: string;              // workspaceMemberId - PERMANENT identifier
  name: string;
  email: string;
  role: UserRole;
  features: string[];      // Accessible features
}

// Role configuration - centralized access control
export const ROLE_CONFIG: Record<string, {
  role: UserRole;
  name: string;
  features: string[];
}> = {
  'davide@admiralenergy.ai': {
    role: 'owner',
    name: 'David Edwards',
    features: ['livewire', 'config', 'analytics', 'admin', 'system-health', 'approve-leads']
  },
  'nathanielj@admiralenergy.ai': {
    role: 'coo',
    name: 'Nathaniel Jenkins',
    features: ['livewire', 'config', 'analytics', 'approve-leads', 'system-health']
  },
  'leighe@ripemerchant.host': {
    role: 'admin',
    name: 'Leigh Edwards',
    features: ['analytics', 'approve-leads', 'system-health']
  }
};

// Default role for @admiralenergy.ai users not in ROLE_CONFIG
const DEFAULT_ROLE_CONFIG = {
  role: 'standard' as UserRole,
  features: ['approve-leads', 'system-health']
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'command_dashboard_user',
  WORKSPACE_MEMBER_ID: 'command_dashboard_member_id',
} as const;

/**
 * Validate email domain
 * Only @admiralenergy.ai emails are allowed
 */
export function validateEmailDomain(email: string): { valid: boolean; error?: string } {
  const domain = email.toLowerCase().split('@')[1];

  // Check for known admin emails that may have different domains
  if (ROLE_CONFIG[email.toLowerCase()]) {
    return { valid: true };
  }

  if (domain !== 'admiralenergy.ai') {
    return {
      valid: false,
      error: 'Access restricted to @admiralenergy.ai accounts'
    };
  }

  return { valid: true };
}

/**
 * Get role configuration for an email
 */
export function getRoleForEmail(email: string): { role: UserRole; features: string[] } {
  const lowerEmail = email.toLowerCase();
  return ROLE_CONFIG[lowerEmail] || DEFAULT_ROLE_CONFIG;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(user: AuthUser | null, feature: string): boolean {
  if (!user) return false;
  return user.features.includes(feature) || user.features.includes('admin');
}

/**
 * Check if user can configure lead sources (owner/coo only)
 */
export function canConfigureLeadSources(user: AuthUser | null): boolean {
  return hasFeatureAccess(user, 'config');
}

/**
 * Check if user can approve/reject leads
 */
export function canApproveLead(user: AuthUser | null): boolean {
  return hasFeatureAccess(user, 'approve-leads');
}

/**
 * Fetch workspace members from Twenty CRM via server-side proxy
 */
export async function fetchWorkspaceMembers(): Promise<any[]> {
  try {
    const query = `
      query GetWorkspaceMembers {
        workspaceMembers {
          edges {
            node {
              id
              name { firstName lastName }
              userEmail
            }
          }
        }
      }
    `;

    const response = await fetch("/api/twenty/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error("[Auth] GraphQL proxy error:", response.status);
      return [];
    }

    const data = await response.json();

    // Check if Twenty is connected
    if (!data.connected) {
      console.error("[Auth] Twenty CRM not connected:", data.error);
      return [];
    }

    // Check for GraphQL errors
    if (data.errors || !data.data?.workspaceMembers?.edges) {
      console.error("[Auth] GraphQL errors:", data.errors);
      return [];
    }

    // Transform GraphQL edges to flat array
    return data.data.workspaceMembers.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      userEmail: edge.node.userEmail,
    }));
  } catch (error) {
    console.error("[Auth] Failed to fetch workspace members:", error);
    return [];
  }
}

/**
 * Find a workspace member by email and build AuthUser
 */
export async function findMemberByEmail(email: string): Promise<AuthUser | null> {
  const members = await fetchWorkspaceMembers();
  const lowerEmail = email.toLowerCase();

  const member = members.find((m: any) =>
    m.userEmail?.toLowerCase() === lowerEmail
  );

  if (!member) {
    return null;
  }

  const roleConfig = getRoleForEmail(email);

  return {
    id: member.id,
    name: member.name?.firstName
      ? `${member.name.firstName} ${member.name.lastName || ""}`.trim()
      : roleConfig.name || email.split("@")[0],
    email: member.userEmail || email,
    role: roleConfig.role,
    features: roleConfig.features,
  };
}

/**
 * Validate that a workspaceMemberId is still valid
 */
export async function validateMemberId(memberId: string): Promise<AuthUser | null> {
  const members = await fetchWorkspaceMembers();
  const member = members.find((m: any) => m.id === memberId);

  if (!member) {
    return null;
  }

  const roleConfig = getRoleForEmail(member.userEmail || '');

  return {
    id: member.id,
    name: member.name?.firstName
      ? `${member.name.firstName} ${member.name.lastName || ""}`.trim()
      : roleConfig.name || "User",
    email: member.userEmail || "",
    role: roleConfig.role,
    features: roleConfig.features,
  };
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Get stored workspace member ID
 */
export function getStoredMemberId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.WORKSPACE_MEMBER_ID);
}

/**
 * Store user session
 */
export function storeUserSession(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.WORKSPACE_MEMBER_ID, user.id);
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.WORKSPACE_MEMBER_ID);
}
