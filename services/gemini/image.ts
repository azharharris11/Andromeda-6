
import { ProjectContext, CreativeFormat, GenResult, MarketAwareness } from "../../types";
import { ai } from "./client";

const SAFETY_GUIDELINES = `
  CRITICAL AD POLICY COMPLIANCE:
  1. NO Nudity or Sexual content.
  2. NO Medical Gore or overly graphic body fluids.
  3. NO "Before/After" split screens that show unrealistic body transformations.
  4. NO Glitchy text unless specified.
  5. If humans are shown, they must look realistic with normal anatomy.
`;

// Helper to generate context-aware text instructions based on format
const generateTextInstruction = (format: CreativeFormat, angle: string, project: ProjectContext): string => {
    const productName = project.productName;
    
    // CLEAN THE ANGLE: Remove the [STRATEGY CONTEXT: ...] part for text generation
    const cleanAngle = angle.split('[STRATEGY CONTEXT:')[0].trim();

    // RULE: Detect if angle sounds "Marketing-heavy"
    const isMarketingSpeak = /ritual|system|protocol|method|secret|mistake|warning|solution|cure|trick|hack/i.test(cleanAngle);
    const adaptationInstruction = isMarketingSpeak 
        ? `CRITICAL: The input "${cleanAngle}" is a Marketing Hook. You MUST translate it into casual human speech. Do NOT use the marketing terms.` 
        : `Keep the core message of "${cleanAngle}".`;

    switch (format) {
        case CreativeFormat.CHAT_CONVERSATION:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A private text message between real friends/partners.
            - POV: Sender (Friend/Partner).
            - TONE: Intimate, casual, typo-prone, lower case. STRICTLY "ANTI-AD".
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Write a text message that implies the RESULT of the hook without sounding like a salesperson.
            - BAD: "Try this 3-step method."
            - GOOD: "omg i finally slept for 8 hours straight last night."
            - ${adaptationInstruction}
            `;
        case CreativeFormat.TWITTER_REPOST:
        case CreativeFormat.HANDHELD_TWEET:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A viral tweet from a real person (not a brand account).
            - POV: User (First Person "I").
            - TONE: Opinionated, slightly controversial, "Twitter Voice".
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Turn this hook into a "Hot Take" or a personal realization.
            - BAD: "Stop eating sugar to lose weight."
            - GOOD: "Whatever you do, just stop eating sugar. Trust me."
            `;
        case CreativeFormat.PHONE_NOTES:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A personal "To-Do" list or "Journal" entry in Apple Notes.
            - POV: User (First Person "I").
            - TONE: Raw, unfiltered, bullet points.
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Write 3 short bullet points that a person would write to REMIND THEMSELVES of this hook.
            - ${adaptationInstruction}
            `;
        case CreativeFormat.IG_STORY_TEXT:
        case CreativeFormat.LONG_TEXT:
             return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Instagram Story text overlay (internal monologue).
            - POV: User (First Person "I").
            - TONE: Vulnerable, storytelling, "real talk".
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Write a short sentence reflecting on how this hook changed their life.
            - CONSTRAINT: It must act as a "Teaser" for the link sticker.
            `;
        case CreativeFormat.STICKY_NOTE_REALISM:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Handwritten sticky note on a mirror or laptop.
            - POV: Self-reminder.
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Summarize the hook into 3-4 handwritten words. Imperative mood.
            - BAD: "Stop Destroying Dopamine."
            - GOOD: "NO. MORE. SCROLLING."
            `;
        case CreativeFormat.REMINDER_NOTIF:
        case CreativeFormat.DM_NOTIFICATION:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Smartphone Lock Screen Notification.
            - POV: System App or 'Best Friend'.
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Translate this hook into a SHORT, URGENT REMINDER or QUESTION. Do NOT use the product name.
            - BAD: "Reminder: Use the Focus Mask."
            - GOOD: "Reminder: Put your phone down."
            - GOOD: "New Message: You promised to sleep early."
            `;
        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Instagram/TikTok Comments Section.
            - POV: Random Users talking to each other.
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Write 2 comments. User A asks a skeptical question. User B replies with a PERSONAL RESULT based on the hook.
            - RULE: Replace technical terms with "my skin", "my back", "my wallet".
            - Example: "Did this actually fix your acne?" -> "Yes, my skin is finally clear."
            `;
        case CreativeFormat.MEME:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Top/Bottom Text Impact Font Meme.
            - POV: Third Person Relatable ("When you...").
            - TONE: Funny, ironic.
            - INPUT HOOK: "${cleanAngle}"
            - TASK: Write a funny/ironic situation related to the PROBLEM in the hook.
            - CONSTRAINT: Do NOT use the product name. Focus on the feeling of relief or the absurdity of the old way.
            - BAD: "WHEN YOU... Use the Sleep Mask."
            - GOOD: "WHEN YOU... Finally wake up without neck pain."
            `;
        default:
            return `TEXT COPY INSTRUCTION: Include the text "${cleanAngle}" clearly in the image. Keep it SHORT (max 5 words).`;
    }
};

export const generateCreativeImage = async (
  project: ProjectContext,
  persona: any, // Accepts full persona object now
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
  const lowerDesc = project.productDescription.toLowerCase();
  
  const isService = lowerDesc.includes("studio") || lowerDesc.includes("service") || lowerDesc.includes("jasa") || lowerDesc.includes("photography") || lowerDesc.includes("clinic") || lowerDesc.includes("consultant") || lowerDesc.includes("agency");
  
  // LOGIC: Health vs Abstract Category Detection
  const isHealth = /pain|body|skin|weight|muscle|joint|gut|brain|health|doctor|pill|supplement|acne|wrinkle|fat/i.test(project.productDescription + angle);

  // DYNAMIC CULTURAL INJECTION
  const culturePrompt = `
    Target Country: ${country}.
    Aesthetics: Adapt visual style, models, and environment to ${country}. 
    If SE Asia -> Use Asian models, scooters, tropical greenery, warmer lighting.
  `;

  // 1. UGLY / PATTERN INTERRUPT LOGIC (Defined early to affect moodPrompt)
  const isUglyFormat = 
    format === CreativeFormat.UGLY_VISUAL ||
    format === CreativeFormat.MS_PAINT ||
    format === CreativeFormat.REDDIT_THREAD ||
    format === CreativeFormat.MEME;

  // === LOGIC UPGRADE: SENTIMENT AWARENESS ---
  const isNegativeAngle = /stop|avoid|warning|danger|don't|mistake|worst|kill|never/i.test(angle);
  let moodPrompt = "Lighting: Natural, inviting, high energy. Emotion: Positive, Solution-oriented.";
  
  if (isNegativeAngle) {
      moodPrompt = "Lighting: High contrast, dramatic shadows, moody atmosphere, perhaps a subtle red tint. Emotion: Serious, Urgent, Warning vibe. Subject should NOT be smiling. Show concern or frustration.";
  }

  // FORCE OVERRIDE MOOD FOR UGLY FORMATS (Resolves Conflict)
  if (isUglyFormat) {
     // FIXED: Don't force stress. Keep it raw but neutral/relatable unless the angle specifically demands negativity.
     moodPrompt = "Lighting: Regular indoor lighting (not professional). No color grading. Emotion: Authentic, relatable, candid.";
  }

  // === LOGIC UPGRADE: LEAD MAGNET VISUAL COHERENCE ---
  const isLeadMagnet = /guide|checklist|report|pdf|cheat sheet|blueprint|system|protocol|roadmap|masterclass|training|secrets|list|whitepaper/i.test(angle);
  let leadMagnetInstruction = "";
  if (isLeadMagnet && format !== CreativeFormat.LEAD_MAGNET_3D) {
      leadMagnetInstruction = `IMPORTANT: The subject is holding a printed document, binder, or iPad displaying a report titled "${angle.split('[')[0]}". Do NOT show a retail product bottle. Show the information asset.`;
  }

  // === IMAGE ENHANCER TIERS ===
  const professionalEnhancers = "Photorealistic, 8k resolution, highly detailed, shot on 35mm lens, depth of field, natural lighting, sharp focus.";
  
  const ugcEnhancers = "Shot on iPhone 15, raw photo, realistic skin texture, authentic amateur photography, slightly messy background, no bokeh, everything in focus (deep depth of field).";

  // NEW: AUTHENTIC UGC TIER (Replaces "Trash Tier") - "Thoughtful but not pretty"
  const authenticUgcEnhancers = `
  STYLE: Authentic User Generated Content (UGC).
  - Shot on iPhone, slightly wide angle.
  - Lighting: Natural indoor lighting or standard room light (No studio lights).
  - Focus: Sharp and clear focus on the subject/text (NO motion blur).
  - Composition: Centered and clear, easy to understand at a glance.
  - Vibe: Looks like a regular person posted this on their story.
  - NOT aesthetic, but NOT broken. Just real.
  `;

  let finalPrompt = "";
  let appliedEnhancer = professionalEnhancers; 
  
  // === LOGIC UPGRADE: STAGE-BASED VISUAL EVOLUTION & PERSONA INJECTION ===
  
  // Extract Persona Details for Consistency
  // If persona is just a name string (legacy), handle it. If object, use profile.
  const personaIdentity = typeof persona === 'string' ? persona : (persona.profile || persona.name || "User");
  const personaContext = `SUBJECT IDENTITY: ${personaIdentity}. (Maintain consistency with this identity).`;
  
  let subjectFocus = "";

  switch (project.marketAwareness) {
    case MarketAwareness.UNAWARE:
        subjectFocus = `${personaContext}. SCENE: A specific, raw life moment showing the PAIN/SYMPTOM. NO PRODUCT BRANDING. Example: A person rubbing their temple in a dark room, or staring at a ceiling at 3AM. Focus on the 'Ritual' of the problem.`;
        break;
    case MarketAwareness.PROBLEM_AWARE:
        subjectFocus = `${personaContext}. SCENE: The "Graveyard of Failed Attempts". Show the clutter of old solutions that didn't work (e.g. empty bottles, unused equipment, pile of bills). Frustrated mood. NO NEW PRODUCT YET.`;
        break;
    case MarketAwareness.SOLUTION_AWARE:
        subjectFocus = `${personaContext}. SCENE: A comparative visual or "Mechanism" visualization. Old Way vs New Way. Side-by-side comparison or split screen context. Product can be present as the 'New Way'.`;
        break;
    case MarketAwareness.PRODUCT_AWARE:
    case MarketAwareness.MOST_AWARE:
        subjectFocus = `SUBJECT: The Product Hero Shot. Highlighting the OFFER (e.g. "Buy 2 Get 1"). Show the full bundle stack clearly. Highlighting value and scarcity.`;
        break;
    default:
        subjectFocus = `${personaContext}. SUBJECT: High context visual related to ${angle}.`;
  }
    
  // 2. NATIVE STORY LOGIC
  const isNativeStory = 
    format === CreativeFormat.STORY_QNA || 
    format === CreativeFormat.LONG_TEXT || 
    format === CreativeFormat.UGC_MIRROR ||
    format === CreativeFormat.PHONE_NOTES ||
    format === CreativeFormat.TWITTER_REPOST ||
    format === CreativeFormat.SOCIAL_COMMENT_STACK ||
    format === CreativeFormat.HANDHELD_TWEET ||
    format === CreativeFormat.STORY_POLL ||
    format === CreativeFormat.EDUCATIONAL_RANT ||
    format === CreativeFormat.CHAT_CONVERSATION ||
    format === CreativeFormat.IG_STORY_TEXT ||
    format === CreativeFormat.DM_NOTIFICATION ||
    format === CreativeFormat.REMINDER_NOTIF;

  // === METAPHOR MODE ===
  const isMetaphor = /battery|engine|fuel|prison|trap|key|lock|magnet|chain|anchor|leaking|drain|shield|armor|bridge|monster|shadow|cliff|mountain|broken|repair/i.test(angle);
  let metaphorInstruction = "";
  
  if (isMetaphor && !isUglyFormat && !isNativeStory && format !== CreativeFormat.LEAD_MAGNET_3D) {
      metaphorInstruction = ` 
        STYLE: Surrealist/Editorial Illustration or High-Concept Photography. 
        Depict the concept of "${angle}" as a VISUAL METAPHOR. 
        Do not show a literal human unless interacting with the metaphor. Show the object/symbol representing the struggle.
      `;
  }

  // === CONTEXTUAL COPY INSTRUCTION ===
  // This generates the specific text prompt based on format POV
  const textCopyInstruction = generateTextInstruction(format, angle, project);

  // === LOGIC BRANCHING ===

  if (isUglyFormat) {
      appliedEnhancer = authenticUgcEnhancers;
      
      if (format === CreativeFormat.MS_PAINT) {
          finalPrompt = `A crude, badly drawn MS Paint illustration related to ${project.productName}. Stick figures, comic sans text, bright primary colors, looks like a child or amateur drew it. Authentically bad internet meme style. ${SAFETY_GUIDELINES}`;
      } else if (format === CreativeFormat.MEME) {
          finalPrompt = `
              A viral internet meme format.
              Image content: ${visualScene}.
              ${textCopyInstruction}
              Ensure the text is large, legible Impact Font (White with Black Outline), and perfectly spelled.
              ${SAFETY_GUIDELINES}
          `;
      } else if (format === CreativeFormat.UGLY_VISUAL) {
          finalPrompt = `A visually raw, unpolished image. ${subjectFocus}. Action: ${visualScene}. ${authenticUgcEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
      } else if (format === CreativeFormat.REDDIT_THREAD) {
          finalPrompt = `
            A screenshot of a Reddit thread (Dark Mode). 
            Title: "${angle.split('[')[0]}". 
            Subreddit: r/${isHealth ? 'health' : 'AskReddit'}. 
            UI: Upvote buttons, comments. 
            Vibe: Authentic screen capture.
            ${SAFETY_GUIDELINES}
          `;
      } else {
          finalPrompt = `${subjectFocus}. Action: ${visualScene}. ${authenticUgcEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
      }
  }
  else if (isNativeStory) {
      appliedEnhancer = ugcEnhancers; 

      if (format === CreativeFormat.EDUCATIONAL_RANT) {
          // Green Screen Logic
          finalPrompt = `A person engaging with the camera, 'Green Screen' effect style. Background is a screenshot of a news article or a graph related to ${angle}. The person looks passionate/angry (ranting). Native TikTok/Reels aesthetic. UI overlay: "Stop doing this!". ${ugcEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
      } else if (format === CreativeFormat.CHAT_CONVERSATION) {
          const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");
          const appStyle = isIndo ? "WhatsApp UI (Green bubbles)" : "iMessage UI (Blue bubbles)";
          const sender = isIndo ? "Sayang" : "Crush";

          finalPrompt = `
            A close-up photo of a hand holding a smartphone displaying a chat conversation.
            App Style: ${appStyle}.
            Sender Name: "${sender}".
            ${textCopyInstruction}
            Background: Blurry motion (walking on street or inside car).
            Lighting: Screen glow on thumb.
            Make the UI look 100% authentic to the app.
            ${appliedEnhancer} ${SAFETY_GUIDELINES}
          `;
      } else if (format === CreativeFormat.IG_STORY_TEXT) {
          finalPrompt = `
            A realistic vertical photo formatted for Instagram Story.
            VISUAL: ${visualScene}. A candid, authentic shot of ${personaIdentity} experiencing the moment described in the text.
            Environment: Authentic, real-life background (e.g. car interior, living room, looking out a window).
            NEGATIVE SPACE: Ensure there is ample empty space (sky, wall, or ceiling) for text placement.
            OVERLAY INSTRUCTION:
            Superimpose a realistic "Instagram Text Bubble" or a "White Text Block with Rounded Corners".
            ${textCopyInstruction}
            Make the text sharp, legible, and central to the composition.
            ${culturePrompt} ${moodPrompt} ${ugcEnhancers} ${SAFETY_GUIDELINES}
          `;
      } else if (format === CreativeFormat.SOCIAL_COMMENT_STACK) {
          finalPrompt = `
            A screenshot of social media comments overlaid on a blurred background.
            ${textCopyInstruction}
            UI: Profile pictures, likes, reply buttons.
            Vibe: High engagement, social proof.
            ${SAFETY_GUIDELINES}
          `;
      } else if (format === CreativeFormat.REMINDER_NOTIF || format === CreativeFormat.DM_NOTIFICATION) {
           finalPrompt = `
            A close-up of a smartphone lock screen.
            ${textCopyInstruction}
            Background: Wallpaper is blurry personal photo.
            Lighting: Screen glow.
            UI: Authentic iOS/Android notification banner.
            ${SAFETY_GUIDELINES}
          `;
      } else {
        // Generic Story/UGC Logic
        // 1. Determine "Candid Environment"
        const randomEnv = Math.random();
        let environment = "inside a modern car during daytime, sunlight hitting face (car selfie vibe)";
        if (randomEnv > 0.6) environment = "leaning against a window with natural light, contemplative mood";
        if (randomEnv > 0.85) environment = "mirror selfie in a clean, modern aesthetic room";

        // 2. Determine "UI Overlay Style"
        let uiOverlay = "";
        const cleanAngle = angle.split('[')[0].trim();

        if (format === CreativeFormat.STORY_QNA) {
            uiOverlay = `Overlay: A standard Instagram 'Question Box' sticker (white rectangle with rounded corners) floating near the head. The text in the box asks: "${cleanAngle}?". There is a typed response below it.`;
        } else if (format === CreativeFormat.LONG_TEXT || format === CreativeFormat.STORY_POLL) {
            uiOverlay = `Overlay: A large, massive block of text (long copy) covering the center of the image. It looks like a long Instagram story caption. The text is white with a translucent black background for readability.`;
        } else if (format === CreativeFormat.HANDHELD_TWEET || format === CreativeFormat.TWITTER_REPOST) {
            uiOverlay = `Overlay: A social media post screenshot (Twitter/X style) superimposed on the image. The text on the post is sharp and reads: "${cleanAngle}".`;
        } else if (format === CreativeFormat.PHONE_NOTES) {
            uiOverlay = `A full screen screenshot of the Apple Notes App. Title: "${cleanAngle}". Below is a typed list related to ${project.productName}.`;
            environment = ""; 
        } else if (format === CreativeFormat.UGC_MIRROR) {
            uiOverlay = `Overlay: Several 'Instagram Text Bubbles' floating around the subject. Text in bubbles: "${cleanAngle}".`;
        }

        if (environment) {
            // Enhanced "Candid Realism" Prompt
            finalPrompt = `
              A brutally authentic, amateur photo taken from a first-person perspective (POV) or candid angle.
              SCENE ACTION (Strictly follow this): ${visualScene}.
              Environment: Messy, real-life, unpolished background (e.g., messy bedroom, car dashboard, kitchen counter with clutter).
              Lighting: Bad overhead lighting or harsh flash (Direct Flash Photography).
              Quality: Slightly grainy, iPhone photo quality.
              ${uiOverlay} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}. Make it look like a real Instagram Story.
            `;
        } else {
            finalPrompt = `${uiOverlay} ${appliedEnhancer} ${SAFETY_GUIDELINES}. Photorealistic UI render.`;
        }
      }
  }
  // === AAZAR SHAD'S WINNING FORMATS ===
  else if (format === CreativeFormat.VENN_DIAGRAM) {
      finalPrompt = `A simple, minimalist Venn Diagram graphic on a solid, clean background. Left Circle Label: "Competitors" or "Others". Right Circle Label: "${project.productName}". The Intersection (Middle) contains a 1-2 word RESULT of "${angle.split('[')[0]}" (e.g. "Instant Relief", "8h Sleep"). DO NOT write the mechanism name. Write the END STATE. Style: Corporate Memphis flat design or clean line art. High contrast text. The goal is to show that ONLY this product has the winning combination. ${appliedEnhancer} ${SAFETY_GUIDELINES}`;
  }
  else if (format === CreativeFormat.PRESS_FEATURE) {
      finalPrompt = `
        A realistic digital screenshot of an online news article.
        Header: A recognized GENERIC media logo (like 'Daily Health', 'TechInsider' - DO NOT use the product logo in the header).
        Headline: Write a curiosity-inducing news headline about "${angle.split('[')[0]}". (e.g., "The simple trick doctors hate", "Why this mask is going viral"). Do not just put the feature name. Make it sound like 'TechCrunch' or 'Vogue'.
        Image: High-quality candid photo of ${project.productName} embedded in the article body.
        Vibe: It must look like an editorial piece, NOT an advertisement. Trustworthy, "As seen in".
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.TESTIMONIAL_HIGHLIGHT) {
      finalPrompt = `
        A close-up shot of a printed customer review or a digital review card on paper texture.
        Text: Write a short, enthusiastic customer review sentence based on "${angle.split('[')[0]}". (e.g., "I can finally sleep!", "Best investment ever", "My husband stopped snoring").
        Key phrases are HIGHLIGHTED in bright neon yellow marker.
        Background: A messy desk or kitchen counter (Native/UGC vibe).
        IMPORTANT: NO Brand Logos overlay. Just the raw text and highlight.
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.OLD_ME_VS_NEW_ME) {
      finalPrompt = `A split-screen comparison image. Left Side labeled "Old Me": Shows the 'old habit' or competitor product being thrown in a trash can, or sitting in a gloomy, messy, grey environment. Right Side labeled "New Me": Shows ${project.productName} in a bright, organized, glowing environment. Emotion: Frustration vs Relief. Text Overlay: "Them" vs "Us" or "Before" vs "After". ${appliedEnhancer} ${culturePrompt} ${SAFETY_GUIDELINES}`;
  }
  // NEW: SABRI SUBY HVCO VISUAL
  else if (format === CreativeFormat.LEAD_MAGNET_3D) {
      finalPrompt = `
        A high-quality 3D render of a physical book or spiral-bound report sitting on a modern wooden desk.
        Title on Cover: "${angle.split('[')[0]}" (Make text big and legible).
        Cover Design: Bold typography, authoritative colors (Red/Black or Deep Blue/Gold), "Best-Seller" vibe.
        Lighting: Cinematic, golden hour lighting hitting the cover.
        Background: Blurry office background implies a professional wrote this.
        No digital screens. Make it look like a physical, expensive package.
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  // NEW: MECHANISM X-RAY VISUAL
  else if (format === CreativeFormat.MECHANISM_XRAY) {
    finalPrompt = `
      A scientific or medical illustration style (clean, 3D render or cross-section diagram).
      Subject: Visualizing the "${angle.split('[')[0]}" (The internal root cause/UMP).
      Detail: Show the biological or mechanical failure point clearly inside the body/object.
      Labeling: Add a red arrow pointing to the problem area.
      Vibe: Educational, shocking discovery, "The Hidden Enemy".
      ${SAFETY_GUIDELINES}
    `;
  }

  // === OTHER FORMATS ===
  else if (format === CreativeFormat.STICKY_NOTE_REALISM) {
    finalPrompt = `A real yellow post-it sticky note stuck on a surface. Handwritten black marker text on the note says: "${angle.split('[')[0]}". Sharp focus on the text, realistic paper texture, soft shadows. ${appliedEnhancer} ${moodPrompt}`;
  }
  else if (format === CreativeFormat.BENEFIT_POINTERS) {
    finalPrompt = `A high-quality product photography shot of ${project.productName}. Clean background. Sleek, modern graphic lines pointing to 3 key features. Style: "Anatomy Breakdown". ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
  }
  else if (format === CreativeFormat.US_VS_THEM) {
    const cleanAngle = angle.split('[')[0].trim();
    finalPrompt = `
      A split screen comparison image. 
      Left side (Them): Visualize the SPECIFIC PAIN/STRUGGLE of "${cleanAngle}". Use gloomy lighting, chaotic composition, showing the old way failing. Labeled "Them". 
      Right side (Us): Visualize the SPECIFIC RELIEF/RESULT of "${cleanAngle}". Use bright lighting, organized composition, showing ${project.productName} working. Labeled "Us". 
      Subject: ${project.productName}. ${appliedEnhancer} ${culturePrompt} ${SAFETY_GUIDELINES}.
    `;
  }
  else if (
      format === CreativeFormat.CAROUSEL_REAL_STORY || 
      format === CreativeFormat.CAROUSEL_EDUCATIONAL || 
      format === CreativeFormat.CAROUSEL_TESTIMONIAL
  ) {
      if (format === CreativeFormat.CAROUSEL_REAL_STORY) {
          appliedEnhancer = ugcEnhancers;
      }
      finalPrompt = `${technicalPrompt}. ${leadMagnetInstruction} ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
  }
  else if (isService) {
      finalPrompt = `${subjectFocus} ${technicalPrompt}. ${culturePrompt} ${moodPrompt} ${appliedEnhancer} ${SAFETY_GUIDELINES}. (Note: This is a service, do not show a retail box. Show the person experiencing the result).`;
  }
  else {
     if (technicalPrompt && technicalPrompt.length > 20) {
         finalPrompt = `${subjectFocus} ${technicalPrompt}. ${leadMagnetInstruction} ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
     } else {
         finalPrompt = `${subjectFocus} ${visualScene}. Style: ${visualStyle || 'Natural'}. ${leadMagnetInstruction} ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
     }
  }

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
