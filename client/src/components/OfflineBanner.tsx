import { WifiOff, Database } from 'lucide-react';
import { useOfflineStatus } from '@/lib/offline-context';

export function OfflineBanner() {
  const { isOffline, isDemo, shouldUseLocalData } = useOfflineStatus();

  if (!shouldUseLocalData) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-sm ${
        isOffline
          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b border-yellow-500/20'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b border-blue-500/20'
      }`}
      data-testid="banner-offline-status"
    >
      {isOffline ? <WifiOff className="w-4 h-4" /> : <Database className="w-4 h-4" />}
      <span>
        {isOffline
          ? 'Offline Mode - Using local data'
          : 'Demo Mode - Using simulated agent responses'}
      </span>
    </div>
  );
}
