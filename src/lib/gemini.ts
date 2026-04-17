import { AnalysisResult } from "../types";

export const analyzeMedia = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let msg = errorData.error || `Server responded with ${response.status}`;
      if (errorData.details) {
        msg += `\n\n${errorData.details}`;
      }
      if (errorData.action) {
        msg += `\n\nREQUIRED ACTION: ${errorData.action}`;
      }
      throw new Error(msg);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Analysis failed:", error);
    throw new Error(error?.message || "Communication with forensic engine failed.");
  }
};
