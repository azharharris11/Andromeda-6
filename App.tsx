
import React, { useState, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import Canvas, { CanvasHandle } from './components/Canvas';
import Inspector from './components/Inspector';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConfigModal from './components/ConfigModal';
import FormatSelector from './components/FormatSelector';
import { NodeType, NodeData, Edge, ProjectContext, CreativeFormat, CampaignStage, ViewMode, FunnelStage, MarketAwareness, CopyFramework, LanguageRegister } from './types';
import { generatePersonas, generateAngles, generateCreativeImage, generateAdCopy, generateCarouselSlides, generateCreativeConcept, checkAdCompliance, analyzeLandingPageContext, analyzeImageContext, generateStoryResearch, generateBigIdeas, generateMechanisms, generateHooks, generateSalesLetter, predictCreativePerformance, generateHVCOIdeas } from './services/geminiService';

const INITIAL_PROJECT: ProjectContext = {
  productName: "Zenith Focus Gummies",
  productDescription: "Nootropic gummies for focus and memory without the caffeine crash.",
  targetAudience: "Students, Programmers, and Creatives.",
  targetCountry: "USA",
  brandVoice: "Witty, Smart, but Approachable",
  brandVoiceOptions: ["Witty, Smart, but Approachable", "Professional & Scientific", "Gen-Z & Meme-Friendly", "Minimalist & Zen", "High-Energy & Aggressive"],
  funnelStage: FunnelStage.TOF,
  marketAwareness: MarketAwareness.PROBLEM_AWARE,
  copyFramework: CopyFramework.PAS,
  offer: "Buy 2 Get 1 Free",
  offerOptions: ["Buy 2 Get 1 Free", "50% Off First Order", "Free Shipping Worldwide", "Bundle & Save 30%", "$10 Welcome Coupon"],
  languageRegister: LanguageRegister.CASUAL
};

// --- SABRI SUBY'S 3 OCEANS STRATEGY ---
const STRATEGIC_GROUPS: Record<string, CreativeFormat[]> = {
  "🔵 Pattern Interrupt (Stop the Scroll)": [
    CreativeFormat.MEME,              
    CreativeFormat.UGLY_VISUAL,       
    CreativeFormat.REDDIT_THREAD,     
    CreativeFormat.TWITTER_REPOST, 
    CreativeFormat.OLD_ME_VS_NEW_ME, 
    CreativeFormat.PRESS_FEATURE,    
    CreativeFormat.MS_PAINT,          
    CreativeFormat.HANDHELD_TWEET,
    CreativeFormat.EDUCATIONAL_RANT 
  ],

  "🟠 Education & Social Proof (Build Trust)": [
    CreativeFormat.IG_STORY_TEXT, // NEW: Native Story
    CreativeFormat.VENN_DIAGRAM,         
    CreativeFormat.TESTIMONIAL_HIGHLIGHT,
    CreativeFormat.LEAD_MAGNET_3D, // NEW: Sabri HVCO
    CreativeFormat.MECHANISM_XRAY, // NEW: Scientific/Medical
    CreativeFormat.CAROUSEL_EDUCATIONAL, 
    CreativeFormat.CAROUSEL_REAL_STORY,  
    CreativeFormat.US_VS_THEM,           
    CreativeFormat.GRAPH_CHART,          
    CreativeFormat.STORY_QNA,            
    CreativeFormat.UGC_MIRROR,
    CreativeFormat.BEFORE_AFTER
  ],

  "🔴 High Conversion (Kill the Objection)": [
    CreativeFormat.BENEFIT_POINTERS,     
    CreativeFormat.STICKY_NOTE_REALISM,  
    CreativeFormat.REMINDER_NOTIF,       
    CreativeFormat.DM_NOTIFICATION,      
    CreativeFormat.SEARCH_BAR,           
    CreativeFormat.ANNOTATED_PRODUCT,
    CreativeFormat.CAROUSEL_TESTIMONIAL
  ]
};

const App = () => {
  const [project, setProject] = useState<ProjectContext>(INITIAL_PROJECT);
  const [activeView, setActiveView] = useState<ViewMode>('LAB');
  
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: 'root',
      type: NodeType.ROOT,
      title: INITIAL_PROJECT.productName,
      description: INITIAL_PROJECT.productDescription,
      x: 0,
      y: 0,
      stage: CampaignStage.TESTING
    }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [targetNodeIdForFormat, setTargetNodeIdForFormat] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<CreativeFormat>>(new Set());
  
  const canvasRef = useRef<CanvasHandle>(null);

  const labNodes = nodes.filter(n => n.stage === CampaignStage.TESTING || n.isGhost);
  const labEdges = edges.filter(e => {
      const source = nodes.find(n => n.id === e.source);
      const target = nodes.find(n => n.id === e.target);
      return (source?.stage === CampaignStage.TESTING || source?.isGhost) && 
             (target?.stage === CampaignStage.TESTING || target?.isGhost);
  });
  const vaultNodes = nodes.filter(n => n.stage === CampaignStage.SCALING);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const addNode = (node: NodeData) => { setNodes(prev => [...prev, node]); };
  const addEdge = (source: string, target: string) => { setEdges(prev => [...prev, { id: `${source}-${target}`, source, target }]); };
  const updateNode = (id: string, updates: Partial<NodeData>) => { setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n)); };
  
  const handleNodeMove = (id: string, x: number, y: number) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleProjectUpdate = (updates: Partial<ProjectContext>) => {
      setProject(prev => ({...prev, ...updates}));
  };

  const handleContextAnalyzed = (context: ProjectContext) => {
      setProject(prev => ({...prev, ...context}));
      setNodes(prev => prev.map(n => n.type === NodeType.ROOT ? {
          ...n,
          title: context.productName,
          description: context.productDescription
      } : n));
  };

  const handleRegenerateNode = async (nodeId: string, aspectRatio: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    updateNode(nodeId, { isLoading: true, description: "Regenerating visual..." });

    try {
        const persona = node.meta || { name: "User" }; 
        const angle = node.meta?.angle || node.title;
        const visualScene = node.meta?.visualScene || node.meta?.styleContext || ""; 
        const visualStyle = node.meta?.visualStyle || "";
        const technicalPrompt = node.meta?.technicalPrompt || "";
        const format = node.format as CreativeFormat;

        const imgResult = await generateCreativeImage(
            project, persona, angle, format, 
            visualScene, visualStyle, technicalPrompt, 
            aspectRatio
        );
        
        if (imgResult.data) {
            updateNode(nodeId, { 
                imageUrl: imgResult.data,
                isLoading: false,
                description: node.adCopy?.primaryText.slice(0, 100) + "..." || node.description
            });
        } else {
            updateNode(nodeId, { isLoading: false, description: "Regeneration failed." });
        }
    } catch (e) {
        console.error("Regeneration failed", e);
        updateNode(nodeId, { isLoading: false, description: "Error during regeneration" });
    }
  };

  const executeGeneration = async (parentNodeId: string, formats: CreativeFormat[]) => {
    const parentNode = nodes.find(n => n.id === parentNodeId);
    if (!parentNode) return;

    updateNode(parentNodeId, { isLoading: true });

    // --- MAFIA OFFER INJECTION ---
    let offerContext = project.offer;
    if (parentNode.mafiaOffer) {
        const mo = parentNode.mafiaOffer;
        offerContext = `MAFIA OFFER HEADLINE: "${mo.headline}". \nVALUE STACK: ${mo.valueStack.join(' + ')}. \nRISK REVERSAL (GUARANTEE): ${mo.riskReversal}. \nSCARCITY: ${mo.scarcity}`;
    }
    const projectContextForGen = { ...project, offer: offerContext };

    const HORIZONTAL_GAP = 550; 
    const COL_SPACING = 350;    
    const ROW_SPACING = 400;    
    const COLUMNS = 3;

    const totalRows = Math.ceil(formats.length / COLUMNS);
    const totalBlockHeight = (totalRows - 1) * ROW_SPACING;
    const startY = parentNode.y - (totalBlockHeight / 2);

    const newNodes: NodeData[] = [];
    
    // --- LOGIC FIX: CONNECTING THE DOTS (CONTEXT ENRICHMENT) ---
    // We construct a "Rich Angle" string that contains the Headline + The Strategy Behind It.
    // This ensures the AI Visualizer understands the "Why" and "How", not just the "What".
    
    let angleToUse = parentNode.title;
    let deepContext = "";

    if (parentNode.type === NodeType.HOOK_NODE && parentNode.hookData) {
        const mech = parentNode.mechanismData?.scientificPseudo ? `(Mechanism: ${parentNode.mechanismData.scientificPseudo})` : '';
        angleToUse = parentNode.hookData;
        deepContext = ` [STRATEGY CONTEXT: This hook matches the Mechanism "${parentNode.mechanismData?.scientificPseudo}" which works by "${parentNode.mechanismData?.ums}". Visual must show this logic.]`;

    } else if (parentNode.type === NodeType.BIG_IDEA_NODE && parentNode.bigIdeaData) {
        angleToUse = parentNode.bigIdeaData.headline;
        deepContext = ` [STRATEGY CONTEXT: The Big Idea Concept is "${parentNode.bigIdeaData.concept}". We are shifting the user's belief from "${parentNode.bigIdeaData.targetBelief}". Visual must prove this shift.]`;

    } else if (parentNode.type === NodeType.MECHANISM_NODE && parentNode.mechanismData) {
        angleToUse = parentNode.mechanismData.scientificPseudo;
        deepContext = ` [STRATEGY CONTEXT: Mechanism Name: "${parentNode.mechanismData.scientificPseudo}". HOW IT WORKS (UMS): ${parentNode.mechanismData.ums}. WHY OLD WAY FAILED (UMP): ${parentNode.mechanismData.ump}. Visual must show this unique mechanism in action.]`;

    } else if (parentNode.type === NodeType.STORY_NODE && parentNode.storyData) {
        angleToUse = parentNode.storyData.title;
        deepContext = ` [STRATEGY CONTEXT: Narrative: "${parentNode.storyData.narrative}". Core Emotion: ${parentNode.storyData.emotionalTheme}. Visual must be raw and authentic to this story.]`;

    } else if (parentNode.type === NodeType.HVCO_NODE && parentNode.hvcoData) {
        angleToUse = parentNode.hvcoData.title;
        deepContext = ` [STRATEGY CONTEXT: Lead Magnet Hook: "${parentNode.hvcoData.hook}". Format: ${parentNode.hvcoData.format}. Visual should sell the VALUE of this free info.]`;
    }

    // Combine for the Prompt
    const fullPromptAngle = angleToUse + deepContext;

    // --- PERSIST FULL PERSONA CONTEXT ---
    const personaToUse = parentNode.meta || { name: "General Audience", profile: "Unknown" };
    const isHVCOFlow = parentNode.type === NodeType.HVCO_NODE;

    formats.forEach((format, index) => {
      const row = Math.floor(index / COLUMNS);
      const col = index % COLUMNS;
      
      const newId = `creative-${Date.now()}-${index}`;
      const nodeData: NodeData = {
        id: newId, 
        type: NodeType.CREATIVE, 
        parentId: parentNodeId,
        title: format, 
        description: "Initializing Generation...", 
        format: format,
        isLoading: true, 
        x: parentNode.x + HORIZONTAL_GAP + (col * COL_SPACING), 
        y: startY + (row * ROW_SPACING),
        stage: CampaignStage.TESTING,
        meta: { 
            ...personaToUse, 
            angle: fullPromptAngle, // Save the Rich Angle in meta for consistency 
        }
      };
      newNodes.push(nodeData);
      addNode(nodeData);
      addEdge(parentNodeId, newId);
    });

    for (const node of newNodes) {
        if (newNodes.indexOf(node) > 0) await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const isHookSource = parentNode.type === NodeType.HOOK_NODE;
            const isShortcut = parentNode.type === NodeType.BIG_IDEA_NODE || parentNode.type === NodeType.MECHANISM_NODE || parentNode.type === NodeType.STORY_NODE || parentNode.type === NodeType.HVCO_NODE;
            const fmt = node.format as CreativeFormat;
            
            let accumulatedInput = 0;
            let accumulatedOutput = 0;
            let imageCount = 0;
            let finalAdCopy: any = {};
            let visualConcept: any = {};

            if (!isHookSource && !isShortcut) {
                 updateNode(node.id, { description: "Art Director: Defining visual style..." });
                 
                 const conceptResult = await generateCreativeConcept(projectContextForGen, personaToUse, fullPromptAngle, fmt);
                 accumulatedInput += conceptResult.inputTokens;
                 accumulatedOutput += conceptResult.outputTokens;
                 visualConcept = conceptResult.data;

                 updateNode(node.id, { description: "Copywriter: Drafting..." });
                 const copyResult = await generateAdCopy(
                     projectContextForGen, 
                     personaToUse, 
                     visualConcept, 
                     fullPromptAngle, // PASS THE FULL STRATEGY CONTEXT
                     fmt, 
                     isHVCOFlow, 
                     parentNode.mechanismData
                 );
                 accumulatedInput += copyResult.inputTokens;
                 accumulatedOutput += copyResult.outputTokens;
                 finalAdCopy = copyResult.data;
            } else {
                 if (isHookSource && parentNode.storyData && parentNode.bigIdeaData && parentNode.mechanismData && parentNode.hookData) {
                    updateNode(node.id, { description: "Writing Caption..." });
                    const letterResult = await generateSalesLetter(projectContextForGen, parentNode.storyData, parentNode.bigIdeaData, parentNode.mechanismData, parentNode.hookData);
                    accumulatedInput += letterResult.inputTokens;
                    accumulatedOutput += letterResult.outputTokens;
                    
                    finalAdCopy = {
                        headline: parentNode.hookData,
                        primaryText: letterResult.data, 
                        cta: project.offer || "Learn More"
                    };
                 } else {
                     updateNode(node.id, { description: "Copywriter: Drafting (Shortcut)..." });
                     
                     const conceptResult = await generateCreativeConcept(projectContextForGen, personaToUse, fullPromptAngle, fmt);
                     accumulatedInput += conceptResult.inputTokens;
                     accumulatedOutput += conceptResult.outputTokens;
                     visualConcept = conceptResult.data;
                     
                     const copyResult = await generateAdCopy(
                         projectContextForGen, 
                         personaToUse, 
                         visualConcept,
                         fullPromptAngle, // PASS THE FULL STRATEGY CONTEXT
                         fmt, 
                         isHVCOFlow, 
                         parentNode.mechanismData
                     );
                     accumulatedInput += copyResult.inputTokens;
                     accumulatedOutput += copyResult.outputTokens;
                     finalAdCopy = copyResult.data;
                 }

                 if (!visualConcept.visualScene) {
                     updateNode(node.id, { description: "Art Director: Visualizing..." });
                     const conceptResult = await generateCreativeConcept(projectContextForGen, personaToUse, fullPromptAngle, fmt);
                     accumulatedInput += conceptResult.inputTokens;
                     accumulatedOutput += conceptResult.outputTokens;
                     visualConcept = conceptResult.data;
                 }
            }

            const complianceStatus = await checkAdCompliance(finalAdCopy);
            finalAdCopy.complianceNotes = complianceStatus;

            updateNode(node.id, { description: "Visualizer: Rendering..." });
            
            // Set Aspect Ratio to VERTICAL for IG_STORY_TEXT
            let targetAspectRatio = "1:1";
            if (fmt === CreativeFormat.IG_STORY_TEXT || fmt === CreativeFormat.PHONE_NOTES || fmt === CreativeFormat.REELS_THUMBNAIL || fmt === CreativeFormat.HANDHELD_TWEET) {
                targetAspectRatio = "9:16";
            }

            // Pass Full Rich Angle to Image Gen (It helps the AI, Image Service will clean it for text overlays)
            const imgResult = await generateCreativeImage(
                projectContextForGen, personaToUse, fullPromptAngle, fmt, 
                visualConcept.visualScene, visualConcept.visualStyle, visualConcept.technicalPrompt, targetAspectRatio
            );
            
            accumulatedInput += imgResult.inputTokens;
            accumulatedOutput += imgResult.outputTokens;
            const imageUrl = imgResult.data;
            if (imageUrl) imageCount++;

            let carouselImages: string[] = [];
            const isCarousel = (
                fmt === CreativeFormat.CAROUSEL_EDUCATIONAL ||
                fmt === CreativeFormat.CAROUSEL_TESTIMONIAL ||
                fmt === CreativeFormat.CAROUSEL_PANORAMA ||
                fmt === CreativeFormat.CAROUSEL_PHOTO_DUMP ||
                fmt === CreativeFormat.CAROUSEL_REAL_STORY 
            );
            
            if (isCarousel) {
                const slidesResult = await generateCarouselSlides(
                    projectContextForGen, fmt, fullPromptAngle, visualConcept.visualScene, visualConcept.visualStyle, visualConcept.technicalPrompt, personaToUse
                );
                accumulatedInput += slidesResult.inputTokens;
                accumulatedOutput += slidesResult.outputTokens;
                carouselImages = slidesResult.data;
                imageCount += carouselImages.length;
            }

            const inputCost = (accumulatedInput / 1000000) * 0.30;
            const outputCost = (accumulatedOutput / 1000000) * 2.50;
            const imgCost = imageCount * 0.039;
            const totalCost = inputCost + outputCost + imgCost;

            updateNode(node.id, { 
                isLoading: false, 
                description: finalAdCopy.primaryText.slice(0, 100) + "...",
                imageUrl: imageUrl || undefined,
                carouselImages: carouselImages.length > 0 ? carouselImages : undefined,
                adCopy: finalAdCopy,
                inputTokens: accumulatedInput,
                outputTokens: accumulatedOutput,
                estimatedCost: totalCost,
                meta: { 
                    ...node.meta, 
                    visualScene: visualConcept.visualScene, 
                    visualStyle: visualConcept.visualStyle, 
                    technicalPrompt: visualConcept.technicalPrompt 
                }, 
                variableIsolated: visualConcept.rationale 
            });
        } catch (e) {
            console.error("Error generating creative node", e);
            updateNode(node.id, { isLoading: false, description: "Generation Failed" });
        }
    }
    updateNode(parentNodeId, { isLoading: false });
  };

  const handleNodeAction = async (action: string, nodeId: string, optionId?: string) => {
    const parentNode = nodes.find(n => n.id === nodeId);
    if (!parentNode) return;

    if (action === 'expand_personas') {
      updateNode(nodeId, { isLoading: true });
      try {
          const result = await generatePersonas(project);
          const personas = result.data;
          
          const HORIZONTAL_GAP = 600;
          const VERTICAL_SPACING = 800;
          const totalHeight = (personas.length - 1) * VERTICAL_SPACING;
          const startY = parentNode.y - (totalHeight / 2);
          
          personas.forEach((p: any, index: number) => {
            const newNodeId = `persona-${Date.now()}-${index}`;
            addNode({
              id: newNodeId, type: NodeType.PERSONA, parentId: nodeId,
              title: p.name, 
              description: `${p.profile || p.motivation}`,
              x: parentNode.x + HORIZONTAL_GAP, y: startY + (index * VERTICAL_SPACING),
              meta: p, stage: CampaignStage.TESTING,
              inputTokens: result.inputTokens / 3, 
              outputTokens: result.outputTokens / 3,
              estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
            });
            addEdge(nodeId, newNodeId);
          });
      } catch (e) { alert("Quota exceeded."); }
      updateNode(nodeId, { isLoading: false });
    }

    if (action === 'expand_angles') {
      updateNode(nodeId, { isLoading: true });
      try {
          const pMeta = parentNode.meta || {};
          const result = await generateAngles(project, pMeta.name, pMeta.motivation);
          const angles = result.data;
          
          const HORIZONTAL_GAP = 550;
          const VERTICAL_SPACING = 350;
          const totalHeight = (angles.length - 1) * VERTICAL_SPACING;
          const startY = parentNode.y - (totalHeight / 2);

          angles.forEach((a: any, index: number) => {
            const newNodeId = `angle-${Date.now()}-${index}`;
            addNode({
              id: newNodeId, type: NodeType.ANGLE, parentId: nodeId,
              title: a.headline, description: `Hook: ${a.painPoint}`,
              x: parentNode.x + HORIZONTAL_GAP, y: startY + (index * VERTICAL_SPACING),
              // MERGE: Persona Data + Angle Data
              meta: { ...pMeta, ...a }, 
              stage: CampaignStage.TESTING,
              testingTier: a.testingTier,
              inputTokens: result.inputTokens / 3,
              outputTokens: result.outputTokens / 3,
              estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
            });
            addEdge(nodeId, newNodeId);
          });
      } catch (e) { alert("Quota exceeded."); }
      updateNode(nodeId, { isLoading: false });
    }

    if (action === 'generate_hvco') {
        const pMeta = parentNode.meta || {};
        const painPoint = (pMeta.visceralSymptoms && pMeta.visceralSymptoms[0]) || pMeta.motivation || "Generic Pain";
        
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateHVCOIdeas(project, painPoint);
            const hvcos = result.data;
            const HORIZONTAL_GAP = 600;
            const VERTICAL_SPACING = 250;
            const totalHeight = (hvcos.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            
            hvcos.forEach((hvco, index) => {
                const newNodeId = `hvco-${Date.now()}-${index}`;
                addNode({
                    id: newNodeId,
                    type: NodeType.HVCO_NODE,
                    parentId: nodeId,
                    title: hvco.title,
                    description: "Lead Magnet (Blue Ocean)",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    hvcoData: hvco,
                    stage: CampaignStage.TESTING,
                    meta: { ...pMeta, hvcoTitle: hvco.title }, // Preserve Persona
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                });
                addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    if (action === 'generate_creatives') {
      setTargetNodeIdForFormat(nodeId);
      setIsFormatModalOpen(true);
    }

    if (action === 'promote_creative') {
       const newId = `${nodeId}-vault`;
       addNode({
           ...parentNode,
           id: newId,
           stage: CampaignStage.SCALING,
           x: 0, 
           y: 0,
           parentId: null
       });
       updateNode(nodeId, { isGhost: true });
       setActiveView('VAULT');
    }

    if (action === 'start_story_flow') {
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateStoryResearch(project);
            const stories = result.data;
            const HORIZONTAL_GAP = 500;
            const VERTICAL_SPACING = 400;
            const totalHeight = (stories.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            stories.forEach((story, index) => {
                const newNodeId = `story-${Date.now()}-${index}`;
                addNode({
                    id: newNodeId,
                    type: NodeType.STORY_NODE, 
                    parentId: nodeId,
                    title: story.title,
                    description: "Story Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: story, 
                    meta: parentNode.meta, // Propagate Parent Meta
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                });
                addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); alert("Generation failed"); }
        updateNode(nodeId, { isLoading: false });
    }

    if (action === 'generate_big_ideas') {
        const story = parentNode.storyData;
        if (!story) return;
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateBigIdeas(project, story);
            const ideas = result.data;
            const HORIZONTAL_GAP = 500;
            const VERTICAL_SPACING = 300;
            const totalHeight = (ideas.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            ideas.forEach((idea, index) => {
                 const newNodeId = `big-idea-${Date.now()}-${index}`;
                 addNode({
                    id: newNodeId,
                    type: NodeType.BIG_IDEA_NODE, 
                    parentId: nodeId,
                    title: idea.headline,
                    description: "Big Idea Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: story, 
                    bigIdeaData: idea, 
                    meta: parentNode.meta, // Propagate Parent Meta
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                 });
                 addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    if (action === 'generate_mechanisms') {
        const bigIdea = parentNode.bigIdeaData;
        if (!bigIdea) return;
        updateNode(nodeId, { isLoading: true });
        try {
            const result = await generateMechanisms(project, bigIdea);
            const mechanisms = result.data;
            const HORIZONTAL_GAP = 500;
            const VERTICAL_SPACING = 300;
            const totalHeight = (mechanisms.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            mechanisms.forEach((mech, index) => {
                 const newNodeId = `mechanism-${Date.now()}-${index}`;
                 addNode({
                    id: newNodeId,
                    type: NodeType.MECHANISM_NODE, 
                    parentId: nodeId,
                    title: mech.scientificPseudo,
                    description: "Mechanism Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: parentNode.storyData,
                    bigIdeaData: bigIdea,
                    mechanismData: mech, 
                    meta: parentNode.meta, // Propagate Parent Meta
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 3,
                    outputTokens: result.outputTokens / 3,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 3
                 });
                 addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    if (action === 'generate_hooks') {
        const mechanism = parentNode.mechanismData;
        if (!mechanism) return;
        updateNode(nodeId, { isLoading: true });
        try {
            const bigIdea = parentNode.bigIdeaData;
            if (!bigIdea) return; 
            const result = await generateHooks(project, bigIdea, mechanism);
            const hooks = result.data;
            const HORIZONTAL_GAP = 400;
            const VERTICAL_SPACING = 200;
            const totalHeight = (hooks.length - 1) * VERTICAL_SPACING;
            const startY = parentNode.y - (totalHeight / 2);
            hooks.forEach((hook, index) => {
                const newNodeId = `hook-${Date.now()}-${index}`;
                addNode({
                    id: newNodeId,
                    type: NodeType.HOOK_NODE, 
                    parentId: nodeId,
                    title: "Hook Variation",
                    description: "Hook Phase",
                    x: parentNode.x + HORIZONTAL_GAP,
                    y: startY + (index * VERTICAL_SPACING),
                    storyData: parentNode.storyData,
                    bigIdeaData: bigIdea,
                    mechanismData: mechanism,
                    hookData: hook, 
                    meta: parentNode.meta, // Propagate Parent Meta
                    stage: CampaignStage.TESTING,
                    inputTokens: result.inputTokens / 5,
                    outputTokens: result.outputTokens / 5,
                    estimatedCost: ((result.inputTokens/1000000)*0.3 + (result.outputTokens/1000000)*2.5) / 5
                });
                addEdge(nodeId, newNodeId);
            });
        } catch (e) { console.error(e); }
        updateNode(nodeId, { isLoading: false });
    }

    if (action === 'open_format_selector') {
        setTargetNodeIdForFormat(nodeId);
        setIsFormatModalOpen(true);
    }
  };

  const handlePredictionAudit = async (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      updateNode(nodeId, { isLoading: true });
      const result = await predictCreativePerformance(project, node);
      updateNode(nodeId, { isLoading: false, prediction: result.data });
  };

  const runGlobalPrediction = async () => {
    setSimulating(true);
    const creatives = nodes.filter(n => n.type === NodeType.CREATIVE && n.stage === CampaignStage.TESTING && !n.isGhost);
    
    // Batch processing
    for (const node of creatives) {
        if (!node.prediction) {
            const result = await predictCreativePerformance(project, node);
            updateNode(node.id, { prediction: result.data });
        }
    }
    setSimulating(false);
  };

  const handleSelectFormat = (fmt: CreativeFormat) => {
      const newSet = new Set(selectedFormats);
      if (newSet.has(fmt)) newSet.delete(fmt);
      else newSet.add(fmt);
      setSelectedFormats(newSet);
  };

  const confirmFormatSelection = () => {
      if (targetNodeIdForFormat && selectedFormats.size > 0) {
          executeGeneration(targetNodeIdForFormat, Array.from(selectedFormats));
          setIsFormatModalOpen(false);
          setSelectedFormats(new Set());
          setTargetNodeIdForFormat(null);
      }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <HashRouter>
    <div className="w-screen h-screen bg-slate-50 flex overflow-hidden text-slate-900" onDragOver={handleDragOver} onDrop={handleDrop}>
      <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          onOpenConfig={() => setIsConfigOpen(true)} 
      />
      <div className="flex-1 relative">
        <Canvas 
          ref={canvasRef}
          nodes={activeView === 'LAB' ? labNodes : vaultNodes}
          edges={activeView === 'LAB' ? labEdges : []}
          onNodeAction={handleNodeAction}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onNodeMove={handleNodeMove}
        />
        <Header 
            activeView={activeView}
            labNodesCount={labNodes.length}
            vaultNodesCount={vaultNodes.length}
            simulating={simulating}
            onRunSimulation={runGlobalPrediction}
        />
      </div>
      {selectedNode && (
          <div className="w-[400px] h-full z-30 relative">
            <Inspector 
                node={selectedNode} 
                onClose={() => setSelectedNodeId(null)} 
                onUpdate={updateNode} 
                onRegenerate={handleRegenerateNode} 
                onPromote={(id) => handleNodeAction('promote_creative', id)} 
                project={project} 
                onAnalyze={handlePredictionAudit}
            />
          </div>
      )}
      <ConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
          project={project} 
          onUpdateProject={handleProjectUpdate}
          onContextAnalyzed={handleContextAnalyzed}
      />
      <FormatSelector 
          isOpen={isFormatModalOpen}
          onClose={() => setIsFormatModalOpen(false)}
          selectedFormats={selectedFormats}
          onSelectFormat={handleSelectFormat}
          onConfirm={confirmFormatSelection}
          formatGroups={STRATEGIC_GROUPS}
      />
    </div>
    </HashRouter>
  );
};

export default App;
