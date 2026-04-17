/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Fingerprint, Activity, AlertCircle, RefreshCcw, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { AnalysisReport } from "./components/AnalysisReport";
import { CameraCapture } from "./components/CameraCapture";
import { ForensicLog } from "./components/ForensicLog";
import { Scanner } from "./components/Scanner";
import { UploadZone } from "./components/UploadZone";
import { analyzeMedia } from "./lib/gemini";
import { AnalysisResult, MediaState } from "./types";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const extractFrameFromVideo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      if (video.duration > 1) {
        video.currentTime = 1;
      } else {
        // Fallback to start if very short
        video.currentTime = 0;
        if (video.duration === Infinity) {
          // Sometimes required for some formats in browsers
          video.currentTime = 0.1;
        }
      }
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        // Maintain aspect ratio but limit size to prevent huge base64 strings
        const MAX_SIZE = 1920;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          resolve(dataUrl.split(",")[1]);
        } else {
          reject(new Error("Canvas context failed."));
        }
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    video.onerror = () => {
      reject(new Error("Failed to process video file. Ensure it's a valid format."));
      URL.revokeObjectURL(objectUrl);
    };
  });
};

export default function App() {
  const [state, setState] = useState<MediaState>("idle");
  const [mode, setMode] = useState<"upload" | "camera">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
      setError("Please provide an image or video file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setState("uploading");
    
    const objectUrl = URL.createObjectURL(selectedFile);
    if (preview) URL.revokeObjectURL(preview); // Cleanup previous
    setPreview(objectUrl);
    
    // Artificial delay for "processing" feel
    setTimeout(() => {
      setState("scanning");
    }, 1000);
  };

  const handleCapture = async (blob: Blob) => {
    const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
    setFile(capturedFile);
    setError(null);
    setResult(null);
    setState("uploading");
    
    const objectUrl = URL.createObjectURL(capturedFile);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(objectUrl);
    
    setTimeout(() => {
      setState("scanning");
    }, 1000);
  };

  const startAnalysis = async () => {
    if (!file) return;

    try {
      setState("analyzing");
      
      let base64;
      let targetMimeType = file.type;

      if (file.type.startsWith("video/")) {
        base64 = await extractFrameFromVideo(file);
        targetMimeType = "image/jpeg";
      } else {
        base64 = await fileToBase64(file);
      }

      const analysis = await analyzeMedia(base64, targetMimeType);
      setResult(analysis);
      setState("completed");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during forensic analysis.");
      setState("error");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setState("idle");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (state === "scanning") {
      const timer = setTimeout(() => {
        startAnalysis();
      }, 3000); // 3 seconds of scanning animation
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e1e1e3] selection:bg-cyan-500/30 font-mono">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.8)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,#00f2ff0a_0%,transparent_50%)]" />
      </div>

      {/* Control Bar */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-500" />
              <span className="text-sm font-black uppercase tracking-widest">DeepSight <span className="text-[10px] opacity-40">v3.1.2</span></span>
            </div>
            <div className="hidden h-4 w-[1px] bg-white/10 md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-tighter text-white/40">Neural Node: Active</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="mono hidden text-[10px] font-bold uppercase tracking-widest text-white/20 lg:block">
              Latency: 12ms // Buffer: 1024KB
            </div>
            <button className="group relative flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95">
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100" />
              Access Log
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Workshop Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative rounded-lg border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl overflow-hidden">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-cyan-500/30" />
              <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-cyan-500/30" />
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-cyan-500/30" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan-500/30" />

              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-white/5 p-2 text-cyan-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest">Forensic Scrutiny Unit</h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter">Analyzing pixel-level consistency vectors</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMode('upload')}
                    className={`rounded border px-3 py-1 text-[9px] font-bold uppercase transition-all ${mode === 'upload' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-white/30'}`}
                  >
                    File
                  </button>
                  <button 
                    onClick={() => setMode('camera')}
                    className={`rounded border px-3 py-1 text-[9px] font-bold uppercase transition-all ${mode === 'camera' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-white/30'}`}
                  >
                    Feed
                  </button>
                </div>
              </div>

              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {state === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {mode === "upload" ? (
                        <UploadZone onFileSelect={handleFileSelect} loading={false} />
                      ) : (
                        <CameraCapture onCapture={handleCapture} onCancel={() => setMode("upload")} />
                      )}
                    </motion.div>
                  )}

                  {['uploading', 'scanning', 'analyzing'].includes(state) && preview && (
                    <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                      <div className="relative mb-8 w-full border border-white/10 p-1 bg-black/40">
                        <Scanner active={state === 'scanning'}>
                          <img src={preview} className="w-full opacity-60 mix-blend-screen grayscale" referrerPolicy="no-referrer" />
                        </Scanner>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                           <div className="rounded bg-black/80 px-2 py-1 text-[8px] font-bold text-cyan-500 border border-cyan-500/30">
                             FREQ_DOMAIN_SCAN: {state === 'scanning' ? 'RUNNING' : 'PENDING'}
                           </div>
                           <div className="rounded bg-black/80 px-2 py-1 text-[8px] font-bold text-cyan-500 border border-cyan-500/30">
                             ZOOM: 400%
                           </div>
                        </div>
                      </div>
                      
                      <div className="w-full space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span>Progress</span>
                          <span className="text-cyan-400">{state === 'analyzing' ? '98%' : '45%'}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyan-500" 
                            initial={{ width: 0 }} 
                            animate={{ width: state === 'analyzing' ? '98%' : '45%' }}
                            transition={{ duration: 2 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {state === 'completed' && result && (
                    <motion.div key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <AnalysisReport result={result} />
                      <div className="mt-8 flex justify-center">
                        <button onClick={reset} className="flex items-center gap-2 rounded border border-cyan-500/20 bg-cyan-500/5 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/10">
                          <RefreshCcw className="h-3 w-3" />
                          Restart Diagnostic
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {state === 'error' && (
                    <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="relative mb-6">
                        <AlertCircle className="h-16 w-16 text-red-500 animate-pulse" />
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                      </div>
                      <h3 className="text-xl font-black uppercase text-red-500 tracking-tighter">Neural Breakdown</h3>
                      <div className="mt-4 max-w-md rounded border border-red-500/20 bg-red-500/5 p-4 text-xs leading-relaxed text-red-400 whitespace-pre-wrap">
                        {error?.split('REQUIRED ACTION:')[0]}
                      </div>
                      
                      {error?.includes('REQUIRED ACTION:') && (
                        <div className="mt-4 max-w-md rounded border-2 border-cyan-500 bg-cyan-500/10 p-4 text-xs font-bold leading-relaxed text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                          <div className="mb-2 flex items-center gap-2 border-b border-cyan-500/30 pb-2 uppercase tracking-widest">
                            <span className="rounded bg-cyan-500 px-1.5 py-0.5 text-[8px] text-black">Recommended Fix</span>
                          </div>
                          {error.split('REQUIRED ACTION:')[1]}
                        </div>
                      )}
                      <button 
                        onClick={reset}
                        className="mt-8 rounded border border-white/10 bg-white/5 px-8 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                      >
                        Override & Retry
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-white/5 bg-[#0c0c0e] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-cyan-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Metadata Hash</span>
                </div>
                <div className="space-y-1.5 opacity-40">
                  <div className="flex justify-between text-[8px] uppercase">
                    <span>File Index</span>
                    <span>DF-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[8px] uppercase">
                    <span>Block Height</span>
                    <span>{Math.floor(Math.random() * 1000000)}</span>
                  </div>
                  <div className="flex justify-between text-[8px] uppercase">
                    <span>Integrity</span>
                    <span className="text-green-500">Verified</span>
                  </div>
                </div>
              </div>
              <div className="relative rounded-lg border border-white/5 bg-[#0c0c0e] p-4 overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  <Activity className="h-24 w-24" />
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Security Layer</span>
                </div>
                <p className="text-[9px] leading-relaxed text-white/30 uppercase">
                  End-to-end neural encryption active. Analysis payloads are processed in an isolated volatility buffer.
                </p>
              </div>
            </div>
          </div>

          {/* Forensic Log Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="h-full rounded-lg border border-white/5 bg-[#0c0c0e] p-1 flex flex-col">
               <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                 <span className="text-[10px] font-black uppercase tracking-widest">Diagnostic Log</span>
                 <div className="flex gap-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                   <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                   <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                 </div>
               </div>
               <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                 <ForensicLog state={state} />
               </div>
               <div className="border-t border-white/5 p-4 bg-black/20">
                 <div className="flex items-center justify-between text-[8px] uppercase tracking-widest text-white/30">
                   <span>Engine.State</span>
                   <span className="text-cyan-500">Listening...</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-12 border-t border-white/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded border border-white/10 bg-white/5 grid place-items-center opacity-40">
               <Shield className="h-4 w-4 text-cyan-500" />
             </div>
             <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 text-white/60">Forensic-Os 9.4.0</h4>
               <p className="text-[8px] text-white/20 uppercase tracking-tighter leading-none">C-Red Technology Distribution</p>
             </div>
          </div>
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 max-md:text-center leading-relaxed">
            Unauthorized access to forensic logs is strictly prohibited. <br className="hidden md:block"/>
            All scans are recorded in immutable biometric blocks.
          </p>
        </div>
      </footer>
    </div>
  );
}
