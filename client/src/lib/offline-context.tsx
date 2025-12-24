import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isOfflineMode, isDemoMode } from './settings';

interface OfflineContextValue {
  isOffline: boolean;
  isDemo: boolean;
  shouldUseLocalData: boolean;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOffline: true,
  isDemo: true,
  shouldUseLocalData: true,
});

export function useOfflineStatus() {
  return useContext(OfflineContext);
}

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOffline, setIsOffline] = useState(isOfflineMode());
  const [isDemo, setIsDemo] = useState(isDemoMode());

  useEffect(() => {
    function updateStatus() {
      setIsOffline(isOfflineMode());
      setIsDemo(isDemoMode());
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const value: OfflineContextValue = {
    isOffline,
    isDemo,
    shouldUseLocalData: isOffline || isDemo,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}
