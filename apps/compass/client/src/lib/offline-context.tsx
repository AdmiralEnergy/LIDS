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
  const [browserOffline, setBrowserOffline] = useState(!navigator.onLine);
  const [settingsOffline, setSettingsOffline] = useState(isOfflineMode());
  const [demoEnabled, setDemoEnabled] = useState(isDemoMode());

  useEffect(() => {
    function handleOnline() {
      setBrowserOffline(false);
      setSettingsOffline(isOfflineMode());
      setDemoEnabled(isDemoMode());
    }

    function handleOffline() {
      setBrowserOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setBrowserOffline(!navigator.onLine);
      setSettingsOffline(isOfflineMode());
      setDemoEnabled(isDemoMode());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const isOffline = browserOffline || settingsOffline;
  const isDemo = demoEnabled;
  const shouldUseLocalData = isOffline || isDemo;

  const value: OfflineContextValue = {
    isOffline,
    isDemo,
    shouldUseLocalData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}
