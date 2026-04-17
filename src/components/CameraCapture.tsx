import { Camera, X, Check, RefreshCw } from "lucide-react";
import React, { useRef, useState, useCallback } from "react";
import { Scanner } from "./Scanner";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            setCapturedBlob(blob);
            setCapturedImage(URL.createObjectURL(blob));
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      <div className="mb-6 w-full max-w-xl">
        <Scanner active={!capturedImage && !!stream}>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover grayscale brightness-75"
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="h-full w-full object-cover grayscale brightness-75"
              />
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
                <p className="text-sm font-bold text-red-500">{error}</p>
              </div>
            )}
            
            {/* Viewfinder Overlay */}
            {!capturedImage && !error && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full border border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_50px_rgba(6,182,212,0.1)]" />
              </div>
            )}
          </div>
        </Scanner>
      </div>

      <div className="flex gap-4">
        {!capturedImage ? (
          <>
            <button
              onClick={onCancel}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5 text-white/60" />
            </button>
            <button
              onClick={capture}
              disabled={!stream}
              className="group flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Camera className="h-5 w-5 text-black" />
              <div className="absolute -inset-1 animate-pulse rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/40" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleRetake}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <RefreshCw className="h-5 w-5 text-white/60" />
            </button>
            <button
              onClick={handleConfirm}
              className="group flex h-12 w-12 items-center justify-center rounded-full bg-green-500 transition-transform active:scale-95"
            >
              <Check className="h-6 w-6 text-black" />
              <div className="absolute -inset-1 animate-pulse rounded-full bg-green-500/20 group-hover:bg-green-500/40" />
            </button>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <p className="mt-6 mono text-[10px] uppercase tracking-[0.2em] text-white/20">
        {!capturedImage ? "Awaiting facial alignment..." : "Image captured. Proceed to neural analysis?"}
      </p>
    </div>
  );
};
