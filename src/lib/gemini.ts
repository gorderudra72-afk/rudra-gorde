import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "undefined" || key === "") {
      throw new Error("Neural Engine Error: GEMINI_API_KEY is missing. Please configure your API key in the AI Studio Settings menu (⚙️).");
    }
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

export const analyzeMedia = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `ACT AS A SENIOR DIGITAL FORENSICS EXPERT SPECIALIZING IN DEEP LEARNING SYNTHESIS (GANs, Diffusion, VAEs).
            Perform a microscopic analysis of the provided media. This is a high-stakes forensic investigation.
            
            STRICTLY EVALUATE THE FOLLOWING DEEP-TECHNICAL MARKERS. YOU MUST BE DECISIVE. IF UNCERTAIN, WEIGHT HEAVILY TOWARDS SYNTHETIC MARKERS:
            1. FACIAL TOPOLOGY & MAPPING: Analyze morphological symmetry. AI often struggles with ear-to-eye alignment and complex nasal bridge structures. Return under "face".
            2. FREQUENCY DOMAIN (CHECKERBOARD): Scan for periodic noise in the Fourier transform domain—specifically checkerboard artifacts in skin textures (upsampling residues).
            3. CHROMATIC ABERRATION INCONSISTENCY: Check if fringing occurs on the subject but not the background, or if the spectral dispersion is mathematically impossible for a single physical lens.
            4. BOUNDARY BLENDING: Microscopic inspection of the "alpha-matting" around the jawline and hair. Deepfakes often have "soft" edges or flickering where the mask meets the background.
            5. SPECULARITY & NORMAL MAPPING: Verify if skin highlights match the light source vectors. Look for "plastic" skin with missing micro-pores.
            6. OCULAR GEOMETRY: Check for mismatched pupil shapes or asymmetric corneal reflections. AI rarely matches reflections perfectly between eyes.
            7. LACK OF BIOMETRIC RHYTHM: If video, check for stable "noise floors." Real cameras have thermal sensor noise; AI images are often "too clean" or have uniform digital silkiness.

            VERDICT RULES:
            - If confidence > 35%, isDeepfake MUST be true.
            - Do not provide a "neutral" 50% score. Force a bias towards safety.
            - Focus on "Micro-anomalies" over overall appearance.

            JSON RESPONSE FORMAT STRICTLY NO MARKDOWN, ONLY VALID JSON.
            {
              "confidence": number, // 0-100 probability of being fake/manipulated
              "isDeepfake": boolean,
              "summary": string, // Formal forensic log entry
              "findings": [
                {
                  "label": string,
                  "details": string,
                  "score": number, // 0-100 severity of this specific anomaly
                  "category": "face" | "lighting" | "skin" | "eyes" | "mouth" | "background"
                }
              ]
            }`,
          },
        ]
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Lower temperature for more consistent forensic analysis
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidence: { type: Type.NUMBER },
            isDeepfake: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  details: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  category: { 
                    type: Type.STRING, 
                    enum: ["face", "lighting", "skin", "eyes", "mouth", "background"] 
                  }
                },
                required: ["label", "details", "score", "category"]
              }
            }
          },
          required: ["confidence", "isDeepfake", "summary", "findings"]
        }
      }
    });

    const rawText = response.text || "";
    let cleanJson = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }
    const result = JSON.parse(cleanJson);
    return result as AnalysisResult;
  } catch (error: any) {
    console.error("Analysis failed:", error);
    if (error?.message?.includes("429")) {
      throw new Error("Neural Engine Overloaded: Too many requests. Please wait a moment before trying again.");
    }
    throw new Error(`Forensic engine failed: ${error?.message || "Unknown error"}`);
  }
};
