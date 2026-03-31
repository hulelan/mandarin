"use client";

import { useState, useEffect, useCallback } from "react";

export interface Settings {
  vadMode: boolean;
  ocrCleanup: boolean;
  autoAdvance: boolean;
  showRetry: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  vadMode: false,
  ocrCleanup: true,
  autoAdvance: true,
  showRetry: true,
};

const STORAGE_KEY = "mandarin-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, loaded]);

  const toggle = useCallback((key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { settings, toggle, loaded };
}
