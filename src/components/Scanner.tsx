import { motion } from "motion/react";
import React from "react";

interface ScannerProps {
  active: boolean;
  children: React.ReactNode;
}

export const Scanner: React.FC<ScannerProps> = ({ active, children }) => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/50 flex items-center justify-center min-h-[200px]">
      {children}
      
      {active && (
        <>
          {/* Main vertical scanning bar */}
          <motion.div
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="scanner-gradient absolute left-0 z-20 h-20 w-full opacity-60"
          />

          {/* Facial targeting box overlay */}
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute z-10 w-48 h-64 border border-cyan-500/30 flex items-center justify-center"
          >
             <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
             <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
             
             {/* Crosshair */}
             <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
             <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>

             {/* Dynamic tracking effect */}
             <motion.div
                animate={{ 
                  width: ["100%", "95%", "100%", "105%", "100%"],
                  height: ["100%", "102%", "100%", "98%", "100%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-full h-full border border-cyan-500/10 rounded-[50%]"
             />

             <div className="absolute -top-6 bg-cyan-500/10 text-cyan-500 text-[8px] mono font-bold px-2 py-0.5 border border-cyan-500/20 rounded uppercase tracking-widest">
                FACIAL TOPOLOGY LOCK
             </div>
          </motion.div>
        </>
      )}

      {/* Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-white/20 z-0" />
      <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-white/20 z-0" />
      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-white/20 z-0" />
      <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-white/20 z-0" />
    </div>
  );
};
