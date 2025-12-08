
import { Type } from "@google/genai";
import { ProjectContext, CreativeFormat, AdCopy, CreativeConcept, GenResult, StoryOption, BigIdeaOption, MechanismOption, MarketAwareness } from "../../types";
import { ai, extractJSON } from "./client";

export const generateSalesLetter = async (
  project: ProjectContext,
  story: StoryOption,
  bigIdea: BigIdeaOption,
  mechanism: MechanismOption,
  hook: string
): Promise<GenResult<string>> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    ROLE: Direct Response Copywriter (Long Form / Advertorial Specialist).
    
    TASK: Write a high-converting Sales Letter (or long-form Facebook Ad) that connects all the strategic dots.
    
    STRATEGY STACK:
    1. HOOK: "${hook}" (Grab attention).
    2. STORY: "${story.narrative}" (Emotional Connection/Empathy).
    3. THE SHIFT (Big Idea): "${bigIdea.headline}" - "${bigIdea.concept}" (Destroys old belief).
    4. THE SOLUTION (Mechanism): "${mechanism.scientificPseudo}" - "${mechanism.ums}" (The new logic).
    5. OFFER: ${project.offer} for ${project.productName}.
    
    PRODUCT DETAILS:
    ${project.productDescription}
    
    TONE: Persuasive, storytelling-based, logical yet emotional.
    FORMAT: Markdown. Use bolding for emphasis. Keep paragraphs short (1-2 sentences).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return {
    data: response.text || "",
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateCreativeConcept = async (
  project: ProjectContext, 
  personaName: string, 
  angle: string, 
  format: CreativeFormat
): Promise<GenResult<CreativeConcept>> => {
  const model = "gemini-2.5-flash";

  const awareness = project.marketAwareness || "Problem Aware";
  
  let awarenessInstruction = "";
  if (awareness.includes("Unaware") || awareness.includes("Problem")) {
      awarenessInstruction = `AWARENESS: LOW. Focus on SYMPTOM. Use Pattern Interrupt.`;
  } else if (awareness.includes("Solution")) {
      awarenessInstruction = `AWARENESS: MEDIUM. Focus on MECHANISM and SOCIAL PROOF.`;
  } else {
      awarenessInstruction = `AWARENESS: HIGH. Focus on URGENCY and OFFER.`;
  }

  const prompt = `
    # Role: Creative Director (The Pattern Interrupt Specialist)

    **SABRI SUBY'S "ANTI-COMPETITOR" RULE:**
    1. Imagine the "Standard Boring Ad" for this industry (e.g., smiling stock photos, clean studio lighting).
    2. THROW IT IN THE TRASH.
    3. Do the EXACT OPPOSITE. If they go high, we go low (lo-fi). If they are polished, we are raw.
    
    **INPUTS:**
    Product Name: ${project.productName}
    Product Description (WHAT IT IS): ${project.productDescription}
    Winning Insight: ${angle}
    Format: ${format}
    Context: ${project.targetCountry}
    ${awarenessInstruction}
    
    **CRITICAL FOR FORMAT '${format}':**
    *   If 'Long Text' or 'Story' or 'IG Story Text Overlay': You MUST describe a vertical, candid, authentic shot.
    *   **CRITICAL NEGATIVE SPACE RULE:** For 'IG Story Text Overlay', the subject MUST be positioned to leave ample "Negative Space" (e.g., sky, blank wall, car ceiling) where text can be overlaid. Do not fill the frame with details.
    *   If 'Ugly Visual' or 'Pattern Interrupt': Describe a chaotic, low-fidelity scene.
    
    **TASK:**
    Create a concept that VIOLATES the expectations of the feed.

    **VISUAL INSTRUCTION (MICRO-MOMENTS):**
    If the hook is about a habit, ritual, or anxiety, describe the SPECIFIC MICRO-MOMENT.
    Bad: "A sad person."
    Good: "A POV shot of looking down at a bathroom scale seeing the number, toes curled in anxiety."
    Good: "Checking banking app at 3AM with one eye open."
    
    **OUTPUT REQUIREMENTS (JSON):**

    **1. Congruence Rationale:**
    Explain WHY this image matches this specific headline. "The headline promises X, so the image shows X happening."

    **2. TECHNICAL PROMPT (technicalPrompt):**
    A STRICT prompt for the Image Generator. 
    *   If format is text-heavy (e.g. Twitter, Notes, Story), describe the BACKGROUND VIBE (Candid/Blurry) and UI details (Instagram Fonts, Text Bubbles).
    *   If format is visual (e.g. Photography), the SUBJECT ACTION must match the HOOK.

    **3. SCRIPT DIRECTION (copyAngle):**
    Instructions for the copywriter.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualScene: { type: Type.STRING, description: "Director's Note" },
          visualStyle: { type: Type.STRING, description: "Aesthetic vibe" },
          technicalPrompt: { type: Type.STRING, description: "Strict prompt for Image Gen" },
          copyAngle: { type: Type.STRING, description: "Strategy for the copywriter" },
          rationale: { type: Type.STRING, description: "Strategic Hypothesis" },
          congruenceRationale: { type: Type.STRING, description: "Why the Image proves the Text (The Jeans Rule)" },
          hookComponent: { type: Type.STRING, description: "The Visual Hook element" },
          bodyComponent: { type: Type.STRING, description: "The Core Argument element" },
          ctaComponent: { type: Type.STRING, description: "The Call to Action element" }
        },
        required: ["visualScene", "visualStyle", "technicalPrompt", "copyAngle", "rationale", "congruenceRationale"]
      }
    }
  });

  return {
    data: extractJSON(response.text || "{}"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

export const generateAdCopy = async (
  project: ProjectContext, 
  persona: any, 
  concept: CreativeConcept,
  format?: CreativeFormat,
  isHVCOFlow: boolean = false,
  mechanism?: MechanismOption
): Promise<GenResult<AdCopy>> => {
  const model = "gemini-2.5-flash";
  const country = project.targetCountry || "USA";
  const isIndo = country.toLowerCase().includes("indonesia");

  // --- 1. PERSONA DEEP DIVE (Agar Emosional) ---
  const deepPsychologyContext = `
    TARGET PERSONA:
    - Identity: ${persona.name}
    - Pain Points/Visceral Symptoms: "${(persona.visceralSymptoms || []).join('", "')}"
    - Deep Fear: "${persona.deepFear || 'Failure'}"
    - Motivation: "${persona.motivation || 'Relief'}"
    
    CRITICAL INSTRUCTION: You are writing to THIS specific person. Use their vocabulary, their fears, and their slang.
    Do NOT write a generic ad. Speak directly to their 'Bleeding Neck' problem defined above.
  `;

  // --- 2. TONE ADJUSTMENT (Agar Tidak Kaku) ---
  let toneInstruction = "";
  if (isIndo) {
      toneInstruction = `
        LANGUAGE STYLE: Bahasa Indonesia "Anak Jaksel" / Social Media Slang / Bahasa Gaul.
        - FORBIDDEN WORDS (Too Formal): "Anda", "Kami", "Solusi", "Dapatkan", "Memperkenalkan", "Fitur", "Rasakan", "Temukan".
        - MANDATORY WORDS/PARTICLES: "Gue/Lo" (or "Aku/Kamu" if soft persona), "Banget", "Sumpah", "Jujur", "Gimana sih", "sih", "deh", "dong", "kan".
        - VIBE: Bestie sharing a secret or venting to a friend. Not a salesman holding a brochure.
        - STRUCTURE: Short sentences. Lowercase is okay for aesthetic.
      `;
  } else {
      toneInstruction = `
        LANGUAGE STYLE: Native Social Media English (TikTok/IG/Reddit).
        - FORBIDDEN WORDS (Marketing Speak): "Discover", "Unlock", "Unleash", "Solution", "Introducing", "Revolutionary", "Elevate", "Game-changer".
        - VIBE: Authentic, raw, slightly imperfect. Like a Reddit thread title or a tweet.
        - STRUCTURE: Short, punchy lines. "In Media Res" storytelling.
      `;
  }

  // --- 3. FORMAT SPECIFIC RULES ---
  let formatRule = "";
  if (isHVCOFlow || format === CreativeFormat.LEAD_MAGNET_3D) {
      formatRule = `
        GOAL: Sell the CLICK, not the product.
        Make them curious about the "Secret" inside the guide/video.
        Use "Fascinations" (e.g., "• The one mistake creating 80% of your problem...").
      `;
  } else {
      formatRule = `
        GOAL: Stop the scroll with a relatable struggle.
        START "IN MEDIA RES" (In the middle of the action).
        
        BAD START: "Are you struggling with X?" (Boring/Ad-like)
        GOOD START: "I nearly cried looking at my bank account this morning..." (Story/Native)
        GOOD START: "My doctor actually laughed when I asked about..." (Conflict)
      `;
  }

  // --- 4. THE PROMPT (The Brain Transplant) ---
  const prompt = `
    # ROLE: Viral Social Media Content Creator (NOT a Copywriter).
    
    **YOUR ENEMY:** "Landing Page Copy".
    If it sounds like a brochure, a TV commercial, or a website header, YOU FAIL.
    If it sounds like a friend venting, gossiping, or sharing a lifehack, YOU WIN.

    **INPUT CONTEXT:**
    Product: ${project.productName} (${project.productDescription})
    Offer: ${project.offer}
    ${deepPsychologyContext}
    
    **VISUAL CONTEXT:**
    The user sees: "${concept.visualScene}"
    Rationale: "${concept.congruenceRationale}"
    
    **RULES OF ENGAGEMENT:**
    1. **NO INTROS:** Never start with "Do you suffer from...?" or "Introducing...". Start with a Statement or a weird Question.
    2. **MICRO-BLOG FORMAT:** Short lines. Lots of white space. No heavy paragraphs.
    3. **NATIVE CONTENT:** If the visual is a meme, write a meme caption. If it's a story, write a story.
    4. **THE "ANTI-AD" FILTER:** Would a real person post this? If no, rewrite it.
    
    ${toneInstruction}
    ${formatRule}
    ${mechanism ? `Hint at the Mechanism ("${mechanism.scientificPseudo}") as the 'New Way' or 'The Reason you failed before', but don't be boring/academic.` : ''}

    **TASK:** Write the Instagram/TikTok Caption & Headline.

    **OUTPUT JSON:**
    {
      "primaryText": "The caption. (Use emojis naturally 🧵👇)",
      "headline": "The image headline (Max 7 words, punchy)",
      "cta": "Button text (e.g. 'More Info', 'Download', 'Learn More')"
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
          primaryText: { type: Type.STRING },
          headline: { type: Type.STRING },
          cta: { type: Type.STRING }
        },
        required: ["primaryText", "headline", "cta"]
      }
    }
  });

  return {
    data: extractJSON(response.text || "{}"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};
