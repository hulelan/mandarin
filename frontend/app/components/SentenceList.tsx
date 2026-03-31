"use client";

import SentenceCard from "./SentenceCard";
import type { EvaluationResponse } from "@/app/types";

interface SentenceListProps {
  sentences: string[];
  selectedIndex: number | null;
  results: Map<number, EvaluationResponse>;
  onSelect: (index: number) => void;
}

export default function SentenceList({
  sentences,
  selectedIndex,
  results,
  onSelect,
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
            onSelect={() => onSelect(i)}
          />
        );
      })}
    </div>
  );
}
