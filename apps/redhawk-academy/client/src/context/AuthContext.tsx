import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Rep } from '../types';
import { HELM_USERS, type HelmUser } from '../lib/user-context';

interface AuthContextType {
  rep: Rep | null;
  helmUser: HelmUser | null;
  login: (rep: Rep) => void;
  loginByEmail: (email: string) => HelmUser | null;
  selectUser: (user: HelmUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  availableUsers: HelmUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'academy_current_user';

// Find user by email (case-insensitive)
function findUserByEmail(email: string): HelmUser | null {
  const lowerEmail = email.toLowerCase();
  return HELM_USERS.find(u => u.email.toLowerCase() === lowerEmail) || null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [rep, setRep] = useState<Rep | null>(null);
  const [helmUser, setHelmUser] = useState<HelmUser | null>(null);

  useEffect(() => {
    // Try to restore from new HELM_USERS storage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const user = HELM_USERS.find(u => u.id === parsed.id) ||
                     findUserByEmail(parsed.email);
        if (user) {
          setHelmUser(user);
          setRep({
            id: user.id,
            name: user.name,
            email: user.email,
          });
          return;
        }
      } catch {
        // Fall through to legacy check
      }
    }

    // Legacy: check old storage format
    const storedRepId = localStorage.getItem('repId');
    const storedRepName = localStorage.getItem('repName');
    const storedRepEmail = localStorage.getItem('repEmail');

    if (storedRepId && storedRepName && storedRepEmail) {
      // Migrate to new format if possible
      const user = findUserByEmail(storedRepEmail);
      if (user) {
        setHelmUser(user);
        setRep({
          id: user.id,
          name: user.name,
          email: user.email,
        });
        // Migrate storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
        localStorage.removeItem('repId');
        localStorage.removeItem('repName');
        localStorage.removeItem('repEmail');
      } else {
        // Unknown user, keep legacy format
        setRep({
          id: storedRepId,
          name: storedRepName,
          email: storedRepEmail,
        });
      }
    }
  }, []);

  // Select a HELM user (preferred method)
  const selectUser = (user: HelmUser) => {
    setHelmUser(user);
    setRep({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  };

  // Login by email - looks up in HELM_USERS
  const loginByEmail = (email: string): HelmUser | null => {
    const user = findUserByEmail(email);
    if (user) {
      selectUser(user);
    }
    return user;
  };

  // Legacy login method (kept for compatibility)
  const login = (repData: Rep) => {
    // Try to find in HELM_USERS first
    const user = findUserByEmail(repData.email);
    if (user) {
      selectUser(user);
    } else {
      // Allow login for unregistered users (for testing)
      setRep(repData);
      setHelmUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('repId');
    localStorage.removeItem('repName');
    localStorage.removeItem('repEmail');
    setRep(null);
    setHelmUser(null);
  };

  return (
    <AuthContext.Provider value={{
      rep,
      helmUser,
      login,
      loginByEmail,
      selectUser,
      logout,
      isAuthenticated: !!rep,
      availableUsers: HELM_USERS,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
