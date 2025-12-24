import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Rep } from '../types';

interface AuthContextType {
  rep: Rep | null;
  login: (rep: Rep) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [rep, setRep] = useState<Rep | null>(null);

  useEffect(() => {
    const storedRepId = localStorage.getItem('repId');
    const storedRepName = localStorage.getItem('repName');
    const storedRepEmail = localStorage.getItem('repEmail');
    
    if (storedRepId && storedRepName && storedRepEmail) {
      setRep({
        id: storedRepId,
        name: storedRepName,
        email: storedRepEmail,
      });
    }
  }, []);

  const login = (repData: Rep) => {
    localStorage.setItem('repId', repData.id);
    localStorage.setItem('repName', repData.name);
    localStorage.setItem('repEmail', repData.email);
    setRep(repData);
  };

  const logout = () => {
    localStorage.removeItem('repId');
    localStorage.removeItem('repName');
    localStorage.removeItem('repEmail');
    setRep(null);
  };

  return (
    <AuthContext.Provider value={{ rep, login, logout, isAuthenticated: !!rep }}>
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
