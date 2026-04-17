import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for images/videos
app.use(express.json({ limit: '50mb' }));

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    
    if (!key || key === "undefined" || key === "") {
      throw new Error("Neural Engine Error: GEMINI_API_KEY is missing. Please configuration your key in Settings (⚙️).");
    }

    // Heuristic check: Standard Gemini keys start with 'AIza'
    // This helps identify common copy-paste errors or incorrect tokens
    if (!key.startsWith('AIza')) {
      throw new Error("Neural Engine Error: API Key format is invalid. Standard Gemini keys start with 'AIza'. Note: The key you provided earlier 'AQ.Ab8...' is not a valid Gemini key.");
    }

    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

// API Endpoint for forensic analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing media data or mimeType" });
    }

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
        temperature: 0.1,
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
    res.json(result);

  } catch (error: any) {
    console.error("Forensic analysis failed:", error);
    
    const errorStr = JSON.stringify(error).toLowerCase();
    
    if (errorStr.includes("401") || errorStr.includes("unauthorized") || errorStr.includes("invalid api key")) {
      return res.status(401).json({ error: "Neural Engine Error: Invalid or unauthorized API Key." });
    }

    if (errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("resource_exhausted")) {
      return res.status(429).json({ error: "System Overloaded (Quota Exceeded). Please wait a moment." });
    }
    
    res.status(500).json({ error: error?.message || "Internal Neural Error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DeepSight Forensic Server running on http://localhost:${PORT}`);
  });
}

startServer();
