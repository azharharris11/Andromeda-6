
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
    
    switch (format) {
        case CreativeFormat.CHAT_CONVERSATION:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A private text message between friends/partners.
            - POV: Sender (Friend/Partner).
            - TONE: Intimate, casual, slang allowed, lower case.
            - CONTENT: Rewrite "${angle}" as a text message.
              (e.g., Instead of "Cure Back Pain", write "Babe, my back is finally better omg.")
            `;
        case CreativeFormat.TWITTER_REPOST:
        case CreativeFormat.HANDHELD_TWEET:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A viral tweet or hot take.
            - POV: User (First Person "I").
            - TONE: Opinionated, slightly controversial, "Twitter Voice".
            - CONTENT: Rewrite "${angle}" as a short tweet.
              (e.g., "Unpopular opinion: [Angle] is actually true.")
            `;
        case CreativeFormat.PHONE_NOTES:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A personal "To-Do" list or "realization" diary in Apple Notes.
            - POV: User (First Person "I").
            - TONE: Raw, unfiltered, bullet points.
            - CONTENT: Title: "${angle}". Body: 3 short bullet points expanding on it.
            `;
        case CreativeFormat.IG_STORY_TEXT:
        case CreativeFormat.LONG_TEXT:
             return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Instagram Story text overlay (internal monologue).
            - POV: User (First Person "I").
            - TONE: Vulnerable, storytelling, "real talk".
            - CONTENT: A short paragraph (2-3 sentences) reflecting on "${angle}".
              (e.g., "I used to think X, but then I realized Y...")
            `;
        case CreativeFormat.STICKY_NOTE_REALISM:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: A handwritten reminder to self.
            - POV: Self.
            - TONE: Urgent, short, imperative.
            - CONTENT: "Don't forget: ${angle}" or "Rule #1: ${angle}".
            `;
        case CreativeFormat.MEME:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Top/Bottom Text Impact Font Meme.
            - POV: Third Person Relatable ("When you...").
            - TONE: Funny, ironic.
            - CONTENT: Top: "WHEN YOU..." Bottom: "...${angle}".
            `;
        case CreativeFormat.REMINDER_NOTIF:
        case CreativeFormat.DM_NOTIFICATION:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: System Notification or Lock Screen Alert.
            - POV: App/System addressing User ("You").
            - TONE: Urgent, concise.
            - CONTENT: "Reminder: ${angle}" or "New Message: ${angle}".
            `;
        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return `
            TEXT COPY INSTRUCTION:
            - CONTEXT: Social media comments section.
            - POV: Multiple Users.
            - TONE: Excited, validating, curious.
            - CONTENT: 2-3 bubbles. "Does this actually work?", "Yes! I tried it for ${angle} and it's crazy."
            `;
        default:
            return `TEXT COPY INSTRUCTION: Include the text "${angle}" clearly in the image.`;
    }
};

export const generateCreativeImage = async (
  project: ProjectContext,
  personaName: string,
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
     moodPrompt = "Lighting: Unflattering, harsh camera flash, fluorescent overhead lighting, or dim bedroom lighting. No aesthetic color grading. Emotion: Raw, Real, Stressed.";
  }

  // === LOGIC UPGRADE: LEAD MAGNET VISUAL COHERENCE ---
  const isLeadMagnet = /guide|checklist|report|pdf|cheat sheet|blueprint|system|protocol|roadmap|masterclass|training|secrets|list|whitepaper/i.test(angle);
  let leadMagnetInstruction = "";
  if (isLeadMagnet && format !== CreativeFormat.LEAD_MAGNET_3D) {
      leadMagnetInstruction = `IMPORTANT: The subject is holding a printed document, binder, or iPad displaying a report titled "${angle}". Do NOT show a retail product bottle. Show the information asset.`;
  }

  // === IMAGE ENHANCER TIERS ===
  const professionalEnhancers = "Photorealistic, 8k resolution, highly detailed, shot on 35mm lens, depth of field, natural lighting, sharp focus.";
  
  const ugcEnhancers = "Shot on iPhone 15, raw photo, realistic skin texture, authentic amateur photography, slightly messy background, no bokeh, everything in focus (deep depth of field).";

  // NEW: TRASH TIER FOR "UGLY ADS" - HARDER DEGRADATION
  const trashTierEnhancers = `
  CRITICAL: This must look like a terrible photo taken by accident.
  - Add motion blur.
  - Bad framing (cut off tops of heads or awkward angles).
  - Harsh direct flash reflecting off skin (oily skin look).
  - Low resolution texture (JPEG artifacts, slight grain).
  - Background must be messy/cluttered (real life chaos).
  - NOT AESTHETIC. NOT ARTISTIC. NO BOKEH.
  - Looks like a raw photo sent to a group chat.
  `;

  let finalPrompt = "";
  let appliedEnhancer = professionalEnhancers; 
  
  // === LOGIC UPGRADE: STAGE-BASED VISUAL EVOLUTION ===
  let subjectFocus = "";

  switch (project.marketAwareness) {
    case MarketAwareness.UNAWARE:
        subjectFocus = `SUBJECT: A specific, raw life moment showing the PAIN/SYMPTOM. NO PRODUCT BRANDING. Example: A person rubbing their temple in a dark room, or staring at a ceiling at 3AM. Focus on the 'Ritual' of the problem.`;
        break;
    case MarketAwareness.PROBLEM_AWARE:
        subjectFocus = `SUBJECT: The "Graveyard of Failed Attempts". Show the clutter of old solutions that didn't work (e.g. empty bottles, unused equipment, pile of bills). Frustrated mood. NO NEW PRODUCT YET.`;
        break;
    case MarketAwareness.SOLUTION_AWARE:
        subjectFocus = `SUBJECT: A comparative visual or "Mechanism" visualization. Old Way vs New Way. Side-by-side comparison or split screen context. Product can be present as the 'New Way'.`;
        break;
    case MarketAwareness.PRODUCT_AWARE:
    case MarketAwareness.MOST_AWARE:
        subjectFocus = `SUBJECT: The Product Hero Shot. Highlighting the OFFER (e.g. "Buy 2 Get 1"). Show the full bundle stack clearly. Highlighting value and scarcity.`;
        break;
    default:
        subjectFocus = `SUBJECT: High context visual related to ${angle}.`;
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
      appliedEnhancer = trashTierEnhancers;
      
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
          // Use visualScene preferred over technicalPrompt to avoid residual high-end style instructions
          finalPrompt = `A very low quality, cursed image vibe. ${subjectFocus}. Action: ${visualScene}. ${trashTierEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
      } else if (format === CreativeFormat.REDDIT_THREAD) {
          finalPrompt = `
            A screenshot of a Reddit thread (Dark Mode). 
            Title: "${angle}". 
            Subreddit: r/${isHealth ? 'health' : 'AskReddit'}. 
            UI: Upvote buttons, comments. 
            Vibe: Authentic screen capture.
            ${SAFETY_GUIDELINES}
          `;
      } else {
          finalPrompt = `${subjectFocus}. Action: ${visualScene}. ${trashTierEnhancers} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}`;
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
            VISUAL: ${visualScene}. A candid, authentic shot of a person (Persona: ${personaName}) experiencing the moment described in the text.
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
        if (format === CreativeFormat.STORY_QNA) {
            uiOverlay = `Overlay: A standard Instagram 'Question Box' sticker (white rectangle with rounded corners) floating near the head. The text in the box asks: "${angle}?". There is a typed response below it.`;
        } else if (format === CreativeFormat.LONG_TEXT || format === CreativeFormat.STORY_POLL) {
            uiOverlay = `Overlay: A large, massive block of text (long copy) covering the center of the image. The text is white with a translucent black background for readability. ${textCopyInstruction}`;
        } else if (format === CreativeFormat.HANDHELD_TWEET || format === CreativeFormat.TWITTER_REPOST) {
            uiOverlay = `Overlay: A social media post screenshot (Twitter/X style) superimposed on the image. ${textCopyInstruction}`;
        } else if (format === CreativeFormat.PHONE_NOTES) {
            uiOverlay = `A full screen screenshot of the Apple Notes App. ${textCopyInstruction}`;
            environment = ""; 
        } else if (format === CreativeFormat.UGC_MIRROR) {
            uiOverlay = `Overlay: Several 'Instagram Text Bubbles' floating around the subject. ${textCopyInstruction}`;
        }

        if (environment) {
            finalPrompt = `
              A brutally authentic, amateur photo taken from a first-person perspective (POV) or candid angle.
              SCENE ACTION: ${visualScene}.
              Environment: Messy, real-life, unpolished background (e.g., messy bedroom, car dashboard, kitchen counter with clutter).
              Lighting: Bad overhead lighting or harsh flash (Direct Flash Photography).
              Quality: Slightly grainy, iPhone photo quality.
              ${uiOverlay} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.
            `;
        } else {
            finalPrompt = `${uiOverlay} ${appliedEnhancer} ${SAFETY_GUIDELINES}. Photorealistic UI render.`;
        }
      }
  }
  // === AAZAR SHAD'S WINNING FORMATS ===
  else if (format === CreativeFormat.VENN_DIAGRAM) {
      finalPrompt = `A simple, minimalist Venn Diagram graphic on a solid, clean background. Left Circle Label: "Competitors". Right Circle Label: "${project.productName}". The Intersection (Middle) contains the key benefit: "${angle}". Style: Corporate Memphis flat design or clean line art. High contrast text. The goal is to show that ONLY this product has the winning combination. ${appliedEnhancer} ${SAFETY_GUIDELINES}`;
  }
  else if (format === CreativeFormat.PRESS_FEATURE) {
      finalPrompt = `
        A realistic digital screenshot of an online news article.
        Header: A recognized GENERIC media logo (like 'Daily Health', 'TechInsider').
        Headline: "${angle}".
        Image: High-quality candid photo of ${project.productName} embedded in the article body.
        Vibe: It must look like an editorial piece, NOT an advertisement. Trustworthy, "As seen in".
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.TESTIMONIAL_HIGHLIGHT) {
      finalPrompt = `
        A close-up shot of a printed customer review or a digital review card on paper texture.
        Text: "${angle}".
        Key phrases are HIGHLIGHTED in bright neon yellow marker.
        Background: A messy desk or kitchen counter (Native/UGC vibe).
        IMPORTANT: NO Brand Logos overlay. Just the raw text and highlight.
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.OLD_ME_VS_NEW_ME) {
      finalPrompt = `A split-screen comparison image. Left Side labeled "Old Me": Shows the 'old habit' or competitor product being thrown in a trash can, or sitting in a gloomy, messy, grey environment. Right Side labeled "New Me": Shows ${project.productName} in a bright, organized, glowing environment. Emotion: Frustration vs Relief. Text Overlay: "Them" vs "Us" or "Before" vs "After". ${appliedEnhancer} ${culturePrompt} ${SAFETY_GUIDELINES}`;
  }
  else if (format === CreativeFormat.LEAD_MAGNET_3D) {
      finalPrompt = `
        A high-quality 3D render of a physical book or spiral-bound report sitting on a modern wooden desk.
        Title on Cover: "${angle}" (Make text big and legible).
        Cover Design: Bold typography, authoritative colors (Red/Black or Deep Blue/Gold), "Best-Seller" vibe.
        Lighting: Cinematic, golden hour lighting hitting the cover.
        Background: Blurry office background implies a professional wrote this.
        No digital screens. Make it look like a physical, expensive package.
        ${appliedEnhancer} ${SAFETY_GUIDELINES}
      `;
  }
  else if (format === CreativeFormat.MECHANISM_XRAY) {
    if (isHealth) {
         finalPrompt = `
          A scientific or medical illustration style (clean, 3D render or cross-section diagram).
          Subject: Visualizing the "${angle}" (The internal root cause/UMP).
          Detail: Show the biological or mechanical failure point clearly inside the body/object.
          Labeling: Add a red arrow pointing to the problem area.
          Vibe: Educational, shocking discovery, "The Hidden Enemy".
          ${SAFETY_GUIDELINES}
        `;
    } else {
        finalPrompt = `
          A clean, high-contrast schematic diagram or flowchart visualized as a 3D hologram or blueprint.
          Subject: Visualizing the "System Failure" in the user's current approach to ${angle}.
          Visuals: Use icons, connecting lines, and error nodes (red X).
          Style: Tech-minimalist or architectural blueprint. Dark mode aesthetic.
          Metaphor: A broken map, a disconnected circuit, or a maze with no exit.
          NO human anatomy.
          ${SAFETY_GUIDELINES}
        `;
    }
  }

  // === OTHER FORMATS ===
  else if (format === CreativeFormat.STICKY_NOTE_REALISM) {
    finalPrompt = `
        A real yellow post-it sticky note stuck on a surface (monitor or mirror).
        ${textCopyInstruction}
        Sharp focus on the text, realistic paper texture, soft shadows. 
        ${appliedEnhancer} ${moodPrompt}
    `;
  }
  else if (format === CreativeFormat.BENEFIT_POINTERS) {
    finalPrompt = `A high-quality product photography shot of ${project.productName}. Clean background. Sleek, modern graphic lines pointing to 3 key features. Style: "Anatomy Breakdown". ${appliedEnhancer} ${culturePrompt} ${moodPrompt} ${SAFETY_GUIDELINES}.`;
  }
  else if (format === CreativeFormat.US_VS_THEM) {
    finalPrompt = `A split screen comparison image. Left side (Them): Cloudy, sad, messy, labeled "Them". Right side (Us): Bright, happy, organized, labeled "Us". Subject: ${project.productName}. ${appliedEnhancer} ${culturePrompt} ${SAFETY_GUIDELINES}.`;
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
      finalPrompt = `${subjectFocus}. ${technicalPrompt}. ${culturePrompt} ${moodPrompt} ${appliedEnhancer} ${SAFETY_GUIDELINES}. (Note: This is a service, do not show a retail box. Show the person experiencing the result).`;
  }
  else {
      // Default
      finalPrompt = `${subjectFocus}. ${technicalPrompt}. ${culturePrompt} ${moodPrompt} ${appliedEnhancer} ${SAFETY_GUIDELINES}`;
  }

  // Append Metaphor Instruction if active
  if (metaphorInstruction) {
      finalPrompt += metaphorInstruction;
  }

  try {
      // Generate Image
      const response = await ai.models.generateContent({
        model,
        contents: {
           parts: [{ text: finalPrompt }]
        },
        config: {
           imageConfig: { aspectRatio: aspectRatio as any } 
        }
      });
      
      // Extract Image URL (Base64)
      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
              return { 
                  data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, 
                  inputTokens: 0, 
                  outputTokens: 0 
              };
          }
      }
      return { data: null, inputTokens: 0, outputTokens: 0 };
  } catch (e) {
      console.error("Image Generation Failed", e);
      return { data: null, inputTokens: 0, outputTokens: 0 };
  }
};

export const generateCarouselSlides = async (
  project: ProjectContext,
  format: CreativeFormat,
  angle: string,
  visualScene: string,
  visualStyle: string,
  technicalPrompt: string
): Promise<GenResult<string[]>> => {
  const slides: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  const personaName = "Audience"; 

  // Slide 1: Hook
  const r1 = await generateCreativeImage(
      project, personaName, angle, format, 
      visualScene, visualStyle, 
      `${technicalPrompt} -- Slide 1: The Hook/Title Card. Visual Focus: The Problem/Concept.`, 
      "1:1"
  );
  if (r1.data) slides.push(r1.data);
  totalInput += r1.inputTokens;
  totalOutput += r1.outputTokens;

  // Slide 2: Value
  const r2 = await generateCreativeImage(
      project, personaName, angle, format, 
      visualScene, visualStyle, 
      `${technicalPrompt} -- Slide 2: The Mechanism/Process. Visual Focus: How it works.`, 
      "1:1"
  );
  if (r2.data) slides.push(r2.data);
  totalInput += r2.inputTokens;
  totalOutput += r2.outputTokens;

  // Slide 3: CTA
  const r3 = await generateCreativeImage(
      project, personaName, angle, format, 
      visualScene, visualStyle, 
      `${technicalPrompt} -- Slide 3: The Payoff/CTA. Visual Focus: Result/Product.`, 
      "1:1"
  );
  if (r3.data) slides.push(r3.data);
  totalInput += r3.inputTokens;
  totalOutput += r3.outputTokens;

  return {
      data: slides,
      inputTokens: totalInput,
      outputTokens: totalOutput
  };
};
