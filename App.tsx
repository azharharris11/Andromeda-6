import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Canvas, { CanvasHandle } from './components/Canvas';
import Inspector from './components/Inspector';
import ConfigModal from './components/ConfigModal';
import FormatSelector from './components/FormatSelector';
import Node from './components/Node';

import { 
  NodeData, Edge, NodeType, ViewMode, ProjectContext, 
  CreativeFormat, CampaignStage, MarketAwareness, 
  LanguageRegister, FunnelStage, CopyFramework, TestingTier,
  StoryOption, BigIdeaOption, MechanismOption, HVCOOption 
} from './types';

import * as GeminiService from './services/geminiService';

// Initial Data
const initialProject: ProjectContext = {
  productName: "Lumina",
  productDescription: "A smart sleep mask that uses light therapy to improve sleep quality.",
  targetAudience: "Insomniacs and biohackers",
  targetCountry: "USA",
  marketAwareness: MarketAwareness.PROBLEM_AWARE,
  funnelStage: FunnelStage.TOF,
  languageRegister: LanguageRegister.CASUAL
};

const initialNodes: NodeData[] = [
  {
    id: 'root-1',
    type: NodeType.ROOT,
    title: 'Campaign Root',
    description: 'Start here. Define your product strategy.',
    x: 100,
    y: 300
  }
];

const FORMAT_GROUPS: Record<string, CreativeFormat[]> = {
  "🔵 TOF (Unaware/Viral)": [
    CreativeFormat.UGLY_VISUAL,
    CreativeFormat.REDDIT_THREAD,
    CreativeFormat.TWITTER_REPOST,
    CreativeFormat.MEME,
    CreativeFormat.MS_PAINT,
    CreativeFormat.STORY_POLL,
    CreativeFormat.STORY_QNA,
    CreativeFormat.PHONE_NOTES,
    CreativeFormat.HANDHELD_TWEET,
    CreativeFormat.REMINDER_NOTIF
  ],
  "🟠 MOF (Education/Trust)": [
    CreativeFormat.CAROUSEL_EDUCATIONAL,
    CreativeFormat.CAROUSEL_REAL_STORY,
    CreativeFormat.IG_STORY_TEXT,
    CreativeFormat.BEFORE_AFTER,
    CreativeFormat.US_VS_THEM,
    CreativeFormat.VENN_DIAGRAM,
    CreativeFormat.MECHANISM_XRAY,
    CreativeFormat.EDUCATIONAL_RANT,
    CreativeFormat.CHAT_CONVERSATION,
    CreativeFormat.SOCIAL_COMMENT_STACK
  ],
  "🔴 BOF (Conversion/Offer)": [
    CreativeFormat.CAROUSEL_TESTIMONIAL,
    CreativeFormat.PRESS_FEATURE,
    CreativeFormat.BENEFIT_POINTERS,
    CreativeFormat.STICKY_NOTE_REALISM,
    CreativeFormat.TESTIMONIAL_HIGHLIGHT,
    CreativeFormat.LEAD_MAGNET_3D,
    CreativeFormat.UGC_MIRROR,
    CreativeFormat.DM_NOTIFICATION
  ]
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [project, setProject] = useState<ProjectContext>(initialProject);
  const [activeView, setActiveView] = useState<ViewMode>('LAB');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorNodeId, setInspectorNodeId] = useState<string | null>(null);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFormatSelectorOpen, setIsFormatSelectorOpen] = useState(false);
  const [pendingFormatParentId, setPendingFormatParentId] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<CreativeFormat>>(new Set());

  const [simulating, setSimulating] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);

  const addNode = (node: NodeData, parentId?: string) => {
      setNodes(prev => [...prev, node]);
      if (parentId) {
          const edge: Edge = {
              id: uuidv4(),
              source: parentId,
              target: node.id
          };
          setEdges(prev => [...prev, edge]);
      }
      return node;
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeData>) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleNodeAction = async (action: string, nodeId: string, optionId?: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Handle Basic Expansion
      if (action === 'expand_personas') {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generatePersonas(project);
          handleUpdateNode(nodeId, { isLoading: false, outputTokens: (node.outputTokens || 0) + result.outputTokens });
          
          if (result.data) {
              result.data.forEach((p: any, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.PERSONA,
                      title: p.name,
                      description: p.profile,
                      meta: p, // contains visceralSymptoms, etc.
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId,
                      inputTokens: result.inputTokens
                  }, nodeId);
              });
          }
      }

      // Handle Story Flow (Megaprompt)
      if (action === 'start_story_flow') {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateStoryResearch(project);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((story: StoryOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.STORY_NODE,
                      title: story.title,
                      description: story.narrative,
                      storyData: story,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_big_ideas' && node.storyData) {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateBigIdeas(project, node.storyData);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((idea: BigIdeaOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.BIG_IDEA_NODE,
                      title: idea.headline,
                      description: idea.concept,
                      bigIdeaData: idea,
                      storyData: node.storyData, // Pass down
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_mechanisms' && node.bigIdeaData) {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateMechanisms(project, node.bigIdeaData);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((mech: MechanismOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.MECHANISM_NODE,
                      title: mech.scientificPseudo,
                      description: `UMP: ${mech.ump} | UMS: ${mech.ums}`,
                      mechanismData: mech,
                      bigIdeaData: node.bigIdeaData, // Pass down
                      storyData: node.storyData, // Pass down
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_hooks' && node.mechanismData && node.bigIdeaData) {
           handleUpdateNode(nodeId, { isLoading: true });
           const result = await GeminiService.generateHooks(project, node.bigIdeaData, node.mechanismData);
           handleUpdateNode(nodeId, { isLoading: false });

           if (result.data) {
               result.data.forEach((hook: string, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.HOOK_NODE,
                       title: "Viral Hook",
                       description: hook,
                       hookData: hook,
                       mechanismData: node.mechanismData,
                       bigIdeaData: node.bigIdeaData,
                       storyData: node.storyData,
                       x: node.x + 400,
                       y: node.y + (i - 2) * 150, // tighter packing
                       parentId: nodeId
                   }, nodeId);
               });
           }
      }

      // Handle Angles Expansion
      if (action === 'expand_angles' && node.meta) {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateAngles(project, node.title, node.meta.motivation);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((a: any, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.ANGLE,
                      title: a.headline,
                      description: `${a.testingTier}: ${a.hook}`,
                      meta: { ...node.meta, angle: a.hook, ...a }, // Inherit persona meta
                      testingTier: a.testingTier,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }
      
      // Handle HVCO
      if (action === 'generate_hvco' && node.meta) {
           handleUpdateNode(nodeId, { isLoading: true });
           const pain = node.meta.visceralSymptoms?.[0] || "General Pain";
           const result = await GeminiService.generateHVCOIdeas(project, pain);
           handleUpdateNode(nodeId, { isLoading: false });
           
           if (result.data) {
               result.data.forEach((hvco: HVCOOption, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.HVCO_NODE,
                       title: hvco.title,
                       description: hvco.hook,
                       hvcoData: hvco,
                       meta: node.meta, // Inherit Persona
                       x: node.x + 400,
                       y: node.y + (i - 1) * 200,
                       parentId: nodeId
                   }, nodeId);
               });
           }
      }

      // Handle Creative Generation (Opening Selector)
      if (action === 'generate_creatives' || action === 'open_format_selector') {
          setPendingFormatParentId(nodeId);
          setIsFormatSelectorOpen(true);
      }
      
      // Handle Promotion
      if (action === 'promote_creative') {
          handleUpdateNode(nodeId, { stage: CampaignStage.SCALING, isWinning: true });
      }
  };

  const handleGenerateCreatives = async () => {
      if (!pendingFormatParentId) return;
      const parentNode = nodes.find(n => n.id === pendingFormatParentId);
      if (!parentNode) return;

      setIsFormatSelectorOpen(false);
      handleUpdateNode(pendingFormatParentId, { isLoading: true });
      
      const personaMeta = parentNode.meta || {}; 

      const formatsToGen = Array.from(selectedFormats) as CreativeFormat[];
      let verticalOffset = 0;

      // --- LOGIC FOR CONTEXT EXTRACTION ---
      let angleToUse = parentNode.title;
      let deepContext = "";
      
      if (parentNode.type === NodeType.ANGLE && parentNode.meta?.hook) {
          angleToUse = parentNode.meta.hook;
      } else if (parentNode.type === NodeType.HOOK_NODE && parentNode.hookData) {
          // --- SURGICAL FIX: HOOK VISUAL CONTEXT ---
          angleToUse = parentNode.hookData;
          const visualCheatSheet = parentNode.mechanismData?.ums || "Show the problem vividly";
          
          deepContext = ` [STRATEGY CONTEXT: The Hook is "${parentNode.hookData}". BUT the visual must depict THIS ACTION: "${visualCheatSheet}". Do not just visualize the text of the hook, visualize the ACTION behind it.]`;
      
      } else if (parentNode.type === NodeType.BIG_IDEA_NODE && parentNode.bigIdeaData) {
          angleToUse = parentNode.bigIdeaData.headline;
          deepContext = ` [STRATEGY CONTEXT: The Big Idea is "${parentNode.bigIdeaData.headline}". Concept: ${parentNode.bigIdeaData.concept}. Target Belief Shift: ${parentNode.bigIdeaData.targetBelief}]`;
      } else if (parentNode.type === NodeType.MECHANISM_NODE && parentNode.mechanismData) {
          angleToUse = parentNode.mechanismData.scientificPseudo;
           deepContext = ` [STRATEGY CONTEXT: The Mechanism is "${parentNode.mechanismData.scientificPseudo}". UMP: ${parentNode.mechanismData.ump}. UMS: ${parentNode.mechanismData.ums}]`;
      } else if (parentNode.type === NodeType.HVCO_NODE && parentNode.hvcoData) {
          angleToUse = parentNode.hvcoData.title;
          deepContext = ` [STRATEGY CONTEXT: Lead Magnet Title "${parentNode.hvcoData.title}". Hook: "${parentNode.hvcoData.hook}"]`;
      } else if (parentNode.type === NodeType.STORY_NODE && parentNode.storyData) {
          angleToUse = parentNode.storyData.title;
          deepContext = ` [STRATEGY CONTEXT: Story Narrative "${parentNode.storyData.narrative}"]`;
      }

      const fullAngle = angleToUse + deepContext;

      for (const fmt of formatsToGen) {
          // 1. Concept
          const conceptRes = await GeminiService.generateCreativeConcept(project, personaMeta, fullAngle, fmt);
          
          if (conceptRes.data) {
              const concept = conceptRes.data;
              
              // 2. Visual
              let imageUrl: string | null = null;
              let carouselImages: string[] = [];
              let imageTokens = 0;
              
              if (fmt.includes('Carousel')) {
                   const slidesRes = await GeminiService.generateCarouselSlides(
                       project, fmt, fullAngle, concept.visualScene, concept.visualStyle, concept.technicalPrompt, personaMeta
                   );
                   if (slidesRes.data && slidesRes.data.length > 0) {
                       imageUrl = slidesRes.data[0];
                       carouselImages = slidesRes.data;
                       imageTokens = slidesRes.inputTokens + slidesRes.outputTokens;
                   }
              } else {
                   const imgRes = await GeminiService.generateCreativeImage(
                       project, personaMeta, fullAngle, fmt, concept.visualScene, concept.visualStyle, concept.technicalPrompt
                   );
                   imageUrl = imgRes.data;
                   imageTokens = imgRes.inputTokens + imgRes.outputTokens;
              }

              // 3. Copy
              const isHVCO = parentNode.type === NodeType.HVCO_NODE;
              const copyRes = await GeminiService.generateAdCopy(
                  project, personaMeta, concept, angleToUse, fmt, isHVCO, parentNode.mechanismData
              );
              
              if (copyRes.data) {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.CREATIVE,
                       title: copyRes.data.headline,
                       description: concept.visualScene,
                       format: fmt,
                       imageUrl: imageUrl || undefined,
                       carouselImages: carouselImages.length > 1 ? carouselImages : undefined,
                       adCopy: copyRes.data,
                       meta: { ...parentNode.meta, angle: angleToUse, concept },
                       // Inherit megaprompt data if exists
                       storyData: parentNode.storyData,
                       bigIdeaData: parentNode.bigIdeaData,
                       mechanismData: parentNode.mechanismData,
                       
                       x: parentNode.x + 450,
                       y: parentNode.y + verticalOffset,
                       parentId: parentNode.id,
                       
                       inputTokens: conceptRes.inputTokens + imageTokens + copyRes.inputTokens,
                       outputTokens: conceptRes.outputTokens + copyRes.outputTokens
                   }, parentNode.id);
                   verticalOffset += 400;
              }
          }
      }
      
      handleUpdateNode(pendingFormatParentId, { isLoading: false });
      setSelectedFormats(new Set());
      setPendingFormatParentId(null);
  };

  const handleRunSimulation = async () => {
      setSimulating(true);
      // Simulate by predicting all leaf creatives in LAB
      const creatives = nodes.filter(n => n.type === NodeType.CREATIVE && n.stage !== CampaignStage.SCALING);
      
      for (const node of creatives) {
           handleUpdateNode(node.id, { isLoading: true });
           const pred = await GeminiService.predictCreativePerformance(project, node);
           handleUpdateNode(node.id, { isLoading: false, prediction: pred.data });
      }
      setSimulating(false);
  };
  
  const handleNodeMove = (id: string, x: number, y: number) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleRegenerateCreative = async (id: string, aspectRatio: string) => {
      const node = nodes.find(n => n.id === id);
      if (!node || !node.meta?.concept) return;
      
      handleUpdateNode(id, { isLoading: true });
      
      const concept = node.meta.concept;
      // We reuse the concept but regenerate the image
      const imgRes = await GeminiService.generateCreativeImage(
           project, node.meta, node.meta.angle, node.format!, 
           concept.visualScene, concept.visualStyle, concept.technicalPrompt, aspectRatio
      );
      
      handleUpdateNode(id, { isLoading: false, imageUrl: imgRes.data || node.imageUrl });
  };

  const vaultNodes = nodes.filter(n => n.stage === CampaignStage.SCALING);
  const labNodes = activeView === 'LAB' ? nodes : [];

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onOpenConfig={() => setIsConfigOpen(true)} />
      
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <Header 
            activeView={activeView} 
            labNodesCount={nodes.length} 
            vaultNodesCount={vaultNodes.length}
            simulating={simulating}
            onRunSimulation={handleRunSimulation}
        />
        
        <div className="flex-1 relative">
           {activeView === 'LAB' ? (
               <Canvas 
                   ref={canvasRef}
                   nodes={nodes}
                   edges={edges}
                   onNodeAction={(action, id) => handleNodeAction(action, id)}
                   selectedNodeId={selectedNodeId}
                   onSelectNode={(id) => { setSelectedNodeId(id); if (id) setInspectorNodeId(id); else setInspectorNodeId(null); }}
                   onNodeMove={handleNodeMove}
               />
           ) : (
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto h-full">
                   {vaultNodes.map(node => (
                       <div key={node.id} className="relative h-[400px]">
                           <Node 
                               data={node} 
                               selected={selectedNodeId === node.id} 
                               onClick={() => { setSelectedNodeId(node.id); setInspectorNodeId(node.id); }} 
                               onAction={handleNodeAction}
                               isGridView={true}
                           />
                       </div>
                   ))}
                   {vaultNodes.length === 0 && (
                       <div className="col-span-full flex flex-col items-center justify-center text-slate-400 mt-20">
                           <p>No winning assets in the vault yet.</p>
                           <button onClick={() => setActiveView('LAB')} className="text-blue-600 font-bold mt-2">Go to Lab</button>
                       </div>
                   )}
               </div>
           )}
           
           {/* Inspector Panel */}
           {inspectorNodeId && (
               <div className="absolute top-0 right-0 bottom-0 w-[450px] z-20">
                   <Inspector 
                       node={nodes.find(n => n.id === inspectorNodeId)!} 
                       onClose={() => setInspectorNodeId(null)}
                       onUpdate={(id, data) => handleUpdateNode(id, data)}
                       onRegenerate={handleRegenerateCreative}
                       onPromote={(id) => handleNodeAction('promote_creative', id)}
                       onAnalyze={async (id) => {
                            const node = nodes.find(n => n.id === id);
                            if(node) {
                                handleUpdateNode(id, { isLoading: true });
                                const pred = await GeminiService.predictCreativePerformance(project, node);
                                handleUpdateNode(id, { isLoading: false, prediction: pred.data });
                            }
                       }}
                       project={project}
                   />
               </div>
           )}
        </div>
      </div>

      <ConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
          project={project}
          onUpdateProject={(updates) => setProject(prev => ({ ...prev, ...updates }))}
          onContextAnalyzed={(context) => setProject(prev => ({ ...prev, ...context }))}
      />

      <FormatSelector 
          isOpen={isFormatSelectorOpen}
          onClose={() => setIsFormatSelectorOpen(false)}
          selectedFormats={selectedFormats}
          onSelectFormat={(fmt) => {
              const next = new Set(selectedFormats);
              if (next.has(fmt)) next.delete(fmt);
              else next.add(fmt);
              setSelectedFormats(next);
          }}
          onConfirm={handleGenerateCreatives}
          formatGroups={FORMAT_GROUPS}
      />
    </div>
  );
};

export default App;