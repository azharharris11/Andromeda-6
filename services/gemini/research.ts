
import { Type } from "@google/genai";
import { ProjectContext, GenResult, StoryOption, LanguageRegister } from "../../types";
import { ai, extractJSON } from "./client";

// Helper for consistent language instruction
const getLanguageInstruction = (country: string, register: LanguageRegister): string => {
    const isIndo = country?.toLowerCase().includes("indonesia");
    
    if (!isIndo) return `LANGUAGE: Native language of ${country} (e.g., English for USA).`;

    if (register === LanguageRegister.SLANG) {
        return `
        LANGUAGE: Bahasa Indonesia (Gaul / Anak Jaksel / Twitter Speak).
        - STYLE: Informal, raw, emotional.
        - KEYWORDS: Gue/Lo, Banget, Sumpah, Jujurly, Valid.
        - TONE: Like a viral thread on Twitter or a Curhat session.
        `;
    } else if (register === LanguageRegister.PROFESSIONAL) {
        return `
        LANGUAGE: Bahasa Indonesia (Formal / Professional).
        - STYLE: Baku, structured, respectful.
        - KEYWORDS: Anda, Saya, Mengalami, Solusi.
        - TONE: Like a medical report or business consultation.
        `;
    } else {
        // Casual (Default)
        return `
        LANGUAGE: Bahasa Indonesia (Casual / Conversational).
        - STYLE: Friendly, warm, easy to read.
        - KEYWORDS: Aku/Kamu, Ternyata, Masalahnya.
        - TONE: Like a blog post or magazine article.
        `;
    }
};

export const generateStoryResearch = async (project: ProjectContext): Promise<GenResult<StoryOption[]>> => {
  const model = "gemini-2.5-flash";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  const langInstruction = getLanguageInstruction(project.targetCountry || "USA", register);

  const prompt = `
    ROLE: Data Miner / Reddit Researcher
    
    TASK: Find/Generate 3 distinct "Unaware" Stories related to: ${project.productName}.
    These stories should sound like highly emotional, raw Reddit threads or Forum posts (e.g., r/TrueOffMyChest, r/Relationships).
    
    CRITICAL RULE:
    - The stories must be about the PROBLEM/SYMPTOM. 
    - Do NOT mention the product or solution yet. 
    - Focus on the "Bleeding Neck" pain.
    - Context: ${project.targetCountry || "General"}.
    
    ${langInstruction}
    **IMPORTANT: The 'title' and 'narrative' MUST be written in the Target Language defined above.**
    
    INPUT DATA:
    Target Audience: ${project.targetAudience}
    Deep Pain: ${project.productDescription}

    OUTPUT JSON:
    Return 3 stories.
    - title: Catchy Reddit-style title.
    - narrative: A 2-3 sentence summary of the story/struggle.
    - emotionalTheme: The core emotion (e.g., "Shame", "Anger", "Exhaustion").
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            narrative: { type: Type.STRING },
            emotionalTheme: { type: Type.STRING }
          },
          required: ["title", "narrative", "emotionalTheme"]
        }
      }
    }
  });

  const stories = extractJSON<any[]>(response.text || "[]");
  return {
    data: stories.map((s, i) => ({ ...s, id: `story-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const analyzeVoiceOfCustomer = async (rawText: string, project: ProjectContext): Promise<GenResult<any>> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    ROLE: Direct Response Researcher (Sabri Suby Style).
    
    CONTEXT:
    We are analyzing raw market feedback for: ${project.productName}.
    
    RAW DATA:
    "${rawText.substring(0, 50000)}" 
    
    TASK:
    Extract the "Bleeding Neck" pain points VERBATIM (Word-for-Word).
    Sabri Suby Rule: "Do not change the way the market speaks. Use their exact vocabulary."
    
    OUTPUT JSON:
    1. verbatimHooks: 5 raw, emotional quotes from the text that would stop a scroll.
    2. coliseumKeywords: The top 3-5 specific keywords/slang used by this tribe.
    3. recurringComplaints: Patterns of pain found in the text.
    4. dreamState: Exact phrases describing what they wish they had.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verbatimHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
          coliseumKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          recurringComplaints: { type: Type.ARRAY, items: { type: Type.STRING } },
          dreamState: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return {
    data: extractJSON(response.text || "{}"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generatePersonas = async (project: ProjectContext): Promise<GenResult<any[]>> => {
  const model = "gemini-2.5-flash";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  const langInstruction = getLanguageInstruction(project.targetCountry || "USA", register);
  
  const prompt = `
    You are a Consumer Psychologist specializing in ${project.targetCountry || "the target market"}.
    
    PRODUCT CONTEXT:
    Product: ${project.productName}
    Details: ${project.productDescription}
    
    TASK:
    Define 3 distinct "Avatars" based on their IDENTITY and DEEP PSYCHOLOGICAL NEEDS.
    
    THE DIAGNOSIS PRINCIPLE:
    "If you can articulate someone's problem better than they can, they instinctively believe you can solve it."
    
    For each persona, DO NOT just list demographics. 
    You must generate "Visceral Symptoms" - these are specific micro-moments of pain.
    Bad: "Has back pain."
    Good: "The sharp electric jolt they feel in their lower lumbar when they try to put on socks in the morning."
    Bad: "Worried about money."
    Good: "Staring at the ceiling at 3:14 AM calculating how many months of rent they have left in savings."

    We are looking for:
    1. The Skeptic / Logic Buyer (Identity: "I am smart, I research, I don't get fooled.")
    2. The Status / Aspirer (Identity: "I want to be admired/successful/beautiful.")
    3. The Anxious / Urgent Solver (Identity: "I need safety/certainty/speed.")

    ${langInstruction}
    **CRITICAL: Write the Profile, Motivation, and Visceral Symptoms in the Target Language.**

    *Cultural nuance mandatory for ${project.targetCountry}.*
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            profile: { type: Type.STRING, description: "Demographics + Identity Statement" },
            motivation: { type: Type.STRING, description: "The 'Gap' between current self and desired self." },
            deepFear: { type: Type.STRING, description: "What are they afraid of losing?" },
            visceralSymptoms: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "3 specific, highly detailed micro-moments of pain or frustration that prove we know their life." 
            }
          },
          required: ["name", "profile", "motivation", "visceralSymptoms"]
        }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};
