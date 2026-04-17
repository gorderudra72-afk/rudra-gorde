import { CheckCircle, AlertTriangle, Info, Gauge } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import { AnalysisResult } from "../types";

interface ReportProps {
  result: AnalysisResult;
}

export const AnalysisReport: React.FC<ReportProps> = ({ result }) => {
  const isSafe = result.confidence < 30 && !result.isDeepfake;
  const isDanger = result.confidence > 70 || result.isDeepfake;

  return (
    <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Risk Gauge */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="mono text-sm font-bold uppercase tracking-widest text-white/60">Risk Assessment</h4>
            <Gauge className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <div className={`text-6xl font-black italic tracking-tighter ${isDanger ? 'text-red-500' : isSafe ? 'text-green-500' : 'text-yellow-500'}`}>
              {result.confidence}%
            </div>
            <div className="mt-2 mono text-xs uppercase tracking-widest opacity-60">Deepfake probability</div>
          </div>
          
          <div className="mt-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                className={`h-full ${isDanger ? 'bg-red-500' : isSafe ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
            </div>
          </div>
        </div>

        <div className="col-span-1 flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            {isDanger ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">Manipulated</span>
              </div>
            ) : isSafe ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest">Authentic</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Info className="h-8 w-8 text-yellow-500" />
                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/20 uppercase tracking-widest">Inconclusive</span>
              </div>
            )}
            <h3 className="text-2xl font-black uppercase tracking-tight">
              {isDanger ? "High Risk Detected" : isSafe ? "Verified Real" : "Artifacts Found"}
            </h3>
          </div>
          <p className="text-white/70 leading-relaxed italic">
            "{result.summary}"
          </p>
        </div>
      </div>

      {/* Feature Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {result.findings.map((finding, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="mono text-[10px] font-bold uppercase tracking-tighter text-cyan-500/80">
                {finding.category}
              </span>
              <span className={`mono text-xs font-bold ${finding.score > 60 ? 'text-red-400' : 'text-white/40'}`}>
                {finding.score}/100
              </span>
            </div>
            <h5 className="mb-2 font-bold text-white/90">{finding.label}</h5>
            <p className="text-sm leading-relaxed text-white/50">{finding.details}</p>
            
            <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
              <div 
                className={`h-full transition-all duration-1000 ${finding.score > 60 ? 'bg-red-500/50' : 'bg-white/20'}`}
                style={{ width: `${finding.score}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
