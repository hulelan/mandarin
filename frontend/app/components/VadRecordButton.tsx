"use client";

import { useState, useCallback, useEffect } from "react";
import { float32ToWav } from "@/app/lib/audio";

interface VadRecordButtonProps {
  disabled: boolean;
  onRecordingComplete: (wavBlob: Blob) => void;
}

export default function VadRecordButton({
  disabled,
  onRecordingComplete,
}: VadRecordButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [vadReady, setVadReady] = useState(false);
  const [vadInstance, setVadInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(async () => {
    if (vadInstance) {
      vadInstance.start();
      setIsListening(true);
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { MicVAD } = await import("@ricky0123/vad-web");

      const vad = await MicVAD.new({
        baseAssetPath: "/",
        onnxWASMBasePath: "/",
        onSpeechEnd: (audio: Float32Array) => {
          const wavBlob = float32ToWav(audio, 16000);
          onRecordingComplete(wavBlob);
        },
      });

      vad.start();
      setVadInstance(vad);
      setVadReady(true);
      setIsListening(true);
    } catch (err) {
      console.error("VAD init failed:", err);
      setError("VAD failed to initialize. Try manual mode.");
    }
  }, [vadInstance, onRecordingComplete]);

  const stopListening = useCallback(() => {
    if (vadInstance) {
      vadInstance.pause();
      setIsListening(false);
    }
  }, [vadInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vadInstance) {
        vadInstance.destroy();
      }
    };
  }, [vadInstance]);

  if (disabled) {
    return (
      <span className="text-sm text-gray-400 py-3">
        Tap a sentence above to select it
      </span>
    );
  }

  if (error) {
    return <span className="text-sm text-red-500 py-3">{error}</span>;
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 min-w-[160px] px-8 py-4 rounded-full
                  text-white text-lg font-medium transition-all active:scale-95
                  ${isListening
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-500 hover:bg-red-600"}`}
      onClick={isListening ? stopListening : startListening}
    >
      {isListening ? (
        <>
          <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
          Listening...
        </>
      ) : (
        <>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          Start Listening
        </>
      )}
    </button>
  );
}
