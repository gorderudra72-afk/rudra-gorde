import { Upload, FileVideo, FileImage, ShieldAlert } from "lucide-react";
import React, { useCallback, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, loading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all ${
        isDragOver ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 hover:border-white/20"
      }`}
    >
      <input
        type="file"
        id="media-upload"
        className="hidden"
        accept="image/*,video/*"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        disabled={loading}
      />
      
      <label
        htmlFor="media-upload"
        className="flex cursor-pointer flex-col items-center text-center group"
      >
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-500/10 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <Upload className={`h-10 w-10 transition-colors ${loading ? "animate-pulse text-cyan-500" : "text-white/60 group-hover:text-cyan-400"}`} />
        </div>
        
        <h3 className="mb-2 text-2xl font-black italic tracking-tighter transition-colors group-hover:text-cyan-400">
          {loading ? "PROCESSING..." : "UPLOAD EVIDENCE"}
        </h3>
        <p className="max-w-xs text-sm text-white/40">
          Drop your image or video here, or click to browse. Supported: JPEG, PNG, MP4, WebM.
        </p>
      </label>

      <div className="mt-8 flex gap-6 grayscale opacity-40">
        <FileVideo className="h-6 w-6" />
        <FileImage className="h-6 w-6" />
        <ShieldAlert className="h-6 w-6" />
      </div>
    </div>
  );
};
