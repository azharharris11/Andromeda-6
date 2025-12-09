
import { ProjectContext, CreativeFormat, GenResult, MarketAwareness } from "../../types";
import { ai } from "./client";

// --- 1. DYNAMIC SAFETY GUIDELINES ---

const getSafetyGuidelines = (isUglyOrMeme: boolean): string => {
  const COMMON_RULES = `
    1. NO Nudity or Sexual content.
    2. NO Medical Gore or overly graphic body fluids.
    3. If humans are shown, they must look generally realistic (unless specified as cartoon/drawing).
  `;

  if (isUglyOrMeme) {
    return `
      SAFETY GUIDELINES (RELAXED FOR MEMES/UGLY ADS):
      ${COMMON_RULES}
      4. EXCEPTION: Low quality, pixelated, "broken" aesthetics, MS Paint drawings, and amateur editing are ALLOWED and REQUIRED for this format.
      5. EXCEPTION: Glitchy text or impact font overlays are ALLOWED.
    `;
  }

  return `
    SAFETY GUIDELINES (STRICT PROFESSIONAL):
    ${COMMON_RULES}
    4. NO Glitchy text.
    5. NO "Before/After" split screens that show unrealistic body transformations.
    6. Images must be high quality and strictly adhere to ad platform policies.
  `;
};

const ENHANCERS = {
    PROFESSIONAL: "Photorealistic, 8k resolution, highly detailed, shot on 35mm lens, depth of field, natural lighting, sharp focus.",
    UGC: "Shot on iPhone 15, raw photo, realistic skin texture, authentic amateur photography, slightly messy background, no bokeh, everything in focus (deep depth of field).",
    AUTHENTIC_UGC: `
      STYLE: Authentic User Generated Content (UGC).
      - Shot on iPhone, slightly wide angle.
      - Lighting: Natural indoor lighting or standard room light (No studio lights).
      - Focus: Sharp and clear focus on the subject/text (NO motion blur).
      - Composition: Centered and clear, easy to understand at a glance.
      - Vibe: Looks like a regular person posted this on their story.
      - NOT aesthetic, but NOT broken. Just real.
    `
};

// --- 2. CULTURAL & PERSONA CONTEXT BUILDERS ---

const getCulturePrompt = (country: string = "USA"): string => {
    const c = country.toLowerCase();
    
    if (c.includes('indonesia')) {
        return `
            INDONESIAN CONTEXT (CRITICAL):
            - Models: Indonesian ethnicity (Native), Southeast Asian features.
            - Environment: Tropical vibes, ceramic tile floors, slightly cluttered aesthetics, rattan furniture, or modern minimalist Jakarta apartments.
            - Street Details: If outdoors, show tropical plants, motorbikes (scooters like Honda Beat), or subtle "Warung" vibes in background.
            - Lighting: Warm, humid tropical light.
            - Clothing: Casual modest wear.
        `;
    }
    
    if (c.includes('usa') || c.includes('united states') || c.includes('america')) {
        return `
            US CONTEXT:
            - Models: Diverse American demographics.
            - Environment: Suburban homes (carpet/hardwood), open plan kitchens, or urban brick exposed apartments.
            - Street Details: Pickup trucks, SUVs, wider streets, US-style electrical outlets if visible.
            - Lighting: Clean daylight or cinematic indoor warmth.
        `;
    }

    // Default Fallback
    return `Target Country: ${country}. Adapt visual cues (plugs, architecture, ethnicity) to be authentic to this region.`;
};

const getPersonaVisualContext = (persona: any): string => {
    const age = persona.age || 25; // Default if not found
    
    let ageStyle = "";
    if (age < 26) {
        ageStyle = "Gen Z Aesthetic: Chaos-core, flash photography, mirrors, clutter is okay, lo-fi, authentic, 'photo dump' vibe.";
    } else if (age < 42) {
        ageStyle = "Millennial Aesthetic: Curated chaos, pastel tones, house plants, minimal but lived-in, 'Instagrammable' but trying to look candid.";
    } else {
        ageStyle = "Gen X / Boomer Aesthetic: Clear lighting, straightforward composition, focus on function, clean domestic environments, high trust.";
    }

    const identity = persona.profile || persona.name || "Target User";
    const pain = (persona.visceralSymptoms || []).join(", ");

    return `
        PERSONA VISUAL IDENTITY:
        - WHO: ${identity} (Approx Age: ${age}).
        - VISUAL VIBE: ${ageStyle}
        - PAIN CONTEXT: They are struggling with: "${pain}". Show this struggle in the environment (e.g. piles of laundry, messy desk, medicines on counter).
    `;
};

// --- 3. SMART ANGLE PARSING ---

interface ParsedAngle {
    cleanAngle: string;
    isPainFocused: boolean;
    isSolutionFocused: boolean;
    isUrgent: boolean;
    context: string;
}

const parseAngle = (angle: string): ParsedAngle => {
    const parts = angle.split('[STRATEGY CONTEXT:');
    const cleanAngle = parts[0].trim().replace(/^"|"$/g, ''); // Remove quotes
    const context = parts[1]?.replace(']', '').trim() || "";
    
    const lower = (cleanAngle + context).toLowerCase();
    
    return {
        cleanAngle,
        context,
        isPainFocused: /pain|problem|struggle|suffering|hate|tired|sick|failed|stop|avoid|mistake|worst/i.test(lower),
        isSolutionFocused: /fix|solve|cure|relief|solution|trick|hack|method|system|easy/i.test(lower),
        isUrgent: /now|today|immediately|urgent|warning|alert|fast/i.test(lower)
    };
};

// --- HELPER INTERFACES ---

interface PromptContext {
    project: ProjectContext;
    format: CreativeFormat;
    parsedAngle: ParsedAngle;
    visualScene: string;
    visualStyle: string;
    technicalPrompt: string;
    textCopyInstruction: string;
    personaVisuals: string;
    moodPrompt: string;
    culturePrompt: string;
    subjectFocus: string;
    enhancer: string;
}

// --- 4. TEXT INSTRUCTION GENERATOR (SPECIFIC) ---

const generateTextInstruction = (format: CreativeFormat, parsedAngle: ParsedAngle, project: ProjectContext): string => {
    const { cleanAngle, isPainFocused } = parsedAngle;
    const productContext = `${project.productName} (${project.productDescription})`;

    // Helper to inject product context
    const baseCtx = `
        PRODUCT: ${productContext}
        INPUT HOOK: "${cleanAngle}"
    `;

    switch (format) {
        case CreativeFormat.CHAT_CONVERSATION:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: A private message between friends (WhatsApp/iMessage).
            - SENDER POV: Someone who just found the solution.
            - BAD: "You should buy this product, it has 3 features." (Salesy)
            - GOOD: "bro i actually slept 8 hours last night wtf" (Relatable)
            - GOOD: "why did no one tell me about this earlier 😭"
            - RULE: Use lowercase, typos, slang (Gen Z), and emojis. Make it sound like a leaked DM.
            `;
        
        case CreativeFormat.TWITTER_REPOST:
        case CreativeFormat.HANDHELD_TWEET:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: A viral tweet/X post.
            - TONE: Opinionated, slightly controversial, "Hot Take".
            - BAD: "This product is great."
            - GOOD: "If you still do [Old Habit], you are playing life on hard mode."
            - GOOD: "Whatever you do, just stop eating sugar. Trust me."
            `;

        case CreativeFormat.PHONE_NOTES:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Personal "To-Do" list or Journal in Apple Notes.
            - TONE: Raw, unfiltered, bullet points.
            - TASK: Write 3 reminders related to the hook.
            - EXAMPLE: 
              • Drink water
              • ${cleanAngle}
              • Call mom
            `;

        case CreativeFormat.IG_STORY_TEXT:
        case CreativeFormat.LONG_TEXT:
             return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Instagram Story text overlay (internal monologue).
            - TONE: Vulnerable, "Real Talk", Diary entry style.
            - TASK: A short paragraph about the struggle of "${cleanAngle}".
            - BAD: "Buy this now!"
            - GOOD: "I nearly gave up on fixing my skin until I realized this..."
            `;

        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Social Media Comments Section.
            - TASK: Generate 2 comments. 
              1. Skeptic: "Does this actually work tho? I've tried everything."
              2. Believer (Reply): "Yes! It literally saved my [Body Part]. 10/10."
            `;

        case CreativeFormat.MEME:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Top/Bottom Text Impact Font Meme.
            - TONE: Ironic, funny, relatable pain.
            - TASK: "When you [Experience Pain] but then [Result of Hook]".
            - BAD: "Use ${project.productName}."
            - GOOD: "Me waiting for my back pain to disappear (it won't)."
            `;

        case CreativeFormat.STICKY_NOTE_REALISM:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Handwritten sticky note reminder.
            - TONE: Urgent, Imperative.
            - TASK: Summarize hook into 3-4 punchy handwritten words.
            - EXAMPLE: "NO. MORE. EXCUSES."
            `;

        case CreativeFormat.REMINDER_NOTIF:
        case CreativeFormat.DM_NOTIFICATION:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Lock screen notification.
            - SENDER: "Calendar" or "Mom" or "Bestie".
            - TASK: A short, urgent reminder.
            - EXAMPLE: "Reminder: Take your supplements."
            `;

        default:
            return `TEXT COPY INSTRUCTION: Include the text "${cleanAngle}" clearly in the image. Keep it SHORT (max 5 words).`;
    }
};

// --- PROMPT STRATEGIES ---

// 1. UGLY / PATTERN INTERRUPT FORMATS
const getUglyFormatPrompt = (ctx: PromptContext): string => {
    const { format, project, visualScene, parsedAngle, textCopyInstruction, moodPrompt, culturePrompt, enhancer } = ctx;
    const safety = getSafetyGuidelines(true); // RELAXED RULES

    if (format === CreativeFormat.MS_PAINT) {
        return `A crude, badly drawn MS Paint illustration related to ${project.productName}. Stick figures, comic sans text, bright primary colors. Looks like a child or amateur drew it to explain: "${parsedAngle.cleanAngle}". Authentically bad internet meme style. ${safety}`;
    } 
    if (format === CreativeFormat.MEME) {
        return `
            A viral internet meme format.
            Image content: ${visualScene}.
            ${textCopyInstruction}
            Ensure the text is large, legible Impact Font (White with Black Outline), and perfectly spelled.
            ${safety}
        `;
    } 
    if (format === CreativeFormat.REDDIT_THREAD) {
        return `
          A screenshot of a Reddit thread (Dark Mode). 
          Title: "${parsedAngle.cleanAngle}". 
          Subreddit: r/TrueOffMyChest or r/AskReddit. 
          UI: Upvote buttons, comments. 
          Vibe: Authentic screen capture.
          ${safety}
        `;
    }
    
    // Generic Ugly
    return `A visually raw, unpolished, low-quality image. ${ctx.subjectFocus}. Action: ${visualScene}. ${enhancer} ${culturePrompt} ${moodPrompt} ${safety}`;
};

// 2. NATIVE STORY / SOCIAL FORMATS
const getNativeStoryPrompt = (ctx: PromptContext): string => {
    const { format, project, visualScene, parsedAngle, textCopyInstruction, moodPrompt, culturePrompt, personaVisuals, enhancer } = ctx;
    const safety = getSafetyGuidelines(false); // STRICTER FOR HUMANS

    if (format === CreativeFormat.CHAT_CONVERSATION) {
        const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");
        const appStyle = isIndo ? "WhatsApp UI (Green bubbles)" : "iMessage UI (Blue bubbles)";
        const sender = isIndo ? "Sayang" : "Bestie";

        return `
          A close-up photo of a hand holding a smartphone displaying a chat conversation.
          App Style: ${appStyle}.
          Sender Name: "${sender}".
          ${textCopyInstruction}
          Background: Blurry motion (walking on street or inside car).
          Lighting: Screen glow on thumb.
          Make the UI look 100% authentic to the app.
          ${enhancer} ${safety}
        `;
    } 
    
    if (format === CreativeFormat.IG_STORY_TEXT) {
        return `
          A realistic vertical photo formatted for Instagram Story.
          VISUAL: ${visualScene}.
          ${personaVisuals}
          Environment: Authentic, real-life background (e.g. car interior, messy living room).
          NEGATIVE SPACE: Ensure there is ample empty space (sky, wall, or ceiling) for text placement.
          OVERLAY INSTRUCTION:
          Superimpose a realistic "Instagram Text Bubble" or a "White Text Block with Rounded Corners".
          ${textCopyInstruction}
          Make the text sharp, legible, and central to the composition.
          ${culturePrompt} ${moodPrompt} ${ENHANCERS.UGC} ${safety}
        `;
    } 

    // General Candid Logic
    return `
        A brutally authentic, amateur photo taken from a first-person perspective (POV) or candid angle.
        SCENE ACTION: ${visualScene}.
        ${personaVisuals}
        Lighting: Bad overhead lighting or harsh flash (Direct Flash Photography).
        Quality: Slightly grainy, iPhone photo quality.
        ${textCopyInstruction}
        ${culturePrompt} ${moodPrompt} ${safety}
    `;
};

// 3. SPECIFIC "WINNING" FORMATS
const getSpecificFormatPrompt = (ctx: PromptContext): string => {
    const { format, project, parsedAngle, enhancer, culturePrompt, safety } = ctx as any; // safety injected in main

    if (format === CreativeFormat.VENN_DIAGRAM) {
        return `A simple, minimalist Venn Diagram graphic on a solid, clean background. Left Circle Label: "Competitors". Right Circle Label: "${project.productName}". Intersection: "${parsedAngle.cleanAngle}". Style: Corporate Memphis flat design. ${enhancer} ${safety}`;
    }

    if (format === CreativeFormat.PRESS_FEATURE) {
        return `
          A realistic digital screenshot of an online news article.
          Header: A recognized GENERIC media logo (like 'Daily Health', 'TechInsider').
          Headline: "${parsedAngle.cleanAngle}".
          Image: High-quality candid photo of ${project.productName} embedded in the article body.
          Vibe: Editorial, Trustworthy.
          ${enhancer} ${safety}
        `;
    }

    if (format === CreativeFormat.TESTIMONIAL_HIGHLIGHT) {
        return `
          A close-up shot of a printed customer review or a digital review card on paper texture.
          Text: A review about "${parsedAngle.cleanAngle}".
          Key phrases are HIGHLIGHTED in bright neon yellow marker.
          Background: A messy desk or kitchen counter.
          ${enhancer} ${safety}
        `;
    }

    if (format === CreativeFormat.LEAD_MAGNET_3D) {
        return `
          A high-quality 3D render of a physical book or spiral-bound report sitting on a modern wooden desk.
          Title on Cover: "${parsedAngle.cleanAngle}".
          Cover Design: Bold typography, authoritative colors.
          Lighting: Cinematic, golden hour.
          Background: Blurry office.
          ${enhancer} ${safety}
        `;
    }

    if (format === CreativeFormat.MECHANISM_XRAY) {
      return `
        A scientific or medical illustration style (clean, 3D render or cross-section diagram).
        Subject: Visualizing the problem: "${parsedAngle.cleanAngle}".
        Detail: Show the biological or mechanical failure point clearly inside the body/object.
        Labeling: Add a red arrow pointing to the problem area.
        Vibe: Educational, shocking discovery.
        ${safety}
      `;
    }

    if (format === CreativeFormat.US_VS_THEM) {
      return `
        A split screen comparison image. 
        Left side (Them): Visualize the PAIN of "${parsedAngle.cleanAngle}". Gloomy lighting. Labeled "Them". 
        Right side (Us): Visualize the SOLUTION of "${parsedAngle.cleanAngle}". Bright lighting. Labeled "Us". 
        ${enhancer} ${culturePrompt} ${safety}.
      `;
    }

    return ""; 
};

// 4. DEFAULT
const getDefaultPrompt = (ctx: PromptContext): string => {
    const { technicalPrompt, visualScene, visualStyle, enhancer, culturePrompt, moodPrompt, subjectFocus } = ctx;
    const safety = getSafetyGuidelines(false);
    
    if (technicalPrompt && technicalPrompt.length > 20) {
        return `${subjectFocus} ${technicalPrompt}. ${enhancer} ${culturePrompt} ${moodPrompt} ${safety}`;
    } else {
        return `${subjectFocus} ${visualScene}. Style: ${visualStyle || 'Natural'}. ${enhancer} ${culturePrompt} ${moodPrompt} ${safety}`;
    }
};

// --- MAIN GENERATOR FUNCTION ---

export const generateCreativeImage = async (
  project: ProjectContext,
  persona: any,
  angle: string,
  format: CreativeFormat,
  visualScene: string,
  visualStyle: string,
  technicalPrompt: string,
  aspectRatio: string = "1:1",
  referenceImageBase64?: string
): Promise<GenResult<string | null>> => {
  
  const model = "gemini-2.5-flash-image";
  const country = project.targetCountry || "USA";
  
  // 1. INTELLIGENT PARSING
  const parsedAngle = parseAngle(angle);
  const culturePrompt = getCulturePrompt(country);
  const personaVisuals = getPersonaVisualContext(persona);
  
  // 2. SAFETY & MOOD
  const isUglyFormat = [
    CreativeFormat.UGLY_VISUAL,
    CreativeFormat.MS_PAINT,
    CreativeFormat.REDDIT_THREAD,
    CreativeFormat.MEME
  ].includes(format);

  const safety = getSafetyGuidelines(isUglyFormat);

  let moodPrompt = "Lighting: Natural, inviting. Emotion: Positive.";
  if (parsedAngle.isPainFocused || parsedAngle.isUrgent) {
      moodPrompt = "Lighting: High contrast, dramatic shadows, moody. Emotion: Frustrated, Urgent, Serious.";
  }
  if (isUglyFormat) {
     moodPrompt = "Lighting: Bad, amateur flash, or harsh fluorescent. Emotion: Authentic, candid.";
  }

  // 3. MARKET AWARENESS / SUBJECT FOCUS
  let subjectFocus = "";
  switch (project.marketAwareness) {
    case MarketAwareness.UNAWARE:
        subjectFocus = `
            ${personaVisuals}
            PAIN VISUALIZATION: Show the exact moment of frustration related to "${parsedAngle.cleanAngle}".
            DO NOT show the product.
            Example: If pain is "Can't sleep", show them staring at the ceiling at 3AM.
            Example: If pain is "Back pain", show them wincing while standing up.
        `;
        break;
    case MarketAwareness.PROBLEM_AWARE:
        subjectFocus = `
            ${personaVisuals}
            SCENE: The "Graveyard of Failed Attempts". Show the user surrounded by old solutions that didn't work.
            Vibe: Fed up, skeptical.
        `;
        break;
    default:
        subjectFocus = `${personaVisuals} SUBJECT: High context visual related to ${parsedAngle.cleanAngle}.`;
  }

  // 4. ENHANCER SELECTION
  let appliedEnhancer = ENHANCERS.PROFESSIONAL;
  const isNativeStory = [
    CreativeFormat.STORY_QNA, CreativeFormat.LONG_TEXT, CreativeFormat.UGC_MIRROR,
    CreativeFormat.PHONE_NOTES, CreativeFormat.TWITTER_REPOST, CreativeFormat.SOCIAL_COMMENT_STACK,
    CreativeFormat.HANDHELD_TWEET, CreativeFormat.STORY_POLL, CreativeFormat.EDUCATIONAL_RANT,
    CreativeFormat.CHAT_CONVERSATION, CreativeFormat.IG_STORY_TEXT, CreativeFormat.DM_NOTIFICATION,
    CreativeFormat.REMINDER_NOTIF
  ].includes(format);

  if (isUglyFormat) appliedEnhancer = ENHANCERS.AUTHENTIC_UGC;
  else if (isNativeStory) appliedEnhancer = ENHANCERS.UGC;
  else if (format === CreativeFormat.CAROUSEL_REAL_STORY) appliedEnhancer = ENHANCERS.UGC;

  // 5. BUILD CONTEXT
  const ctx: PromptContext = {
      project, format, parsedAngle, visualScene, visualStyle, technicalPrompt, 
      textCopyInstruction: generateTextInstruction(format, parsedAngle, project),
      personaVisuals, moodPrompt, culturePrompt, subjectFocus, 
      enhancer: appliedEnhancer
  };

  // 6. SELECT STRATEGY
  let finalPrompt = "";
  if (isUglyFormat) {
      finalPrompt = getUglyFormatPrompt(ctx);
  } else if (isNativeStory) {
      finalPrompt = getNativeStoryPrompt(ctx);
  } else {
      // Check for specific winning formats first
      const specificPrompt = getSpecificFormatPrompt({ ...ctx, safety } as any);
      if (specificPrompt) {
          finalPrompt = specificPrompt;
      } else {
          // Default logic
          finalPrompt = getDefaultPrompt(ctx);
      }
  }

  // 7. EXECUTE
  const parts: any[] = [{ text: finalPrompt }];
  
  if (referenceImageBase64) {
      const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.unshift({
          inlineData: { mimeType: "image/png", data: base64Data }
      });
      parts.push({ text: "Use this image as a strict character/style reference. Maintain the same person/environment but change the pose/action as described." });
  } 
  else if (project.productReferenceImage) {
      const base64Data = project.productReferenceImage.split(',')[1] || project.productReferenceImage;
      parts.unshift({
          inlineData: { mimeType: "image/png", data: base64Data }
      });
      parts.push({ text: "Use the product/subject in the provided image as the reference. Maintain brand colors and visual identity." });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: aspectRatio === "1:1" ? "1:1" : "9:16" } }
    });

    let imageUrl: string | null = null;
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }
    return {
      data: imageUrl,
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    };
  } catch (error) {
    console.error("Image Gen Error", error);
    return { data: null, inputTokens: 0, outputTokens: 0 };
  }
};

export const generateCarouselSlides = async (
  project: ProjectContext,
  format: CreativeFormat,
  angle: string,
  visualScene: string,
  visualStyle: string,
  technicalPrompt: string,
  persona: any
): Promise<GenResult<string[]>> => {
  const slides: string[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Define 3 slides for the carousel
  const slideVariations = [
    { role: "Title Slide", instruction: "This is the first slide (Hook). Focus on the problem or headline visual." },
    { role: "Middle Slide", instruction: "This is the middle slide (Value). Show the mechanism, process, or social proof detail." },
    { role: "End Slide", instruction: "This is the final slide (CTA). Show the result, product stack, or call to action." }
  ];

  // We run them in parallel
  const promises = slideVariations.map(v => {
      // We modify the visual scene slightly to guide the model for each slide
      const slideScene = `${visualScene}. [CAROUSEL CONTEXT: ${v.role} - ${v.instruction}]`;
      return generateCreativeImage(
          project, 
          persona, 
          angle, 
          format, 
          slideScene, 
          visualStyle, 
          technicalPrompt, 
          "1:1" // Square for carousel usually
      );
  });

  const results = await Promise.all(promises);

  results.forEach(res => {
      if (res.data) slides.push(res.data);
      totalInputTokens += res.inputTokens;
      totalOutputTokens += res.outputTokens;
  });

  return {
      data: slides,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens
  };
};
