import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// User interface matching Postiz structure
export interface PostizUser {
  id: string;           // Permanent UUID from Postiz (never changes)
  email: string;        // Current email (mutable)
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  orgId?: string;
  orgName?: string;
  // Compatibility with existing code
  name: string;
  fieldops_agent_id: string;
  hasLiveWireAccess: boolean;
}

// Map Postiz roles to fieldops agents
const ROLE_TO_AGENT: Record<string, string> = {
  SUPERADMIN: "fo-005",  // Owner
  ADMIN: "fo-007",       // CMO/Manager
  USER: "fo-001",        // Rep
};

interface UserContextType {
  currentUser: PostizUser | null;
  setCurrentUser: (user: PostizUser) => void;
  assignedAgentId: string;
  hasLiveWireAccess: boolean;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  loginByEmail: (email: string) => Promise<PostizUser | null>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'studio_postiz_user';
const USER_ID_KEY = 'postizUserId';

export function PostizUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<PostizUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate stored user ID on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const storedUserId = localStorage.getItem(USER_ID_KEY);

      if (storedUserId) {
        setIsValidating(true);
        try {
          const response = await fetch('/api/postiz/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: storedUserId }),
          });

          const data = await response.json();

          if (data.valid && data.user) {
            const user = buildPostizUser(data.user);
            setCurrentUserState(user);
            // Update stored user data in case email/role changed
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          } else {
            // Session invalid - clear storage
            console.warn('[PostizAuth] Stored session invalid:', data.error);
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(USER_ID_KEY);
          }
        } catch (err) {
          console.error('[PostizAuth] Validation error:', err);
          // Keep user logged in if validation fails (network issue)
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setCurrentUserState(JSON.parse(stored));
            } catch {}
          }
        }
        setIsValidating(false);
      }

      setIsLoading(false);
    }

    init();
  }, []);

  // Build user object with compatibility fields
  function buildPostizUser(data: any): PostizUser {
    const role = data.role || 'USER';
    return {
      id: data.id,
      email: data.email,
      role: role,
      orgId: data.orgId,
      orgName: data.orgName,
      // Compatibility fields
      name: data.email.split('@')[0],
      fieldops_agent_id: ROLE_TO_AGENT[role] || 'fo-001',
      hasLiveWireAccess: ['SUPERADMIN', 'ADMIN'].includes(role),
    };
  }

  // Set current user and persist
  const setCurrentUser = useCallback((user: PostizUser) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(USER_ID_KEY, user.id);
  }, []);

  // Login by email
  const loginByEmail = useCallback(async (email: string): Promise<PostizUser | null> => {
    setError(null);

    try {
      const response = await fetch('/api/postiz/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        setError(data.error || 'Login failed');
        return null;
      }

      const user = buildPostizUser(data);

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(USER_ID_KEY, user.id);

      setCurrentUserState(user);
      return user;

    } catch (err) {
      console.error('[PostizAuth] Login error:', err);
      setError('Connection failed. Please try again.');
      return null;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setCurrentUserState(null);
  }, []);

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      assignedAgentId: currentUser?.fieldops_agent_id || 'fo-001',
      hasLiveWireAccess: currentUser?.hasLiveWireAccess || false,
      isLoading,
      isValidating,
      error,
      loginByEmail,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within PostizUserProvider');
  }
  return context;
}

// Helper to get stored user ID
export function getStoredPostizUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

// Export empty arrays for compatibility
export const HELM_USERS: PostizUser[] = [];
export const DEMO_USERS = HELM_USERS;
