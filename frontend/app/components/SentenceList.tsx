"use client";

import SentenceCard from "./SentenceCard";
import type { EvaluationResponse } from "@/app/types";

interface SentenceListProps {
  sentences: string[];
  selectedIndex: number | null;
  results: Map<number, EvaluationResponse>;
  showRetry: boolean;
  onSelect: (index: number) => void;
  onRetry: (index: number) => void;
}

export default function SentenceList({
  sentences,
  selectedIndex,
  results,
  showRetry,
  onSelect,
  onRetry,
}: SentenceListProps) {
  return (
    <div className="space-y-3">
      {sentences.map((sentence, i) => {
        const evaluation = results.get(i);
        return (
          <SentenceCard
            key={i}
            sentence={sentence}
            index={i}
            isSelected={selectedIndex === i}
            results={evaluation?.characters ?? null}
            transcription={evaluation?.transcription ?? null}
            showRetry={showRetry && evaluation !== undefined}
            onSelect={() => onSelect(i)}
            onRetry={() => onRetry(i)}
          />
        );
      })}
    </div>
  );
}
