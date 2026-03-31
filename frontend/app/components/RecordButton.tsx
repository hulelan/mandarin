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
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((t) => t.stop());

        const webmBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const wavBlob = await blobToWav(webmBlob);
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

  return (
    <div className="flex items-center gap-3">
      {!isRecording ? (
        <button
          className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full
                     hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors text-lg font-medium"
          disabled={disabled}
          onClick={startRecording}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          Record
        </button>
      ) : (
        <button
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-full
                     hover:bg-gray-800 transition-colors text-lg font-medium"
          onClick={stopRecording}
        >
          <span className="w-4 h-4 bg-red-500 rounded-sm animate-pulse" />
          Stop
        </button>
      )}
      {isRecording && (
        <span className="text-sm text-gray-500">Recording...</span>
      )}
      {disabled && !isRecording && (
        <span className="text-sm text-gray-400">Select a sentence first</span>
      )}
    </div>
  );
}
