
import { Type } from "@google/genai";
import { ProjectContext, GenResult, StoryOption, BigIdeaOption, MechanismOption, HVCOOption, MafiaOffer } from "../../types";
import { ai, extractJSON } from "./client";

export const auditHeadlineSabri = async (headline: string, audience: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    Role: Sabri Suby (Ruthless Copy Editor).
    
    Task: Rate this headline based on the 4 U's:
    1. Urgent (Why now?)
    2. Unique (Have I heard this before?)
    3. Ultra-Specific (Does it use numbers/names?)
    4. Useful (What's in it for me?)
    
    Headline: "${headline}"
    Target Audience: ${audience}
    
    Output: A short, harsh critique (max 2 sentences) and a Score /10. 
    If score < 7, rewrite it to be better.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  
  return response.text || "Audit failed.";
};

export const generateMafiaOffer = async (project: ProjectContext): Promise<GenResult<MafiaOffer>> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    ROLE: Sabri Suby (Offer Architect).
    
    CONTEXT:
    Product: ${project.productName}
    Current Offer: ${project.offer}
    Target Audience: ${project.targetAudience}
    
    TASK:
    Transform the boring current offer into a "MAFIA OFFER" (An offer they can't refuse).
    
    FORMULA:
    1. BOLD PROMISE: Specific outcome with a timeline (Quantified End Result).
    2. VALUE STACK: Add bonuses that handle objections (e.g., "Free Meal Plan", "24/7 Support"). Assign a fake $$$ value to each.
    3. RISK REVERSAL: A crazy guarantee (e.g., "If you don't like it, I'll pay you $100").
    4. SCARCITY: A reason to act now.
    
    EXAMPLE:
    Boring: "Hire our agency."
    Mafia: "We will double your leads in 90 days or we work for FREE until we do. Plus, get our $2k Audit Script as a bonus."
    
    OUTPUT JSON:
    {
        "headline": "The 1-Sentence Mafia Hook",
        "valueStack": ["Bonus 1 ($Val)", "Bonus 2 ($Val)", "Bonus 3 ($Val)"],
        "riskReversal": "The 'Sleep Like A Baby' Guarantee",
        "scarcity": "Why it expires soon"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          valueStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskReversal: { type: Type.STRING },
          scarcity: { type: Type.STRING }
        },
        required: ["headline", "valueStack", "riskReversal"]
      }
    }
  });

  return {
      data: extractJSON<MafiaOffer>(response.text || "{}"),
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateBigIdeas = async (project: ProjectContext, story: StoryOption): Promise<GenResult<BigIdeaOption[]>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Direct Response Strategist (Big Idea Developer)
    
    CONTEXT:
    We are targeting a user who connects with this story: "${story.title}" (${story.narrative}).
    Product: ${project.productName}.
    
    TASK:
    Generate 3 "Big Ideas" (New Opportunities) that bridge this story to our solution.
    A Big Idea is NOT a benefit. It is a new way of looking at the problem.
    
    EXAMPLE:
    Story: "I diet but don't lose weight."
    Big Idea: "It's not your willpower, it's your gut biome diversity." (Shift blame -> New mechanism).
    
    OUTPUT JSON:
    - headline: The Big Idea Statement.
    - concept: Explanation of the shift.
    - targetBelief: What old belief are we destroying?
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
            headline: { type: Type.STRING },
            concept: { type: Type.STRING },
            targetBelief: { type: Type.STRING }
          },
          required: ["headline", "concept", "targetBelief"]
        }
      }
    }
  });

  const ideas = extractJSON<any[]>(response.text || "[]");
  return {
    data: ideas.map((s, i) => ({ ...s, id: `idea-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateMechanisms = async (project: ProjectContext, bigIdea: BigIdeaOption): Promise<GenResult<MechanismOption[]>> => {
  const model = "gemini-2.5-flash";
  const country = project.targetCountry || "USA";
  const isIndo = country.toLowerCase().includes("indonesia");

  let languageInstruction = "";
  if (isIndo) {
      languageInstruction = `
      LANGUAGE: Indonesian (Casual/Conversational). 
      - The 'scientificPseudo' can be in English if it sounds cooler/more authoritative (e.g. "Bio-Lock Technology").
      - BUT, the 'ump' and 'ums' explanations MUST be in Indonesian.
      - Use natural phrasing like "Masalahnya bukan di X, tapi di Y".
      `;
  } else {
      languageInstruction = `LANGUAGE: Native English (USA/UK).`;
  }

  const prompt = `
    ROLE: Product Engineer / Pseudo-Scientist
    
    CONTEXT:
    Big Idea: ${bigIdea.headline}
    Product: ${project.productName}
    Target Audience Location: ${country}
    ${languageInstruction}
    
    TASK:
    Define the UMP (Unique Mechanism of Problem) and UMS (Unique Mechanism of Solution).
    This gives the "Logic" to the "Magic".
    
    1. UMP: Why have other methods failed? (e.g., "Standard diets slow down your metabolic rate.")
    2. UMS: How does THIS product solve that specific UMP? (e.g., "We trigger thermogenesis without caffeine.")
    
    OUTPUT JSON (3 Variants):
    - ump: The Root Cause of failure.
    - ums: The New Solution mechanism.
    - scientificPseudo: A catchy name for the mechanism (e.g., "The Dual-Action Protocol").
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
            ump: { type: Type.STRING },
            ums: { type: Type.STRING },
            scientificPseudo: { type: Type.STRING }
          },
          required: ["ump", "ums", "scientificPseudo"]
        }
      }
    }
  });

  const mechs = extractJSON<any[]>(response.text || "[]");
  return {
    data: mechs.map((s, i) => ({ ...s, id: `mech-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateHooks = async (project: ProjectContext, bigIdea: BigIdeaOption, mechanism: MechanismOption): Promise<GenResult<string[]>> => {
  const model = "gemini-2.5-flash";
  const country = project.targetCountry || "USA";
  const isIndo = country.toLowerCase().includes("indonesia");

  let toneInstruction = "";
  let referenceMedia = "Cosmopolitan, National Enquirer";
  
  if (isIndo) {
      toneInstruction = `
      LANGUAGE: Bahasa Indonesia (Bahasa Gaul / Social Media Slang).
      - FORBIDDEN: "Anda", "Temukan", "Kami".
      - USE: "Gue/Lo" (if fits brand), "Sumpah", "Ternyata", "Ini dia".
      - STYLE: Clickbait titles like "Tribun News", "Detik", or viral TikTok captions.
      `;
      referenceMedia = "Lambe Turah, Tribun News Clickbait, Viral TikToks";
  } else {
      toneInstruction = `LANGUAGE: Native English (Casual, Punchy).`;
  }
  
  const prompt = `
    ROLE: Viral Social Media Editor / Direct Response Copywriter.
    
    TASK: Write 5 "Thumb-Stopping" Hooks based on:
    Big Idea: ${bigIdea.headline}
    Mechanism: ${mechanism.scientificPseudo} (${mechanism.ums})
    
    REFERENCE STYLE: ${referenceMedia}
    
    RULES:
    1. Use "Shock & Awe".
    2. Be Specific (Use Odd Numbers).
    3. Call out the "Enemy" or a "Hidden Danger".
    4. TONE: Urgent, slightly controversial, "Trashy but Irresistible".
    
    ${toneInstruction}

    BAD HOOK: "Here is how to lose weight."
    GOOD HOOK (English): "The '3-Second Morning Ritual' Doctors Are Begging You To Stop Using."
    GOOD HOOK (Indo): "Sumpah nyesel banget baru tau trik 3 detik ini sekarang."
    
    Output a simple JSON string array.
  `;
  
   const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
}

export const generateAngles = async (project: ProjectContext, personaName: string, personaMotivation: string): Promise<GenResult<any[]>> => {
  const model = "gemini-2.5-flash";
  const country = project.targetCountry || "USA";

  // SYSTEM: Andromeda Strategy (Tier Selection & Prioritization)
  const prompt = `
    You are a Direct Response Strategist applying the "Andromeda Testing Playbook".
    
    CONTEXT:
    Product: ${project.productName}
    Persona: ${personaName}
    Deep Motivation: ${personaMotivation}
    Target Country: ${country}
    
    TASK:
    Brainstorm 10 raw angles/hooks using these specific psychological frames:
    
    1. THE NEGATIVE ANGLE (Crucial): Focus on what they want to AVOID. (e.g., "Stop wasting money on X", "No more back pain").
    2. THE TECHNICAL ANGLE: Use a specific scientific term/ingredient (e.g., "Cortisol", "Blue Light").
    3. THE DESIRE ANGLE: Pure benefit/transformation.

    Then, Prioritize & Assign Tiers:
    - TIER 1 (Concept Isolation): Big, bold, new ideas. High risk/reward.
    - TIER 2 (Persona Isolation): Specifically tailored to this persona's fear/desire.
    - TIER 3 (Sprint Isolation): A simple iteration or direct offer.
    
    OUTPUT:
    Return ONLY the Top 3 High-Potential Insights (Ensure at least 1 is a NEGATIVE ANGLE).
    
    *Language Rule for ${country}: Write the 'headline' and 'hook' in the local language (e.g. Bahasa Indonesia for Indonesia) using natural marketing slang.*
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
            headline: { type: Type.STRING, description: "The core Hook/Angle name" },
            painPoint: { type: Type.STRING, description: "The specific problem or insight" },
            psychologicalTrigger: { type: Type.STRING, description: "The principle used (e.g. Loss Aversion)" },
            testingTier: { type: Type.STRING, description: "TIER 1, TIER 2, or TIER 3" },
            hook: { type: Type.STRING, description: "The opening line or concept" }
          },
          required: ["headline", "painPoint", "psychologicalTrigger", "testingTier"]
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

export const generateHVCOIdeas = async (project: ProjectContext, painPoint: string): Promise<GenResult<HVCOOption[]>> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    ROLE: Sabri Suby (Strategy).
    
    CONTEXT:
    The market is tired of "Hard Offers" (Buy Now). We need to catch the 97% of people who are just "Looking for Info".
    We need a "High Value Content Offer" (HVCO) - a Bait piece of content (PDF/Video/Guide).
    
    PRODUCT: ${project.productName}
    PAIN POINT: ${painPoint}
    
    TASK:
    Generate 3 HVCO (Lead Magnet) Titles that solve a specific "Bleeding Neck" problem WITHOUT asking for a purchase.
    
    CRITERIA:
    1. Must sound like "Forbidden Knowledge" or "Insider Secrets".
    2. Must be a "Mechanism" (e.g., The 3-Step System, The Checklist).
    3. Format: PDF Guide, Cheat Sheet, or Video Training.
    
    EXAMPLE:
    Product: SEO Agency.
    HVCO: "The 17-Point SEO Death-Checklist That Google Doesn't Want You To Know."
    
    OUTPUT JSON:
    - title: The Catchy Title.
    - format: PDF/Video/Webinar.
    - hook: Why they need to download it NOW.
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
            title: { type: Type.STRING },
            format: { type: Type.STRING },
            hook: { type: Type.STRING }
          },
          required: ["title", "format", "hook"]
        }
      }
    }
  });
  
  return {
    data: extractJSON<HVCOOption[]>(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};
