import { motion } from "motion/react";
import React, { useEffect, useState, useRef } from "react";

interface ForensicLogProps {
  state: string;
}

const LOG_MESSAGES = {
  uploading: [
    "Initializing forensic buffer...",
    "Allocating neural memory space...",
    "Verifying file integrity...",
    "Standardizing color space (YCbCr)...",
  ],
  scanning: [
    "Running facial landmark detection...",
    "Mapping 68-point biometric grid...",
    "Extracting ocular regions...",
    "Analyzing skin texture variance...",
    "Calculating surface normal vectors...",
    "Detecting head-pose-to-environment alignment...",
  ],
  analyzing: [
    "Performing Discrete Cosine Transform (DCT) check...",
    "Identifying high-frequency noise patterns...",
    "Scanning for JPEG/MPEG compression artifacts...",
    "Checking for neural synthesis 'checkerboard' markers...",
    "Analyzing chromatic aberration levels...",
    "Verifying temporal coherence (frame-by-frame)...",
    "Running GAN-specific discriminator model...",
  ],
};

export const ForensicLog: React.FC<ForensicLogProps> = ({ state }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === "idle") {
      setLogs(["[READY] Awaiting forensic input..."]);
      return;
    }

    const messages = LOG_MESSAGES[state as keyof typeof LOG_MESSAGES] || [];
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < messages.length) {
        setLogs(prev => [...prev, `[INFO] ${messages[currentIdx]}`]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-4 rounded-lg border border-white/5 bg-black/40 p-4 mono text-[10px]">
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
        <span className="font-bold text-white/40">SYSTEM LOG</span>
        <span className="flex items-center gap-1 text-cyan-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" />
          ESTABLISHED
        </span>
      </div>
      <div 
        ref={scrollRef}
        className="h-32 space-y-1 overflow-y-auto scrollbar-none"
      >
        {logs.map((log, i) => (
          <div key={i} className="text-white/40">
            <span className="text-cyan-500/50">{new Date().toLocaleTimeString('en-GB', { hour12: false })} · </span>
            {log}
          </div>
        ))}
        {state !== "idle" && state !== "completed" && state !== "error" && (
          <div className="animate-pulse text-cyan-400">_</div>
        )}
      </div>
    </div>
  );
};
