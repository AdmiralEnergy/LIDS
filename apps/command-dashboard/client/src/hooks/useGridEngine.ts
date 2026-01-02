import { useState, useCallback, useEffect } from "react";
import { getSettings } from "@/lib/settings";
import type { CountyStatus, NWSAlert, OutageData } from "@shared/schema";

interface GridEngineData {
  counties: CountyStatus[];
  alerts: NWSAlert[];
  outages: OutageData;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Hook for Grid Engine data (NC counties, NWS alerts, power outages)
 * Handles real API calls to the Grid Engine on Oracle ARM
 */
export function useGridEngine() {
  const [counties, setCounties] = useState<CountyStatus[]>([]);
  const [alerts, setAlerts] = useState<NWSAlert[]>([]);
  const [outages, setOutages] = useState<OutageData>({
    counties: {},
    totalCountiesAffected: 0,
    totalCustomersAffected: 0,
    lastUpdated: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  /**
   * Get host and port from settings
   */
  const getHostPort = useCallback(() => {
    const settings = getSettings();
    let host = "193.122.153.249";
    let port = "4120";

    try {
      const url = new URL(settings.gridEngineUrl);
      host = url.hostname;
      port = url.port || "4120";
    } catch {
      // Use defaults
    }

    return { host, port };
  }, []);

  /**
   * Fetch all counties status
   */
  const fetchCounties = useCallback(async () => {
    const { host, port } = getHostPort();
    const response = await fetch(`/api/grid/counties?host=${host}&port=${port}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return response.json();
  }, [getHostPort]);

  /**
   * Fetch active NWS alerts
   */
  const fetchAlerts = useCallback(async () => {
    const { host, port } = getHostPort();
    const response = await fetch(`/api/grid/alerts?host=${host}&port=${port}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return response.json();
  }, [getHostPort]);

  /**
   * Fetch current outages
   */
  const fetchOutages = useCallback(async () => {
    const { host, port } = getHostPort();
    const response = await fetch(`/api/grid/outages?host=${host}&port=${port}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    return response.json();
  }, [getHostPort]);

  /**
   * Refresh all Grid Engine data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [countiesData, alertsData, outagesData] = await Promise.all([
        fetchCounties().catch(e => ({ counties: [], error: e.message })),
        fetchAlerts().catch(e => ({ alerts: [], error: e.message })),
        fetchOutages().catch(e => ({ counties: {}, totalCountiesAffected: 0, totalCustomersAffected: 0, error: e.message })),
      ]);

      // Update state with fetched data
      if (countiesData.counties) {
        setCounties(countiesData.counties);
      }
      if (alertsData.alerts) {
        setAlerts(alertsData.alerts);
      }
      if (outagesData.counties) {
        setOutages(outagesData);
      }

      // Check for errors
      const errors = [
        countiesData.error,
        alertsData.error,
        outagesData.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch grid data");
    } finally {
      setIsLoading(false);
    }
  }, [fetchCounties, fetchAlerts, fetchOutages]);

  /**
   * Check Grid Engine health
   */
  const checkHealth = useCallback(async () => {
    const { host, port } = getHostPort();
    try {
      const response = await fetch(`/api/health/gridEngine?host=${host}&port=${port}`);
      return response.json();
    } catch (err) {
      return {
        status: "offline",
        error: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }, [getHostPort]);

  return {
    counties,
    alerts,
    outages,
    isLoading,
    error,
    lastUpdated,
    refresh,
    checkHealth,
  };
}
