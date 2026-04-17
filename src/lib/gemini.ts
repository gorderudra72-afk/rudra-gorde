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
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        {
          text: `ACT AS A SENIOR DIGITAL FORENSICS EXPERT SPECIALIZING IN DEEP LEARNING SYNTHESIS (GANs, Diffusion, VAEs).
          Perform a microscopic, frame-by-frame analysis of the provided media. This is a high-stakes forensic investigation.
          
          STRICTLY EVALUATE THE FOLLOWING DEEP-TECHNICAL MARKERS:
          1. FREQUENCY ANALYSIS: Look for "checkerboard" artifacts or unnatural high-frequency patterns typical of neural upsampling (ConvTranspose2d).
          2. CHROMATIC ABERRATION: In real photography, lenses produce specific spectral fringing. Check if the "deepfake" face has inconsistent aberration compared to the rest of the image.
          3. COMPRESSION ARTIFACTS: Real images have uniform JPEG block boundaries. Look for "block-edge" inconsistencies where a face has been pasted.
          4. ILLUMINATION & SPECULARITY: Analyze the 3D surface normals vs the environmental map. Check for "floating" shadows or missing ambient occlusion.
          5. OCULAR CORNEAL REFLECTIONS: Mismatched eye highlights or "asymmetric specularities" are key deepfake markers.
          6. TEMPORAL JITTER (if video): Check for semantic persistence—do features like hair or earrings morph across frames?

          JSON RESPONSE FORMAT:
          - confidence: Integer (0-100) probability of MANIPULATION.
          - isDeepfake: Boolean.
          - summary: Technical forensic summary (min 3 sentences).
          - findings: List of anomalies with professional descriptions.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidence: { type: Type.NUMBER, description: "Deepfake confidence percentage (0-100)" },
            isDeepfake: { type: Type.BOOLEAN, description: "Whether the media is likely a deepfake" },
            summary: { type: Type.STRING, description: "A forensic summary of the findings" },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  details: { type: Type.STRING },
                  score: { type: Type.NUMBER, description: "Anomaly score for this specific category (0-100)" },
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

    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Forensic analysis engine failed to process the media.");
  }
};
