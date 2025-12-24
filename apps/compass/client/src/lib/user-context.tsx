import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'rep';
  fieldops_agent_id: string;
}

export const DEMO_USERS: User[] = [
  { id: '1', name: 'David Edwards', email: 'davide@admiralenergy.ai', role: 'owner', fieldops_agent_id: 'fo-005' },
  { id: '2', name: 'Nate Jenkins', email: 'nathanielj@admiralenergy.ai', role: 'manager', fieldops_agent_id: 'fo-003' },
  { id: '3', name: 'Edwin Stewart', email: 'thesolardistrict@gmail.com', role: 'rep', fieldops_agent_id: 'fo-004' },
  { id: '4', name: 'Loie Hallug', email: 'info@thekardangroupltd.com', role: 'rep', fieldops_agent_id: 'fo-010' },
  { id: '5', name: 'Kareem Hallug', email: 'khallug@kardansolar.com', role: 'rep', fieldops_agent_id: 'fo-002' },
  { id: '6', name: 'Jonathan Lindqvist', email: 'lindqvist@logicside.co', role: 'rep', fieldops_agent_id: 'fo-001' },
];

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  assignedAgentId: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'compass_current_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    if (typeof window === 'undefined') return DEMO_USERS[0];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return DEMO_USERS.find(u => u.id === parsed.id) || DEMO_USERS[0];
      } catch {
        return DEMO_USERS[0];
      }
    }
    return DEMO_USERS[0];
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id }));
  };

  const assignedAgentId = currentUser?.fieldops_agent_id || 'fo-001';

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, assignedAgentId }}>
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
