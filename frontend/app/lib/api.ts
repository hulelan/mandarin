import type { EvaluationResponse } from "@/app/types";

export interface PDFExtractResponse {
  text: string;
  char_count: number;
}

export async function extractPDF(
  file: File,
  startPage: number,
  endPage: number | null,
  cleanup: boolean = true
): Promise<PDFExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("start_page", String(startPage));
  if (endPage !== null) {
    formData.append("end_page", String(endPage));
  }
  formData.append("cleanup", String(cleanup));

  const response = await fetch("/api/extract-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDF extraction failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function evaluatePronunciation(
  audioBlob: Blob,
  sentence: string
): Promise<EvaluationResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  formData.append("sentence", sentence);

  // Uses relative URL — Next.js rewrites /api/* to the backend
  const response = await fetch(`/api/evaluate`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evaluation failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
