"use client";

import { useState, useRef, useCallback } from "react";
import { blobToWav } from "@/app/lib/audio";

interface RecordButtonProps {
  disabled: boolean;
  onRecordingComplete: (wavBlob: Blob) => void;
}

export default function RecordButton({
  disabled,
  onRecordingComplete,
}: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick a supported mimeType (Safari doesn't support webm)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const wavBlob = await blobToWav(blob);
        onRecordingComplete(wavBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  if (disabled && !isRecording) {
    return (
      <span className="text-sm text-gray-400 py-3">
        Tap a sentence above to select it
      </span>
    );
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 min-w-[160px] px-8 py-4 rounded-full
                  text-white text-lg font-medium transition-all active:scale-95
                  ${isRecording
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-red-500 hover:bg-red-600"}`}
      onClick={isRecording ? stopRecording : startRecording}
    >
      {isRecording ? (
        <>
          <span className="w-4 h-4 bg-red-500 rounded-sm animate-pulse" />
          Stop
        </>
      ) : (
        <>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          Record
        </>
      )}
    </button>
  );
}
