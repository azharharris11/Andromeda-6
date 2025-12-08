
import { Type } from "@google/genai";
import { ProjectContext, NodeData, PredictionMetrics, GenResult, AdCopy, LanguageRegister } from "../../types";
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

export const analyzeLandingPageContext = async (markdown: string): Promise<ProjectContext> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `You are a Data Analyst for a Direct Response Agency. 
    Analyze the following raw data (Landing Page Content) to extract the foundational truths.
    Also extract 2-3 examples of existing copy/headlines found on the page to serve as "Tone Calibration" data.
    
    RAW DATA:
    ${markdown.substring(0, 30000)}

    IMPORTANT: Analyze the language register/tone.
    - If they use "Anda" or formal language (or it's B2B/Medical), set languageRegister to 'Formal/Professional (Anda/Saya) - B2B/Luxury/Medical'.
    - If they use "Aku/Kamu" or "Mom", set to 'Casual/Polite (Aku/Kamu) - General Wellness/Mom'.
    - If they use "Gue/Lo" or strictly Gen-Z slang, set to 'Street/Slang (Gue/Lo) - Gen Z/Lifestyle'.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING, description: "A punchy, benefit-driven 1-sentence value prop." },
          targetAudience: { type: Type.STRING, description: "Specific demographics and psychographics." },
          targetCountry: { type: Type.STRING },
          brandVoice: { type: Type.STRING },
          brandVoiceOptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 distinct brand voice options based on the content tone." },
          offer: { type: Type.STRING, description: "The primary hook or deal found on the page." },
          offerOptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 potential offer angles or deal structures inferred." },
          brandCopyExamples: { type: Type.STRING, description: "2-3 raw sentences/headlines found on the page that represent the brand voice best." },
          languageRegister: { type: Type.STRING, enum: [
             'Street/Slang (Gue/Lo) - Gen Z/Lifestyle', 
             'Casual/Polite (Aku/Kamu) - General Wellness/Mom', 
             'Formal/Professional (Anda/Saya) - B2B/Luxury/Medical'
          ]}
        },
        required: ["productName", "productDescription", "targetAudience"]
      }
    }
  });

  const data = extractJSON<Partial<ProjectContext>>(response.text || "{}");
  
  return {
    productName: data.productName || "Unknown Product",
    productDescription: data.productDescription || "",
    targetAudience: data.targetAudience || "General Audience",
    targetCountry: data.targetCountry || "USA",
    brandVoice: data.brandVoice || "Professional",
    brandVoiceOptions: data.brandVoiceOptions || [],
    offer: data.offer || "Shop Now",
    offerOptions: data.offerOptions || [],
    brandCopyExamples: data.brandCopyExamples || "",
    landingPageUrl: "",
    languageRegister: data.languageRegister as LanguageRegister || LanguageRegister.CASUAL
  } as ProjectContext;
};

export const analyzeImageContext = async (base64Image: string): Promise<ProjectContext> => {
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Data } },
        { text: "Analyze this product image. Extract Product Name, Description, Target Audience. Infer Brand Voice, Offers, and Language Register (Is it Gen Z Slang, Mom Casual, or Professional B2B?)." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          targetCountry: { type: Type.STRING },
          brandVoice: { type: Type.STRING },
          brandVoiceOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          offer: { type: Type.STRING },
          offerOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          brandCopyExamples: { type: Type.STRING, description: "2-3 example copy lines matching this visual vibe." },
          languageRegister: { type: Type.STRING, enum: [
             'Street/Slang (Gue/Lo) - Gen Z/Lifestyle', 
             'Casual/Polite (Aku/Kamu) - General Wellness/Mom', 
             'Formal/Professional (Anda/Saya) - B2B/Luxury/Medical'
          ]}
        },
        required: ["productName", "productDescription"]
      }
    }
  });

  const data = extractJSON<Partial<ProjectContext>>(response.text || "{}");

  return {
    productName: data.productName || "Analyzed Product",
    productDescription: data.productDescription || "A revolutionary product.",
    targetAudience: data.targetAudience || "General Audience",
    targetCountry: data.targetCountry || "USA", 
    brandVoice: data.brandVoice || "Visual & Aesthetic",
    brandVoiceOptions: data.brandVoiceOptions || [],
    offer: data.offer || "Check it out",
    offerOptions: data.offerOptions || [],
    brandCopyExamples: data.brandCopyExamples || "",
    languageRegister: data.languageRegister as LanguageRegister || LanguageRegister.CASUAL
  } as ProjectContext;
};
