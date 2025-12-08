
import { Type } from "@google/genai";
import { ProjectContext, NodeData, PredictionMetrics, GenResult, AdCopy } from "../../types";
import { ai, extractJSON } from "./client";

export const checkAdCompliance = async (adCopy: AdCopy): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Facebook/TikTok Ad Policy Expert.
    
    TASK: Review the following ad copy for policy violations.
    
    HEADLINE: ${adCopy.headline}
    PRIMARY TEXT: ${adCopy.primaryText}
    
    CHECKLIST:
    1. Personal Attributes (Directly asserting user has a disability, medical condition, or financial status).
    2. Before/After claims (Unrealistic results).
    3. Misleading/False Claims.
    4. Profanity/Glitch text.
    
    OUTPUT:
    Return "Compliant" if it passes.
    If it fails, return a short warning explaining WHY (max 1 sentence).
  `;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return response.text?.trim() || "Compliance Check Failed";
  } catch (e) {
      console.error("Compliance Check Error", e);
      return "Error checking compliance.";
  }
};

export const predictCreativePerformance = async (
    project: ProjectContext, 
    node: NodeData
): Promise<GenResult<PredictionMetrics>> => {
    const model = "gemini-2.5-flash";

    const prompt = `
      ROLE: Senior Media Buyer & Creative Strategist (Direct Response Audit).
      
      TASK: Audit this creative asset and predict its potential performance on Meta/TikTok.
      Do NOT be nice. Be critical.
      
      CONTEXT:
      Product: ${project.productName}
      Target Audience: ${project.targetAudience}
      Country: ${project.targetCountry}
      
      CREATIVE ASSET TO AUDIT:
      Format: ${node.format}
      Headline: "${node.adCopy?.headline || node.title}"
      Primary Text: "${node.adCopy?.primaryText || ''}"
      Visual Description: "${node.description || 'See image'}"
      Insight/Angle: "${node.meta?.angle || ''}"
      
      SCORING CRITERIA:
      1. Hook Strength: Does it stop the scroll in 0.5s? (Pattern Interrupt)
      2. Clarity: Is the offer/benefit immediately understood?
      3. Emotional Resonance: Does it hit a nerve or just state facts?
      
      OUTPUT JSON:
      - score: Number 0-100 (Winning ads are usually 85+).
      - hookStrength: Enum (Weak, Moderate, Strong, Viral).
      - clarity: Enum (Confusing, Clear, Crystal Clear).
      - emotionalResonance: Enum (Flat, Engaging, Visceral).
      - reasoning: Max 2 sentences. Brutally honest feedback on WHY it got this score.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        hookStrength: { type: Type.STRING, enum: ["Weak", "Moderate", "Strong", "Viral"] },
                        clarity: { type: Type.STRING, enum: ["Confusing", "Clear", "Crystal Clear"] },
                        emotionalResonance: { type: Type.STRING, enum: ["Flat", "Engaging", "Visceral"] },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["score", "hookStrength", "reasoning"]
                }
            }
        });

        const data = extractJSON<PredictionMetrics>(response.text || "{}");
        
        return {
            data: data,
            inputTokens: response.usageMetadata?.promptTokenCount || 0,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 0
        };

    } catch (e) {
        console.error("Prediction Error", e);
        return { 
            data: { score: 0, hookStrength: 'Weak', clarity: 'Confusing', emotionalResonance: 'Flat', reasoning: "Analysis failed." }, 
            inputTokens: 0, 
            outputTokens: 0 
        };
    }
};
