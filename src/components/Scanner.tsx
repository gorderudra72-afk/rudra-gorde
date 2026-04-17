import { motion } from "motion/react";
import React from "react";

interface ScannerProps {
  active: boolean;
  children: React.ReactNode;
}

export const Scanner: React.FC<ScannerProps> = ({ active, children }) => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/50">
      {children}
      
      {active && (
        <motion.div
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className="scanner-gradient absolute left-0 z-10 h-20 w-full"
        />
      )}

      {/* Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]" />
      
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-cyan-500/50" />
      <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-cyan-500/50" />
      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-cyan-500/50" />
      <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan-500/50" />
    </div>
  );
};
