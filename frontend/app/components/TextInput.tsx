"use client";

import { useState, useRef } from "react";
import { extractPDF } from "@/app/lib/api";

interface TextInputProps {
  onSubmit: (text: string) => void;
}

export default function TextInput({ onSubmit }: TextInputProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"paste" | "pdf">("paste");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePDFUpload = async () => {
    if (!pdfFile) return;
    setIsExtracting(true);
    setError(null);
    try {
      const result = await extractPDF(pdfFile, startPage, endPage);
      if (result.char_count === 0) {
        setError("No Chinese text found on the selected pages. Try different pages or check if OCR is needed.");
        return;
      }
      onSubmit(result.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                     ${mode === "paste" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setMode("paste")}
        >
          Paste Text
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                     ${mode === "pdf" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setMode("pdf")}
        >
          Upload PDF
        </button>
      </div>

      {mode === "paste" ? (
        <div className="space-y-3">
          <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-lg text-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400 resize-none"
            placeholder="粘贴中文文本在这里... (Paste Chinese text here)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!text.trim()}
            onClick={() => onSubmit(text.trim())}
          >
            Start Practice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File picker — <label> works better than onClick on mobile */}
          <label
            className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center
                       hover:border-gray-400 active:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onChange={(e) => {
                setPdfFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
            {pdfFile ? (
              <p className="text-gray-700 font-medium break-all">{pdfFile.name}</p>
            ) : (
              <p className="text-gray-400 text-lg">Tap to select a PDF</p>
            )}
          </label>

          {/* Page range */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Pages:</label>
            <input
              type="number"
              min={1}
              value={startPage}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setStartPage(val);
                if (val > endPage) setEndPage(val);
              }}
              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="number"
              min={startPage}
              value={endPage}
              onChange={(e) => setEndPage(Math.max(startPage, parseInt(e.target.value) || startPage))}
              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!pdfFile || isExtracting}
            onClick={handlePDFUpload}
          >
            {isExtracting ? "Extracting..." : "Extract & Practice"}
          </button>
        </div>
      )}
    </div>
  );
}
