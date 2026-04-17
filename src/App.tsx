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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,#00f2ff20_0%,transparent_50%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-cyan-500" />
          <span className="mono text-xl font-black uppercase tracking-tighter">DeepSight</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#" className="mono text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Algorithm</a>
          <a href="#" className="mono text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Forensics</a>
          <a href="#" className="mono text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Enterprise</a>
        </div>
        <button className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
          Sign In
        </button>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400"
          >
            <Activity className="h-3 w-3" />
            V3.1 Neural Network Active
          </motion.div>
          <h1 className="mt-8 text-6xl font-black uppercase tracking-tight md:text-8xl lg:text-9xl">
            <span className="block italic opacity-40">Unmask the</span>
            <span className="glitch-text -mt-4 block">Synthetic.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-white/50 leading-relaxed md:text-lg">
            A state-of-the-art forensic analysis suite for digital media verification. 
            Detect AI-generated faces, deepfakes, and manipulated video artifacts.
          </p>
        </section>

        {/* Console Interface */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-1 shadow-2xl">
          <div className="flex items-center justify-between rounded-t-xl bg-white/5 px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
            </div>
            <div className="mono text-[10px] font-bold uppercase tracking-widest text-white/20">
              Session-ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setMode("upload")}
                      className={`mono flex items-center gap-2 border-b-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        mode === "upload" ? "border-cyan-500 text-cyan-500" : "border-transparent text-white/30 hover:text-white/60"
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      onClick={() => setMode("camera")}
                      className={`mono flex items-center gap-2 border-b-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        mode === "camera" ? "border-cyan-500 text-cyan-500" : "border-transparent text-white/30 hover:text-white/60"
                      }`}
                    >
                      Instant Capture
                    </button>
                  </div>

                  {mode === "upload" ? (
                    <UploadZone onFileSelect={handleFileSelect} loading={false} />
                  ) : (
                    <CameraCapture onCapture={handleCapture} onCancel={() => setMode("upload")} />
                  )}
                </motion.div>
              )}

              {['uploading', 'scanning', 'analyzing'].includes(state) && preview && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-8 w-full max-w-xl">
                    <Scanner active={state === 'scanning'}>
                      {file?.type.startsWith('video/') ? (
                        <video 
                          src={preview} 
                          className="w-full grayscale opacity-50" 
                          autoPlay 
                          loop 
                          muted 
                        />
                      ) : (
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="w-full grayscale opacity-50" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </Scanner>
                  </div>
                  
                  <div className="text-center">
                    <div className="mono mb-2 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-cyan-400">
                      <RefreshCcw className="h-4 w-4 animate-spin-slow" />
                      {state === 'uploading' && "PREPARING FORENSIC BUFFER..."}
                      {state === 'scanning' && "SCANNING BIOMETRIC MARKERS..."}
                      {state === 'analyzing' && "RUNNING NEURAL ANALYSIS..."}
                    </div>
                    <p className="text-xs text-white/30 uppercase tracking-widest">
                      Processing frame-by-frame for GAN artifacts...
                    </p>
                  </div>

                  <div className="w-full max-w-xl">
                    <ForensicLog state={state} />
                  </div>
                </motion.div>
              )}

              {state === 'completed' && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight">Analysis Complete</h2>
                      <p className="mono text-[10px] uppercase tracking-widest text-white/40">Reference: FORENSIC-OS-092-ALPHA</p>
                    </div>
                    <button 
                      onClick={reset}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-white/10"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      New Analysis
                    </button>
                  </div>
                  
                  <AnalysisReport result={result} />
                </motion.div>
              )}

              {state === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
                  <h3 className="text-2xl font-black uppercase text-red-500">System Error</h3>
                  <p className="mt-2 text-white/50">{error}</p>
                  <button 
                    onClick={reset}
                    className="mt-6 rounded-lg bg-white/10 px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/20"
                  >
                    Retry Initialization
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Technical Specs Footer */}
        <section className="mt-24 grid grid-cols-1 gap-12 border-t border-white/5 pt-12 md:grid-cols-3">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <Fingerprint className="h-5 w-5 text-cyan-500" />
            </div>
            <h4 className="mono mb-2 text-sm font-bold uppercase tracking-widest">Pattern Recognition</h4>
            <p className="text-sm text-white/40 leading-relaxed">
              Detects microscopic GAN artifacts and spatial correlation inconsistencies typical in synthetic media.
            </p>
          </div>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <Activity className="h-5 w-5 text-cyan-500" />
            </div>
            <h4 className="mono mb-2 text-sm font-bold uppercase tracking-widest">Biometric Drift</h4>
            <p className="text-sm text-white/40 leading-relaxed">
               Analyzes non-voluntary physiological signals like eye blinking rhythms and involuntary micro-movements.
            </p>
          </div>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <Github className="h-5 w-5 text-cyan-500" />
            </div>
            <h4 className="mono mb-2 text-sm font-bold uppercase tracking-widest">Neural Forensic API</h4>
            <p className="text-sm text-white/40 leading-relaxed">
              Open-source verification engine compatible with major deep learning detection frameworks.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 py-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
        &copy; 2026 DeepSight Systems &bull; SECURED BY END-TO-END NEURAL VERIFICATION
      </footer>
    </div>
  );
}
