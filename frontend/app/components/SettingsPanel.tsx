"use client";

import { useState } from "react";
import type { Settings } from "@/app/hooks/useSettings";

interface SettingsPanelProps {
  settings: Settings;
  onToggle: (key: keyof Settings) => void;
}

const SETTING_INFO: Record<keyof Settings, { label: string; description: string }> = {
  vadMode: {
    label: "Auto-detect speech",
    description: "Stop recording automatically when you pause speaking",
  },
  ocrCleanup: {
    label: "Clean OCR text",
    description: "Strip stray symbols from scanned PDF text",
  },
  autoAdvance: {
    label: "Auto-advance",
    description: "Move to the next sentence after recording",
  },
  showRetry: {
    label: "Show retry",
    description: "Show a retry button to re-record a sentence",
  },
};

export default function SettingsPanel({ settings, onToggle }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="text-gray-400 hover:text-gray-600 p-1"
        onClick={() => setOpen(!open)}
        aria-label="Settings"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3 space-y-3">
            <div className="text-sm font-medium text-gray-700 border-b pb-2">Settings</div>
            {(Object.keys(SETTING_INFO) as (keyof Settings)[]).map((key) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer">
                <div className="pt-0.5">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative
                      ${settings[key] ? "bg-blue-500" : "bg-gray-300"}`}
                    onClick={(e) => { e.preventDefault(); onToggle(key); }}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                        ${settings[key] ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0" onClick={(e) => { e.preventDefault(); onToggle(key); }}>
                  <div className="text-sm font-medium text-gray-800">{SETTING_INFO[key].label}</div>
                  <div className="text-xs text-gray-500">{SETTING_INFO[key].description}</div>
                </div>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
