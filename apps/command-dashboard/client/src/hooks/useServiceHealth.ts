import { useState, useCallback, useEffect } from "react";
import { getSettings } from "@/lib/settings";
import type { ServiceHealthResult } from "@shared/schema";

interface UseServiceHealthOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

/**
 * Hook for monitoring infrastructure health across all services
 */
export function useServiceHealth(options: UseServiceHealthOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [services, setServices] = useState<ServiceHealthResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  /**
   * Build service configurations from settings
   */
  const getServiceConfigs = useCallback(() => {
    const settings = getSettings();

    const parseUrl = (url: string, defaultHost: string, defaultPort: string) => {
      try {
        const parsed = new URL(url);
        return { host: parsed.hostname, port: parsed.port || defaultPort };
      } catch {
        return { host: defaultHost, port: defaultPort };
      }
    };

    return [
      // Oracle ARM services
      {
        name: "grid-engine",
        ...parseUrl(settings.gridEngineUrl, "193.122.153.249", "4120"),
        healthEndpoint: "/health",
      },
      {
        name: "deepseek",
        ...parseUrl(settings.deepSeekUrl, "193.122.153.249", "11434"),
        healthEndpoint: "/api/tags",
      },
      // Admiral-Server services
      {
        name: "livewire",
        ...parseUrl(settings.liveWireUrl, "192.168.1.23", "5000"),
        healthEndpoint: "/health",
      },
      {
        name: "agent-claude",
        ...parseUrl(settings.agentClaudeUrl, "192.168.1.23", "4110"),
        healthEndpoint: "/health",
      },
      {
        name: "oracle-memory",
        ...parseUrl(settings.oracleMemoryUrl, "192.168.1.23", "4050"),
        healthEndpoint: "/health",
      },
      {
        name: "twilio-service",
        ...parseUrl(settings.twilioServiceUrl, "192.168.1.23", "4115"),
        healthEndpoint: "/health",
      },
      {
        name: "n8n",
        ...parseUrl(settings.n8nUrl, "192.168.1.23", "5678"),
        healthEndpoint: "/healthz",
      },
      // Droplet services
      {
        name: "twenty-crm",
        ...parseUrl(settings.twentyCrmUrl, "localhost", "3001"),
        healthEndpoint: "/healthz",
      },
    ];
  }, []);

  /**
   * Check health of a single service
   */
  const checkService = useCallback(async (
    name: string,
    host: string,
    port: string,
    healthEndpoint: string
  ): Promise<ServiceHealthResult> => {
    try {
      const start = Date.now();
      const response = await fetch(`/api/health/${name}?host=${host}&port=${port}`);
      const data = await response.json();

      return {
        name,
        status: data.status || "unknown",
        host,
        port,
        responseTime: data.responseTime,
        error: data.error,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        name,
        status: "offline",
        host,
        port,
        error: err instanceof Error ? err.message : "Connection failed",
        lastChecked: new Date().toISOString(),
      };
    }
  }, []);

  /**
   * Refresh health status for all services
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const configs = getServiceConfigs();

      // Check all services in parallel
      const results = await Promise.all(
        configs.map(config =>
          checkService(config.name, config.host, config.port, config.healthEndpoint)
        )
      );

      setServices(results);
      setLastChecked(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check services");
    } finally {
      setIsLoading(false);
    }
  }, [getServiceConfigs, checkService]);

  /**
   * Bulk refresh using server-side parallel check
   * (Faster but uses predefined service configs on server)
   */
  const refreshBulk = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/health/all");
      const data = await response.json();

      if (data.services) {
        setServices(data.services);
      }
      setLastChecked(data.lastChecked || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check services");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Calculate summary stats
  const summary = {
    healthy: services.filter(s => s.status === "healthy").length,
    degraded: services.filter(s => s.status === "degraded").length,
    offline: services.filter(s => s.status === "offline").length,
    total: services.length,
  };

  return {
    services,
    summary,
    isLoading,
    error,
    lastChecked,
    refresh,
    refreshBulk,
  };
}
