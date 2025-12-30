/**
 * useDPCMetrics - Hook for DPC-focused efficiency metrics tracking
 * Based on ADMIRAL_UNIFIED_SALES_FRAMEWORK.md Part 8
 *
 * Fetches daily metrics from Dexie cache
 * Calculates rolling 7-day DPC, ECR, EAR
 * Tracks session enrollments/confirmations
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { progressionDb, type DailyMetrics } from '../lib/progressionDb';
import {
  type DPCMetrics,
  buildDPCMetrics,
  RAMP_THRESHOLD,
} from '../lib/dpcMetrics';

// Extended daily metrics with enrollment tracking
interface ExtendedDailyMetrics extends DailyMetrics {
  enrollments?: number;
  confirmedEnrollments?: number;
  unconfirmedEnrollments?: number;
  declinedEnrollments?: number;
}

interface UseDPCMetricsReturn {
  metrics: DPCMetrics;
  isLoading: boolean;
  error: string | null;

  // Session tracking
  sessionEnrollments: number;
  sessionConfirmations: number;
  sessionAppointments: number;
  sessionDials: number;

  // Actions
  recordDial: () => Promise<void>;
  recordEnrollment: () => Promise<void>;
  recordConfirmation: () => Promise<void>;
  recordAppointment: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

// Storage key for DPC-specific metrics (extends dailyMetrics)
const DPC_STORAGE_KEY = 'ads_dpc_metrics';

interface StoredDPCData {
  date: string;
  enrollments: number;
  confirmedEnrollments: number;
  unconfirmedEnrollments: number;
  declinedEnrollments: number;
  cumulativeConfirmed: number; // Running total for ramp tracking
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getStoredDPCData(): StoredDPCData {
  try {
    const stored = localStorage.getItem(DPC_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if it's a new day
      if (data.date !== getTodayKey()) {
        return createEmptyDPCData();
      }
      return data;
    }
  } catch {
    // Ignore parse errors
  }
  return createEmptyDPCData();
}

function createEmptyDPCData(): StoredDPCData {
  return {
    date: getTodayKey(),
    enrollments: 0,
    confirmedEnrollments: 0,
    unconfirmedEnrollments: 0,
    declinedEnrollments: 0,
    cumulativeConfirmed: 0,
  };
}

function saveStoredDPCData(data: StoredDPCData): void {
  localStorage.setItem(DPC_STORAGE_KEY, JSON.stringify({
    ...data,
    date: getTodayKey(),
  }));
}

// Get cumulative confirmed count (for ramp tracking)
function getCumulativeConfirmedKey(): string {
  return 'ads_dpc_cumulative_confirmed';
}

function getCumulativeConfirmed(): number {
  try {
    const stored = localStorage.getItem(getCumulativeConfirmedKey());
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementCumulativeConfirmed(): number {
  const current = getCumulativeConfirmed();
  const newValue = current + 1;
  localStorage.setItem(getCumulativeConfirmedKey(), String(newValue));
  return newValue;
}

export function useDPCMetrics(): UseDPCMetricsReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);
  const [dpcData, setDPCData] = useState<StoredDPCData>(getStoredDPCData());
  const [cumulativeConfirmed, setCumulativeConfirmed] = useState(getCumulativeConfirmed());
  const [previousDPC, setPreviousDPC] = useState<number | undefined>(undefined);

  // Session tracking (resets on page load)
  const [sessionDials, setSessionDials] = useState(0);
  const [sessionEnrollments, setSessionEnrollments] = useState(0);
  const [sessionConfirmations, setSessionConfirmations] = useState(0);
  const [sessionAppointments, setSessionAppointments] = useState(0);

  // Load metrics on mount
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's metrics from Dexie
      const today = getTodayKey();
      let todayMetrics = await progressionDb.dailyMetrics
        .where('date')
        .equals(today)
        .first();

      if (!todayMetrics) {
        // Create today's record if doesn't exist
        const newMetrics: DailyMetrics = {
          date: today,
          dials: 0,
          connects: 0,
          callsUnder30s: 0,
          callsOver2Min: 0,
          appointments: 0,
          shows: 0,
          deals: 0,
          smsEnrollments: 0,
        };
        await progressionDb.dailyMetrics.add(newMetrics);
        todayMetrics = await progressionDb.dailyMetrics.where('date').equals(today).first();
      }

      setDailyMetrics(todayMetrics || null);

      // Load DPC-specific data from localStorage
      const storedDPC = getStoredDPCData();
      setDPCData(storedDPC);
      setCumulativeConfirmed(getCumulativeConfirmed());

      // Calculate previous period DPC for trend
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const previousMetrics = await progressionDb.dailyMetrics
        .where('date')
        .below(today)
        .toArray();

      if (previousMetrics.length > 0) {
        const totalPrevDials = previousMetrics.reduce((sum, m) => sum + (m.dials || 0), 0);
        // For previous DPC, we'd need previous confirmations - use SMS enrollments as proxy
        const totalPrevConfirmed = previousMetrics.reduce((sum, m) => sum + (m.smsEnrollments || 0), 0);
        if (totalPrevConfirmed > 0) {
          setPreviousDPC(Math.round(totalPrevDials / totalPrevConfirmed));
        }
      }
    } catch (err) {
      console.error('[useDPCMetrics] Failed to load metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Build the DPCMetrics object
  const metrics = useMemo<DPCMetrics>(() => {
    const rawData = {
      totalDials: (dailyMetrics?.dials || 0) + sessionDials,
      totalEnrollments: dpcData.enrollments + sessionEnrollments,
      confirmedEnrollments: dpcData.confirmedEnrollments + sessionConfirmations,
      unconfirmedEnrollments: dpcData.unconfirmedEnrollments,
      declinedEnrollments: dpcData.declinedEnrollments,
      appointments: (dailyMetrics?.appointments || 0) + sessionAppointments,
    };

    // Use SMS enrollments as additional confirmed if we don't have DPC-specific data yet
    if (rawData.confirmedEnrollments === 0 && dailyMetrics?.smsEnrollments) {
      rawData.totalEnrollments = Math.max(rawData.totalEnrollments, dailyMetrics.smsEnrollments);
      rawData.confirmedEnrollments = dailyMetrics.smsEnrollments;
    }

    return buildDPCMetrics(rawData, previousDPC);
  }, [dailyMetrics, dpcData, sessionDials, sessionEnrollments, sessionConfirmations, sessionAppointments, previousDPC]);

  // Record a dial
  const recordDial = useCallback(async () => {
    setSessionDials(prev => prev + 1);

    // Update Dexie
    try {
      const today = getTodayKey();
      const current = await progressionDb.dailyMetrics.where('date').equals(today).first();
      if (current?.id) {
        await progressionDb.dailyMetrics.update(current.id, {
          dials: (current.dials || 0) + 1,
        });
      }
    } catch (err) {
      console.error('[useDPCMetrics] Failed to record dial:', err);
    }
  }, []);

  // Record an enrollment
  const recordEnrollment = useCallback(async () => {
    setSessionEnrollments(prev => prev + 1);

    // Update localStorage
    const updated = {
      ...getStoredDPCData(),
      enrollments: getStoredDPCData().enrollments + 1,
    };
    setDPCData(updated);
    saveStoredDPCData(updated);
  }, []);

  // Record a confirmation (enrollment is now confirmed)
  const recordConfirmation = useCallback(async () => {
    setSessionConfirmations(prev => prev + 1);

    // Update localStorage
    const currentData = getStoredDPCData();
    const updated = {
      ...currentData,
      confirmedEnrollments: currentData.confirmedEnrollments + 1,
    };
    setDPCData(updated);
    saveStoredDPCData(updated);

    // Increment cumulative for ramp tracking
    const newCumulative = incrementCumulativeConfirmed();
    setCumulativeConfirmed(newCumulative);

    // Also update SMS enrollments in Dexie for compatibility
    try {
      const today = getTodayKey();
      const current = await progressionDb.dailyMetrics.where('date').equals(today).first();
      if (current?.id) {
        await progressionDb.dailyMetrics.update(current.id, {
          smsEnrollments: (current.smsEnrollments || 0) + 1,
        });
      }
    } catch (err) {
      console.error('[useDPCMetrics] Failed to record confirmation:', err);
    }
  }, []);

  // Record an appointment
  const recordAppointment = useCallback(async () => {
    setSessionAppointments(prev => prev + 1);

    // Update Dexie
    try {
      const today = getTodayKey();
      const current = await progressionDb.dailyMetrics.where('date').equals(today).first();
      if (current?.id) {
        await progressionDb.dailyMetrics.update(current.id, {
          appointments: (current.appointments || 0) + 1,
        });
      }
    } catch (err) {
      console.error('[useDPCMetrics] Failed to record appointment:', err);
    }
  }, []);

  // Refresh metrics from storage
  const refreshMetrics = useCallback(async () => {
    await loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    sessionEnrollments,
    sessionConfirmations,
    sessionAppointments,
    sessionDials,
    recordDial,
    recordEnrollment,
    recordConfirmation,
    recordAppointment,
    refreshMetrics,
  };
}

// Hook for getting just the current metrics (read-only, for display)
export function useDPCMetricsDisplay(): {
  metrics: DPCMetrics;
  isLoading: boolean;
} {
  const { metrics, isLoading } = useDPCMetrics();
  return { metrics, isLoading };
}
