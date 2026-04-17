import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Neural Engine Error: GEMINI_API_KEY is missing. Forensic system cannot initialize.");
    }
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

export const analyzeMedia = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
            
            STRICTLY EVALUATE THE FOLLOWING DEEP-TECHNICAL MARKERS:
            1. FREQUENCY ANALYSIS: Look for "checkerboard" artifacts or unnatural high-frequency patterns typical of neural upsampling (ConvTranspose2d).
            2. CHROMATIC ABERRATION: In real photography, lenses produce specific spectral fringing. Check if the "deepfake" face has inconsistent aberration compared to the rest of the image.
            3. COMPRESSION ARTIFACTS: Real images have uniform JPEG block boundaries. Look for "block-edge" inconsistencies where a face has been pasted.
            4. ILLUMINATION & SPECULARITY: Analyze the 3D surface normals vs the environmental map. Check for "floating" shadows or missing ambient occlusion.
            5. OCULAR CORNEAL REFLECTIONS: Mismatched eye highlights or "asymmetric specularities" are key deepfake markers.
            6. BIOMETRIC SIGNALS: If eyes or mouth are visible, look for unnatural rigidity or lack of rhythmic micro-movements.

            JSON RESPONSE FORMAT:
            - confidence: Integer (0-100) probability of MANIPULATION.
            - isDeepfake: Boolean.
            - summary: Technical forensic summary (min 3 sentences).
            - findings: List of anomalies with professional descriptions.`,
          },
        ]
      },
      config: {
        responseMimeType: "application/json",
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
                    enum: ["lighting", "skin", "eyes", "mouth", "background"] 
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
    // Clean potential markdown prefix/suffix
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJson);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    if (error instanceof Error && error.message.includes("429")) {
      throw new Error("Neural Engine Overloaded: Too many requests. Please wait a moment before trying again.");
    }
    throw new Error("Forensic analysis engine failed to process the media. Ensure your API key is correctly configured and the media format is valid.");
  }
};
