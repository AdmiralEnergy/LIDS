import { useState, useEffect } from 'react';
import { WifiOff, Database } from 'lucide-react';
import { isOfflineMode, isDemoMode } from '@/lib/settings';

export function OfflineBanner() {
  const [offline, setOffline] = useState(isOfflineMode());
  const [demo, setDemo] = useState(isDemoMode());

  useEffect(() => {
    function updateStatus() {
      setOffline(isOfflineMode());
      setDemo(isDemoMode());
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  if (!offline && !demo) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-sm ${
        offline
          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b border-yellow-500/20'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b border-blue-500/20'
      }`}
      data-testid="banner-offline-status"
    >
      {offline ? <WifiOff className="w-4 h-4" /> : <Database className="w-4 h-4" />}
      <span>
        {offline
          ? 'Offline Mode - Using local data'
          : 'Demo Mode - Using simulated agent responses'}
      </span>
    </div>
  );
}
