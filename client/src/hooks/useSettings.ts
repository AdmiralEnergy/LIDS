import { useState, useCallback } from "react";
import { getSettings, saveSettings, type AppSettings } from "../lib/settings";

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(getSettings);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem("lids_settings");
    setSettingsState(getSettings());
  }, []);

  return { settings, updateSettings, resetSettings };
}
