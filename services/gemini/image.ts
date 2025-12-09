
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

const getPersonaVisualContext = (persona: any, angle: string): string => {
    const age = persona.age || 25;
    const pain = (persona.visceralSymptoms || []).join(", ");
    
    // MAP PAIN TO VISUAL PROPS
    const painToVisuals: Record<string, string> = {
        'insomnia': 'Unmade bed, blackout curtains, melatonin bottles on nightstand, phone showing 3:47 AM',
        'sleep': 'Unmade bed, blackout curtains, melatonin bottles on nightstand, phone showing 3:47 AM',
        'back pain': 'Heating pad on couch, pain relief cream, awkward sitting posture, lumbar pillow',
        'acne': 'Bathroom counter cluttered with skincare products, tissue with makeup removal, mirror avoidance',
        'skin': 'Bathroom counter cluttered with skincare products, tissue with makeup removal, mirror avoidance',
        'anxiety': 'Bitten nails, fidgeting hands, messy notes, coffee cups everywhere',
        'weight': 'Old gym membership card, unopened salad in fridge, scale in corner',
        'fat': 'Old gym membership card, unopened salad in fridge, scale in corner',
        'brain fog': 'Sticky notes everywhere, half-finished tasks, coffee addiction visible',
        'chronic fatigue': 'Messy unmade bed, curtains closed at noon, energy drink cans',
        'tired': 'Messy unmade bed, curtains closed at noon, energy drink cans',
    };
    
    // Try to match pain to visual cues based on pain list OR angle keywords
    let environmentalCues = "";
    const contextText = (pain + " " + angle).toLowerCase();
    
    for (const [key, visual] of Object.entries(painToVisuals)) {
        if (contextText.includes(key)) {
            environmentalCues = `Environmental Props: ${visual}`;
            break;
        }
    }
    
    // If no match, use generic
    if (!environmentalCues) {
        environmentalCues = `Environmental Props: Clutter related to "${pain}" (e.g. failed solution products, medical paperwork, messy workspace)`;
    }
    
    let ageStyle = "";
    if (age < 26) {
        ageStyle = `Gen Z Aesthetic: LED lights, ring light selfies, messy 'photo dump' vibe, flash photography, mirrors, posters on wall, charging cables everywhere.`;
    } else if (age < 42) {
        ageStyle = `Millennial Aesthetic: House plants (pothos, monstera), minimalist but lived-in, 'Instagrammable' aesthetic, clean chaos, muted tones, reusable water bottle visible.`;
    } else {
        ageStyle = `Gen X / Boomer Aesthetic: Clean, functional spaces, traditional furniture, family photos on walls, organized but not trendy, good overhead lighting.`;
    }

    const identity = persona.profile || persona.name || "Target User";

    return `
        PERSONA VISUAL IDENTITY:
        - WHO: ${identity} (Age: ${age})
        - PAIN: "${pain}"
        - ${environmentalCues}
        - AESTHETIC: ${ageStyle}
        
        CRITICAL: The environment MUST visually communicate the pain without text.
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
    const { cleanAngle } = parsedAngle;
    const productContext = `${project.productName} (${project.productDescription})`;

    // UNIVERSAL FORBIDDEN WORDS (Anti-Salesy)
    const FORBIDDEN = `
        FORBIDDEN WORDS (DO NOT USE):
        ❌ "Buy now", "Click here", "Limited time", "Order today"
        ❌ "Revolutionary", "Game-changer", "Life-changing" (unless ironic)
        ❌ "${project.productName}" (Do NOT mention product name in text)
        ❌ "Scientists", "Doctors", "Experts" (unless Press Feature format)
        ❌ "Proven", "Guaranteed", "100%"
    `;

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
            - CONTEXT: Private DM between friends (WhatsApp/iMessage)
            - SENDER POV: Someone who JUST experienced the result
            - TONE: Shocked, excited, informal, typo-prone
            
            ${FORBIDDEN}
            
            GOOD EXAMPLES:
            ✅ "bro i actually slept 8 hours last night wtf"
            ✅ "why did no one tell me about this earlier 😭"
            ✅ "okay so i tried that thing u mentioned and... holy shit"
            ✅ "my back doesnt hurt anymore??? im shook"
            
            BAD EXAMPLES (Too Salesy):
            ❌ "You should buy this product, it has 3 features"
            ❌ "This changed my life! Link in bio"
            ❌ "Try the ${project.productName} method"
            
            WRITING RULES:
            1. Use lowercase (except "I")
            2. Add typos occasionally ("cant" instead of "can't")
            3. Gen Z slang: "bro", "fr fr", "ngl", "lowkey", "wtf"
            4. Emojis: 💀😭🔥✨ (Max 2 per message)
            5. Show excitement through punctuation: "???" or "!!!"
            6. Max 15 words
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
            ${FORBIDDEN}
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
            ${FORBIDDEN}
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
            ${FORBIDDEN}
            `;

        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Social Media Comments Section.
            - TASK: Generate 2 comments. 
              1. Skeptic: "Does this actually work tho? I've tried everything."
              2. Believer (Reply): "Yes! It literally saved my [Body Part]. 10/10."
            ${FORBIDDEN}
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
            ${FORBIDDEN}
            `;

        case CreativeFormat.STICKY_NOTE_REALISM:
            return `
            ${baseCtx}
            TEXT COPY INSTRUCTION:
            - CONTEXT: Handwritten sticky note reminder.
            - TONE: Urgent, Imperative.
            - TASK: Summarize hook into 3-4 punchy handwritten words.
            - EXAMPLE: "NO. MORE. EXCUSES."
            ${FORBIDDEN}
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
            ${FORBIDDEN}
            `;

        default:
            return `TEXT COPY INSTRUCTION: Include the text "${cleanAngle}" clearly in the image. Keep it SHORT (max 5 words). ${FORBIDDEN}`;
    }
};

// --- 5. SUBJECT FOCUS / SCENE BLOCKING ---

const getSubjectFocus = (
    marketAwareness: MarketAwareness,
    personaVisuals: string,
    parsedAngle: ParsedAngle,
    project: ProjectContext
): string => {
    const { cleanAngle } = parsedAngle;
    const lowerAngle = cleanAngle.toLowerCase();
    
    switch (marketAwareness) {
        case MarketAwareness.UNAWARE:
            // Map common pains to specific scenes
            let specificScene = "";
            
            if (/sleep|insomnia|tired|exhausted/i.test(lowerAngle)) {
                specificScene = `
                    SCENE BLOCKING:
                    - CAMERA ANGLE: POV from pillow looking up at person lying in bed
                    - TIME: Phone screen shows 3:47 AM (Make this visible)
                    - PERSON: Eyes wide open, staring at ceiling, one hand on forehead (frustrated gesture)
                    - LIGHTING: Only light source is phone screen glow (blue light)
                    - ENVIRONMENT: Messy sheets, pillow on floor, blackout curtains
                    - EMOTION: Defeated exhaustion (NOT peaceful sleep)
                `;
            } else if (/pain|ache|sore|hurt|back|neck/i.test(lowerAngle)) {
                specificScene = `
                    SCENE BLOCKING:
                    - CAMERA ANGLE: Side profile or 3/4 view
                    - ACTION: Person wincing while trying to stand up from chair, one hand on lower back/neck
                    - BODY LANGUAGE: Slight hunch, grimace on face, slow careful movement
                    - ENVIRONMENT: Home office or living room, heating pad visible on couch
                    - PROPS: Pain relief cream on table, used but ineffective
                `;
            } else if (/acne|skin|blemish|breakout|wrinkle/i.test(lowerAngle)) {
                specificScene = `
                    SCENE BLOCKING:
                    - LOCATION: Bathroom, morning light
                    - ACTION: Person looking in mirror, face turned away from reflection (avoidance), touching problem area gently
                    - EMOTION: Self-conscious, frustrated
                    - PROPS: Skincare products lined up (visual "graveyard"), tissue box, makeup removal wipes
                    - LIGHTING: Harsh bathroom light showing skin texture clearly
                `;
            } else if (/fat|weight|diet|belly/i.test(lowerAngle)) {
                 specificScene = `
                    SCENE BLOCKING:
                    - LOCATION: Bedroom or Bathroom
                    - ACTION: Person standing on a scale, looking down with disappointment, or pinching belly fat
                    - EMOTION: Frustrated, insecure
                    - PROPS: Scale, old gym clothes
                 `;
            } else {
                // Generic pain scene
                specificScene = `
                    SCENE BLOCKING:
                    - CAPTURE: A specific moment of frustration related to "${cleanAngle}"
                    - PERSON: Showing clear negative emotion (furrowed brow, slumped shoulders, hands covering face)
                    - ENVIRONMENT: Cluttered with signs of struggle
                    - TIMING: "Rock bottom" moment
                `;
            }
            
            return `
                ${personaVisuals}
                MARKET AWARENESS: UNAWARE (Problem-focused, NO PRODUCT)
                ${specificScene}
                
                CRITICAL RULES:
                - DO NOT show the product or solution
                - DO NOT show relief or happiness
                - Focus on the PAIN, not the cure
                - This is the "Before" state
            `;
            
        case MarketAwareness.PROBLEM_AWARE:
            return `
                ${personaVisuals}
                MARKET AWARENESS: PROBLEM AWARE
                
                SCENE BLOCKING:
                - CONCEPT: "The Graveyard of Failed Solutions"
                - VISUAL: Wide shot of table/counter covered with OLD products that didn't work
                - PRODUCTS: Show 5-7 half-used bottles, pills, supplements (DO NOT show ${project.productName})
                - PERSON: In background, arms crossed, looking skeptical/fed up
                - PROPS: Receipts, empty boxes, instruction manuals (signs of wasted money)
                - MOOD: Cynical, defeated, "I've tried everything"
                
                CRITICAL: This shows they KNOW the problem but haven't found the right solution yet.
            `;
            
        case MarketAwareness.SOLUTION_AWARE:
            return `
                ${personaVisuals}
                MARKET AWARENESS: SOLUTION AWARE
                
                SCENE BLOCKING:
                - CONCEPT: "Old Way vs New Way" comparison
                - SPLIT SCREEN or BEFORE/AFTER setup
                - LEFT/BEFORE: Old solution failing (e.g. person still in pain while using competitor)
                - RIGHT/AFTER: New mechanism working (e.g. person relieved, showing ${project.productName})
                - VISUAL CONTRAST: Use color grading (grey/blue for old, warm/golden for new)
            `;
            
        case MarketAwareness.PRODUCT_AWARE:
        case MarketAwareness.MOST_AWARE:
            return `
                MARKET AWARENESS: MOST AWARE (Offer-focused)
                
                SCENE BLOCKING:
                - CONCEPT: "Product Hero Shot + Value Stack"
                - CAMERA: Overhead flat lay OR product held in hand at eye level
                - MAIN SUBJECT: ${project.productName} (3 bottles if "Buy 2 Get 1" offer)
                - SUPPORTING PROPS: Free bonuses (ebook, guide) shown as physical items
                - OVERLAY TEXT: "LIMITED TIME: Buy 2 Get 1 FREE" in bold
                - BACKGROUND: Clean, uncluttered, premium surface (marble or wood)
                - LIGHTING: Professional product photography lighting
                
                CRITICAL: This is about the OFFER, not the problem. Show abundance and value.
            `;
            
        default:
            return `${personaVisuals} SUBJECT: High context visual related to ${cleanAngle}.`;
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

    if (format === CreativeFormat.EDUCATIONAL_RANT) {
        return `
        EDUCATIONAL RANT FORMAT (TikTok/Reels Style):
        
        CAMERA SETUP:
        - POV: Direct-to-camera, person talking passionately
        - FRAMING: Vertical 9:16, face takes up 60% of frame
        - BACKGROUND: Green screen showing a screenshot of a news article/study/graph about "${parsedAngle.cleanAngle}"
        
        PERSON'S EXPRESSION:
        - Emotion: Passionate, frustrated, "I need to tell you this" energy
        - Gestures: Hands moving emphatically, pointing at screen occasionally
        - NOT smiling - this is serious educational content
        
        UI OVERLAYS:
        - Top text: "Why is nobody talking about this??" (White text, black outline)
        - Captions: Auto-generated style captions at bottom
        - Duration indicator: "0:15" in corner
        
        VIBE: Feels like a concerned friend dropping truth bombs, not a brand ad
        ${ENHANCERS.UGC} ${safety}
        `;
    }

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
  const personaVisuals = getPersonaVisualContext(persona, parsedAngle.cleanAngle); // Passed angle for prop mapping
  
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
  const subjectFocus = getSubjectFocus(project.marketAwareness || MarketAwareness.PROBLEM_AWARE, personaVisuals, parsedAngle, project);

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
