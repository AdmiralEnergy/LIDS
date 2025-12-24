import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isOfflineMode, isDemoMode } from '@/lib/settings';
import { db, Lead as LocalLead } from '@/lib/db';
import type { Lead } from '@shared/schema';

function convertLocalLead(local: LocalLead): Lead {
  const [firstName, ...lastParts] = local.name.split(' ');
  const lastName = lastParts.join(' ') || '';
  
  return {
    id: local.id,
    firstName,
    lastName,
    email: local.email,
    phone: local.phone,
    address: local.address || '',
    city: local.city || '',
    state: local.state || 'NC',
    zip: '',
    status: local.status === 'appointment' ? 'qualified' : local.status === 'closed' ? 'closed' : local.status,
    createdAt: new Date(local.createdAt),
  };
}

export function useLeads() {
  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  
  const isOffline = isOfflineMode() || isDemoMode();

  const apiQuery = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: !isOffline,
  });

  useEffect(() => {
    if (!isOffline) {
      setLocalLoading(false);
      return;
    }

    async function loadLocalLeads() {
      try {
        const stored = await db.leads.toArray();
        const converted = stored.map(convertLocalLead);
        setLocalLeads(converted);
      } catch (e) {
        console.warn('Failed to load leads from local DB:', e);
      } finally {
        setLocalLoading(false);
      }
    }

    loadLocalLeads();
  }, [isOffline]);

  if (isOffline) {
    return {
      leads: localLeads,
      isLoading: localLoading,
    };
  }

  return {
    leads: apiQuery.data || [],
    isLoading: apiQuery.isLoading,
  };
}
