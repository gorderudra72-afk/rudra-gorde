export interface AnalysisResult {
  confidence: number;
  isDeepfake: boolean;
  findings: {
    label: string;
    details: string;
    score: number;
    category: 'lighting' | 'skin' | 'eyes' | 'mouth' | 'background';
  }[];
  summary: string;
  metadata?: {
    resolution: string;
    format: string;
    fps?: number;
  };
}

export type MediaState = 'idle' | 'uploading' | 'scanning' | 'analyzing' | 'completed' | 'error';
