import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HelmUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'rep';
  fieldops_agent_id: string;
  workspaceMemberId?: string; // Twenty CRM workspace member ID
}

// Helm registry user mappings (matches helm_registry in Supabase)
// This is the source of truth for user -> agent assignments
// Shared across HELM, Compass, and Academy
export const HELM_USERS: HelmUser[] = [
  { id: '1', name: 'David Edwards', email: 'davide@admiralenergy.ai', role: 'owner', fieldops_agent_id: 'fo-005', workspaceMemberId: '2d44f68a-31e3-4361-957c-724daa96125f' },
  { id: '2', name: 'Nate Jenkins', email: 'nathanielj@admiralenergy.ai', role: 'manager', fieldops_agent_id: 'fo-003' },
  { id: '3', name: 'Edwin Stewart', email: 'thesolardistrict@gmail.com', role: 'rep', fieldops_agent_id: 'fo-004' },
  { id: '4', name: 'Loie Hallug', email: 'info@thekardangroupltd.com', role: 'rep', fieldops_agent_id: 'fo-010' },
  { id: '5', name: 'Kareem Hallug', email: 'khallug@kardansolar.com', role: 'rep', fieldops_agent_id: 'fo-002' },
  { id: '6', name: 'Jonathan Lindqvist', email: 'lindqvist@logicside.co', role: 'rep', fieldops_agent_id: 'fo-001' },
];

interface UserContextType {
  currentUser: HelmUser | null;
  setCurrentUser: (user: HelmUser) => void;
  isLoading: boolean;
  loginByEmail: (email: string) => HelmUser | null;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'academy_current_user';

// Lookup user by email
function findUserByEmail(email: string): HelmUser | null {
  const lowerEmail = email.toLowerCase();
  return HELM_USERS.find(u => u.email.toLowerCase() === lowerEmail) || null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<HelmUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from stored session
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const user = HELM_USERS.find(u => u.id === parsed.id) ||
                     findUserByEmail(parsed.email);
        if (user) {
          setCurrentUserState(user);
        }
      } catch {
        // Invalid stored data, will show login
      }
    }
    setIsLoading(false);
  }, []);

  const setCurrentUser = (user: HelmUser) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  };

  const loginByEmail = (email: string): HelmUser | null => {
    const user = findUserByEmail(email);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUserState(null);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isLoading, loginByEmail, logout }}>
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
