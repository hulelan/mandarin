"use client";

import { annotatePinyin } from "@/app/lib/pinyin";
import type { CharResult, CharStatus } from "@/app/types";

interface SentenceCardProps {
  sentence: string;
  index: number;
  isSelected: boolean;
  results: CharResult[] | null;
  transcription: string | null;
  onSelect: () => void;
}

const statusColors: Record<CharStatus, string> = {
  correct: "bg-green-100 text-green-800",
  tone_wrong: "bg-orange-100 text-orange-800",
  wrong: "bg-red-100 text-red-800",
  missed: "bg-gray-100 text-gray-400",
  extra: "bg-purple-100 text-purple-800",
};

export default function SentenceCard({
  sentence,
  index,
  isSelected,
  results,
  transcription,
  onSelect,
}: SentenceCardProps) {
  const annotated = annotatePinyin(sentence);

  // Build a map from character index (Chinese chars only) to result
  const resultMap = new Map<number, CharResult>();
  if (results) {
    let chineseIdx = 0;
    for (let i = 0; i < annotated.length; i++) {
      if (annotated[i].isChinese) {
        if (chineseIdx < results.length) {
          resultMap.set(i, results[chineseIdx]);
        }
        chineseIdx++;
      }
    }
  }

  return (
    <button
      className={`w-full text-left p-4 rounded-lg border-2 transition-all
                  ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
      onClick={onSelect}
    >
      <div className="text-xs text-gray-400 mb-2">Sentence {index + 1}</div>
      <div className="flex flex-wrap gap-x-1 gap-y-3">
        {annotated.map((item, i) => {
          const result = resultMap.get(i);
          const colorClass = result ? statusColors[result.status] : "";
          // Only show pinyin AFTER evaluation results exist for this sentence
          const showPinyin = results !== null && item.pinyin;

          return (
            <span key={i} className="inline-flex flex-col items-center">
              {showPinyin ? (
                <span className="text-xs text-gray-500 mb-0.5">
                  {result?.status === "tone_wrong" || result?.status === "wrong"
                    ? result.actual_pinyin ?? item.pinyin
                    : item.pinyin}
                </span>
              ) : item.isChinese ? (
                <span className="text-xs mb-0.5 invisible">pin</span>
              ) : null}
              <span
                className={`text-2xl px-0.5 rounded ${colorClass}`}
                title={
                  result
                    ? `Expected: ${result.expected_pinyin}${result.actual_pinyin ? ` | You said: ${result.actual_pinyin}` : ""}`
                    : undefined
                }
              >
                {item.char}
              </span>
            </span>
          );
        })}
      </div>
      {results && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <ScoreBadge results={results} />
            <Legend />
          </div>
          {transcription && (
            <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
              <span className="font-medium text-gray-500">Heard:</span> {transcription}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function ScoreBadge({ results }: { results: CharResult[] }) {
  const correct = results.filter((r) => r.status === "correct").length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <span
      className={`font-medium ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-orange-600" : "text-red-600"}`}
    >
      {pct}% correct ({correct}/{total})
    </span>
  );
}

function Legend() {
  return (
    <div className="flex gap-3 text-xs text-gray-500">
      <span>
        <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1" />
        Correct
      </span>
      <span>
        <span className="inline-block w-3 h-3 bg-orange-100 rounded mr-1" />
        Tone
      </span>
      <span>
        <span className="inline-block w-3 h-3 bg-red-100 rounded mr-1" />
        Wrong
      </span>
      <span>
        <span className="inline-block w-3 h-3 bg-gray-100 rounded mr-1" />
        Missed
      </span>
    </div>
  );
}
