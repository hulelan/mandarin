"use client";

import { useState, useCallback, useRef } from "react";
import TextInput from "@/app/components/TextInput";
import SentenceList from "@/app/components/SentenceList";
import RecordButton from "@/app/components/RecordButton";
import SettingsPanel from "@/app/components/SettingsPanel";
import { splitSentences } from "@/app/lib/sentences";
import { evaluatePronunciation } from "@/app/lib/api";
import { useSettings } from "@/app/hooks/useSettings";
import type { EvaluationResponse } from "@/app/types";

// Lazy-load VAD component to avoid SSR/bundle issues with WASM
import { lazy, Suspense } from "react";
const VadRecordButton = lazy(() => import("@/app/components/VadRecordButton"));

export default function Home() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Map<number, EvaluationResponse>>(new Map());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings, toggle } = useSettings();
  const sentenceListRef = useRef<HTMLDivElement>(null);

  const handleSubmitText = useCallback((text: string) => {
    const split = splitSentences(text);
    setSentences(split);
    setSelectedIndex(null);
    setResults(new Map());
    setError(null);
  }, []);

  const handleRecordingComplete = useCallback(
    async (wavBlob: Blob) => {
      if (selectedIndex === null) return;

      const currentIndex = selectedIndex;
      setIsEvaluating(true);
      setError(null);

      try {
        const response = await evaluatePronunciation(
          wavBlob,
          sentences[currentIndex]
        );
        setResults((prev) => {
          const next = new Map(prev);
          next.set(currentIndex, response);
          return next;
        });

        // Auto-advance to next sentence if enabled
        if (settings.autoAdvance && currentIndex < sentences.length - 1) {
          setSelectedIndex(currentIndex + 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Evaluation failed");
      } finally {
        setIsEvaluating(false);
      }
    },
    [selectedIndex, sentences, settings.autoAdvance]
  );

  const handleRetry = useCallback((index: number) => {
    setSelectedIndex(index);
    setResults((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setSentences([]);
    setSelectedIndex(null);
    setResults(new Map());
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            读音练习 <span className="text-xs font-normal text-gray-500">Pronunciation Practice</span>
          </h1>
          <div className="flex items-center gap-2">
            {sentences.length > 0 && (
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={handleReset}
              >
                New Text
              </button>
            )}
            <SettingsPanel settings={settings} onToggle={toggle} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-28">
        {sentences.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Paste Chinese text or upload a PDF, then read each sentence aloud.
            </p>
            <TextInput onSubmit={handleSubmitText} ocrCleanup={settings.ocrCleanup} />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div ref={sentenceListRef}>
              <SentenceList
                sentences={sentences}
                selectedIndex={selectedIndex}
                results={results}
                showRetry={settings.showRetry}
                onSelect={setSelectedIndex}
                onRetry={handleRetry}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer — only on landing page */}
      {sentences.length === 0 && (
        <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-xs text-gray-400">
          Built by{" "}
          <a href="https://mossjing.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Moss Jing
          </a>
          {" "}&middot;{" "}
          <a href="mailto:moss.h.jing@gmail.com" className="text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Feedback
          </a>
        </footer>
      )}

      {/* Sticky bottom bar for recording */}
      {sentences.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
            {settings.vadMode ? (
              <Suspense fallback={<span className="text-sm text-gray-400">Loading VAD...</span>}>
                <VadRecordButton
                  disabled={selectedIndex === null || isEvaluating}
                  onRecordingComplete={handleRecordingComplete}
                />
              </Suspense>
            ) : (
              <RecordButton
                disabled={selectedIndex === null || isEvaluating}
                onRecordingComplete={handleRecordingComplete}
              />
            )}
            {isEvaluating && (
              <span className="text-sm text-blue-600 animate-pulse">
                Evaluating...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
