
export enum NodeType {
  ROOT = 'ROOT',
  PERSONA = 'PERSONA',
  ANGLE = 'ANGLE',
  CREATIVE = 'CREATIVE',
  
  // --- STORY LEAD MEGAPROMPT NODES ---
  STORY_NODE = 'STORY_NODE',         // Single Story
  BIG_IDEA_NODE = 'BIG_IDEA_NODE',   // Single Big Idea
  MECHANISM_NODE = 'MECHANISM_NODE', // Single Mechanism
  HOOK_NODE = 'HOOK_NODE',           // Single Hook
  SALES_LETTER = 'SALES_LETTER',     // Final Output
  HVCO_NODE = 'HVCO_NODE'            // High Value Content Offer (Lead Magnet)
}

export enum CreativeFormat {
  // --- CAROUSEL SPECIALS ---
  CAROUSEL_EDUCATIONAL = 'Educational Carousel',
  CAROUSEL_TESTIMONIAL = 'Testimonial Pile',
  CAROUSEL_PANORAMA = 'Seamless Panorama',
  CAROUSEL_PHOTO_DUMP = 'Photo Dump',
  CAROUSEL_REAL_STORY = 'Real Story (UGC)',

  // --- PATTERN INTERRUPT ---
  BIG_FONT = 'Big Font Text',
  GMAIL_UX = 'Gmail Interface',
  BILLBOARD = 'Billboard',
  UGLY_VISUAL = 'Ugly Visual',
  MS_PAINT = 'MS Paint',
  REDDIT_THREAD = 'Reddit Thread',
  MEME = 'Meme',
  LONG_TEXT = 'Long Text Story',
  CARTOON = 'Cartoon',
  BEFORE_AFTER = 'Before & After',
  WHITEBOARD = 'Whiteboard',
  EDUCATIONAL_RANT = 'Green Screen Rant',
  OLD_ME_VS_NEW_ME = 'Old Me vs New Me', 
  PRESS_FEATURE = 'Press/Media Feature', 
  LEAD_MAGNET_3D = '3D Book/Report Mockup', // NEW: Sabri Style
  MECHANISM_XRAY = 'Mechanism X-Ray', // NEW: Medical/Scientific visualization

  // --- NATIVE / SOCIAL ---
  IG_STORY_TEXT = 'IG Story Text Overlay', // NEW: Contextual Long Copy
  TWITTER_REPOST = 'Twitter Repost',
  PHONE_NOTES = 'iPhone Notes',
  AESTHETIC_MINIMAL = 'Aesthetic Minimal',
  STORY_POLL = 'Story Poll',
  STORY_QNA = 'Story Q&A', 
  REELS_THUMBNAIL = 'Reels Cover',
  DM_NOTIFICATION = 'DM Notification',
  UGC_MIRROR = 'UGC Mirror Selfie',
  HANDHELD_TWEET = 'Handheld Tweet',     
  SOCIAL_COMMENT_STACK = 'Comment Stack', 
  CHAT_CONVERSATION = 'Chat Conversation',
  REMINDER_NOTIF = 'Lockscreen Reminder',

  // --- LOGIC / CONVERSION ---
  US_VS_THEM = 'Us vs Them',
  VENN_DIAGRAM = 'Venn Diagram', 
  TESTIMONIAL_HIGHLIGHT = 'Highlighted Review', 
  GRAPH_CHART = 'Data Visual',
  TIMELINE_JOURNEY = 'Timeline',
  BENEFIT_POINTERS = 'Benefit Anatomy', 
  STICKY_NOTE_REALISM = 'Sticky Note',
  SEARCH_BAR = 'Search Bar',
  ANNOTATED_PRODUCT = 'Annotated Product',
  POV_HANDS = 'POV Hands-on',

  // --- AESTHETIC ---
  COLLAGE_SCRAPBOOK = 'Scrapbook Collage',
  CHECKLIST_TODO = 'Checklist'
}

export enum CampaignStage {
  TESTING = 'TESTING', 
  SCALING = 'SCALING' 
}

export enum FunnelStage {
  TOF = 'Top of Funnel (Cold Awareness)',
  MOF = 'Middle of Funnel (Consideration)',
  BOF = 'Bottom of Funnel (Retargeting/Conversion)'
}

export enum MarketAwareness {
  UNAWARE = 'Unaware (No knowledge of problem)',
  PROBLEM_AWARE = 'Problem Aware (Knows problem, seeks solution)',
  SOLUTION_AWARE = 'Solution Aware (Knows solutions, comparing options)',
  PRODUCT_AWARE = 'Product Aware (Knows you, needs a deal)',
  MOST_AWARE = 'Most Aware (Ready to buy, needs urgency)'
}

export enum CopyFramework {
  PAS = 'PAS (Problem, Agitation, Solution)',
  AIDA = 'AIDA (Attention, Interest, Desire, Action)',
  BAB = 'BAB (Before, After, Bridge)',
  FAB = 'FAB (Features, Advantages, Benefits)',
  STORY = 'Storytelling / Hero\'s Journey'
}

export enum TestingTier {
  TIER_1 = 'TIER 1: Concept Isolation (High Budget)',
  TIER_2 = 'TIER 2: Persona Isolation (Mid Budget)',
  TIER_3 = 'TIER 3: Sprint Isolation (Low Budget)'
}

export type ViewMode = 'LAB' | 'VAULT';

export interface PredictionMetrics {
  score: number; // 0-100
  hookStrength: 'Weak' | 'Moderate' | 'Strong' | 'Viral';
  clarity: 'Confusing' | 'Clear' | 'Crystal Clear';
  emotionalResonance: 'Flat' | 'Engaging' | 'Visceral';
  reasoning: string; 
  sabriAudit?: string; 
}

export interface MafiaOffer {
    headline: string;
    valueStack: string[];
    riskReversal: string;
    scarcity: string;
}

export interface AdCopy {
  primaryText: string;
  headline: string;
  cta: string;
  complianceNotes?: string; 
}

export interface StoryOption {
  id: string;
  title: string;
  narrative: string; 
  emotionalTheme: string; 
}

export interface BigIdeaOption {
  id: string;
  headline: string;
  concept: string; 
  targetBelief: string; 
}

export interface MechanismOption {
  id: string;
  ump: string; 
  ums: string; 
  scientificPseudo: string; 
}

export interface HVCOOption {
  title: string;
  format: string;
  hook: string;
}

export interface NodeData {
  id: string;
  type: NodeType;
  parentId?: string | null;
  
  title: string;
  description?: string;
  meta?: Record<string, any>;
  
  storyData?: StoryOption;
  bigIdeaData?: BigIdeaOption;
  mechanismData?: MechanismOption;
  hookData?: string;
  hvcoData?: HVCOOption;
  mafiaOffer?: MafiaOffer;
  
  // Creative specific
  imageUrl?: string; 
  videoUrl?: string; 
  carouselImages?: string[]; 
  format?: CreativeFormat;
  adCopy?: AdCopy; 
  fullSalesLetter?: string; 
  
  audioScript?: string;
  audioBase64?: string; 
  
  isLoading?: boolean;
  stage?: CampaignStage; 
  isGhost?: boolean; 
  
  prediction?: PredictionMetrics;
  
  // Andromeda Logic
  testingTier?: TestingTier; 
  variableIsolated?: string; 
  congruenceRationale?: string; 
  
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;

  x: number;
  y: number;
  
  isWinning?: boolean;
  postId?: string;
  aiInsight?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface ProjectContext {
  productName: string;
  productDescription: string;
  targetAudience: string;
  landingPageUrl?: string; 
  productReferenceImage?: string; 
  
  targetCountry?: string; 
  brandVoice?: string;
  brandVoiceOptions?: string[]; 
  
  brandCopyExamples?: string; 

  funnelStage?: FunnelStage;
  offer?: string;
  offerOptions?: string[]; 
  marketAwareness?: MarketAwareness;
  copyFramework?: CopyFramework;
}

export interface CreativeConcept {
  visualScene: string;   
  visualStyle: string;   
  technicalPrompt: string; 
  copyAngle: string;     
  rationale: string;
  congruenceRationale: string; 
  hookComponent?: string; 
  bodyComponent?: string; 
  ctaComponent?: string; 
}

export interface GenResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
}
