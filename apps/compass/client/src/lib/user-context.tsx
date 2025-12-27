import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'coo' | 'cmo' | 'manager' | 'rep';
  fieldops_agent_id: string;
  hasLiveWireAccess?: boolean;
}

// Helm registry user mappings (matches helm_registry in Supabase)
// This is the source of truth for user → agent assignments
export const HELM_USERS: User[] = [
  { id: '1', name: 'David Edwards', email: 'davide@admiralenergy.ai', role: 'owner', fieldops_agent_id: 'fo-005', hasLiveWireAccess: true },
  { id: '2', name: 'Nate Jenkins', email: 'nathanielj@admiralenergy.ai', role: 'coo', fieldops_agent_id: 'fo-009', hasLiveWireAccess: true },
  { id: '3', name: 'Edwin Stewart', email: 'thesolardistrict@gmail.com', role: 'rep', fieldops_agent_id: 'fo-004' },
  { id: '4', name: 'Loie Hallug', email: 'info@thekardangroupltd.com', role: 'rep', fieldops_agent_id: 'fo-010' },
  { id: '5', name: 'Kareem Hallug', email: 'khallug@kardansolar.com', role: 'rep', fieldops_agent_id: 'fo-002' },
  { id: '6', name: 'Jonathan Lindqvist', email: 'lindqvist@logicside.co', role: 'rep', fieldops_agent_id: 'fo-001' },
];

// Keep for backwards compatibility
export const DEMO_USERS = HELM_USERS;

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  assignedAgentId: string;
  selectedAgentId: string;
  setSelectedAgentId: (agentId: string) => void;
  hasLiveWireAccess: boolean;
  hasGuardianAccess: boolean;
  isLoading: boolean;
  loginByEmail: (email: string) => User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'compass_current_user';
const AGENT_STORAGE_KEY = 'compass_selected_agent';
const TWENTY_CRM_HOST = import.meta.env.VITE_TWENTY_CRM_HOST;
const TWENTY_CRM_PORT = import.meta.env.VITE_TWENTY_CRM_PORT || '3001';
if (!TWENTY_CRM_HOST) {
  console.warn('VITE_TWENTY_CRM_HOST not configured');
}
const TWENTY_API_BASE = `http://${TWENTY_CRM_HOST}:${TWENTY_CRM_PORT}/rest`;
const TWENTY_API_KEY = import.meta.env.VITE_TWENTY_API_KEY || '';

// Lookup user by email (for Twenty integration)
function findUserByEmail(email: string): User | null {
  const lowerEmail = email.toLowerCase();
  return HELM_USERS.find(u => u.email.toLowerCase() === lowerEmail) || null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [selectedAgentId, setSelectedAgentIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from stored session or Twenty workspace
  useEffect(() => {
    async function initUser() {
      // First check localStorage for stored user
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const user = HELM_USERS.find(u => u.id === parsed.id) ||
                       findUserByEmail(parsed.email);
          if (user) {
            setCurrentUserState(user);
            // Restore selected agent or use default
            const storedAgent = localStorage.getItem(AGENT_STORAGE_KEY);
            setSelectedAgentIdState(storedAgent || user.fieldops_agent_id);
            setIsLoading(false);
            return;
          }
        } catch {
          // Continue to Twenty lookup
        }
      }

      // Try to get current user from Twenty CRM
      if (TWENTY_API_KEY) {
        try {
          // First try the /me endpoint for current user
          const meResponse = await fetch(`${TWENTY_API_BASE}/me`, {
            headers: {
              'Authorization': `Bearer ${TWENTY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          if (meResponse.ok) {
            const meData = await meResponse.json();
            const email = meData.data?.email || meData.email;
            if (email) {
              const user = findUserByEmail(email);
              if (user) {
                console.log('[UserContext] Auto-detected user from Twenty:', user.name);
                setCurrentUserState(user);
                setSelectedAgentIdState(user.fieldops_agent_id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
                setIsLoading(false);
                return;
              }
            }
          }

          // Fallback: try workspace members
          const response = await fetch(`${TWENTY_API_BASE}/workspaceMembers`, {
            headers: {
              'Authorization': `Bearer ${TWENTY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const members = data.data?.workspaceMembers || data.workspaceMembers || [];

            // If only one member, auto-assign
            if (members.length === 1) {
              const member = members[0];
              const email = member.userEmail || member.email || `${member.name?.firstName}@admiralenergy.ai`.toLowerCase();
              const user = findUserByEmail(email);
              if (user) {
                console.log('[UserContext] Auto-detected single workspace member:', user.name);
                setCurrentUserState(user);
                setSelectedAgentIdState(user.fieldops_agent_id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('[UserContext] Failed to fetch Twenty user:', err);
        }
      }

      // No auto-login - show login screen
      console.log('[UserContext] No user found, showing login screen');
      setCurrentUserState(null);
      setIsLoading(false);
    }

    initUser();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    setSelectedAgentIdState(user.fieldops_agent_id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  };

  const setSelectedAgentId = (agentId: string) => {
    setSelectedAgentIdState(agentId);
    localStorage.setItem(AGENT_STORAGE_KEY, agentId);
  };

  const loginByEmail = (email: string): User | null => {
    const user = findUserByEmail(email);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const assignedAgentId = currentUser?.fieldops_agent_id || 'fo-001';
  const hasLiveWireAccess = currentUser?.hasLiveWireAccess || currentUser?.role === 'owner' || false;
  const hasGuardianAccess = currentUser?.role === 'owner';

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      assignedAgentId,
      selectedAgentId: selectedAgentId || assignedAgentId,
      setSelectedAgentId,
      hasLiveWireAccess,
      hasGuardianAccess,
      isLoading,
      loginByEmail
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
