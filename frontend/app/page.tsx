"use client";

import { useState, useCallback } from "react";
import TextInput from "@/app/components/TextInput";
import SentenceList from "@/app/components/SentenceList";
import RecordButton from "@/app/components/RecordButton";
import { splitSentences } from "@/app/lib/sentences";
import { evaluatePronunciation } from "@/app/lib/api";
import type { EvaluationResponse } from "@/app/types";

export default function Home() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Map<number, EvaluationResponse>>(new Map());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setIsEvaluating(true);
      setError(null);

      try {
        const response = await evaluatePronunciation(
          wavBlob,
          sentences[selectedIndex]
        );
        setResults((prev) => {
          const next = new Map(prev);
          next.set(selectedIndex, response);
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Evaluation failed");
      } finally {
        setIsEvaluating(false);
      }
    },
    [selectedIndex, sentences]
  );

  const handleReset = useCallback(() => {
    setSentences([]);
    setSelectedIndex(null);
    setResults(new Map());
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            读音练习 <span className="text-sm font-normal text-gray-500">Pronunciation Practice</span>
          </h1>
          {sentences.length > 0 && (
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={handleReset}
            >
              New Text
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {sentences.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Paste Chinese text below, then read each sentence aloud to check
              your pronunciation.
            </p>
            <TextInput onSubmit={handleSubmitText} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <RecordButton
                disabled={selectedIndex === null || isEvaluating}
                onRecordingComplete={handleRecordingComplete}
              />
              {isEvaluating && (
                <span className="text-sm text-blue-600 animate-pulse">
                  Evaluating...
                </span>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <SentenceList
              sentences={sentences}
              selectedIndex={selectedIndex}
              results={results}
              onSelect={setSelectedIndex}
            />
          </>
        )}
      </main>
    </div>
  );
}
