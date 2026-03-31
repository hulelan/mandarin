export type CharStatus = "correct" | "tone_wrong" | "wrong" | "missed" | "extra";

export interface CharResult {
  char: string;
  expected_pinyin: string;
  actual_pinyin: string | null;
  status: CharStatus;
}

export interface EvaluationResponse {
  transcription: string;
  characters: CharResult[];
  score: number;
}
