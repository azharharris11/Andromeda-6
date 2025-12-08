
import React from 'react';
import { NodeData, NodeType, CampaignStage } from '../types';
import { User, Zap, Image as ImageIcon, Target, Award, RefreshCw, Sparkles, TrendingUp, DollarSign, MousePointer2, Ghost, Mic, Layers, Cpu, Archive, Search, Lightbulb, PenTool, BookOpen, ArrowRight, MessageCircle, Activity, Video, Magnet } from 'lucide-react';

interface NodeProps {
  data: NodeData;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onAction: (action: string, id: string, optionId?: string) => void;
  isGridView?: boolean; 
}

const Node: React.FC<NodeProps> = ({ data, selected, onClick, onAction, isGridView = false }) => {
  
  const isScaling = data.stage === CampaignStage.SCALING;
  const hasParent = !!data.parentId && !isGridView;
  const showOutputHandle = !isGridView && (data.type !== NodeType.CREATIVE || (data.type === NodeType.CREATIVE && isScaling));
  const isGhost = data.isGhost;
  const isCarousel = data.carouselImages && data.carouselImages.length > 0;
  const isVideo = !!data.videoUrl;

  const getStatusStyles = () => {
    if (isGhost) return {
        container: 'bg-slate-50/30 ring-1 ring-slate-200 border border-dashed border-slate-300 opacity-60 grayscale',
        header: 'bg-slate-100/50 border-b border-slate-200 text-slate-400',
        text: 'text-slate-400',
        accent: 'text-slate-400',
        iconBg: 'bg-slate-100',
        handle: 'bg-slate-200'
    };
    if (isScaling) return {
      container: 'bg-white ring-1 ring-amber-200 shadow-xl shadow-amber-500/5',
      header: 'bg-amber-50/50 border-b border-amber-100 text-amber-800',
      text: 'text-amber-950',
      accent: 'text-amber-600',
      iconBg: 'bg-amber-100',
      handle: 'bg-amber-400'
    };
    if (selected) return {
      container: 'bg-white ring-2 ring-blue-600 shadow-2xl shadow-blue-500/20',
      header: 'bg-blue-50/50 border-b border-blue-100 text-blue-700',
      text: 'text-slate-900',
      accent: 'text-blue-600',
      iconBg: 'bg-blue-100',
      handle: 'bg-blue-500'
    };
    
    // --- MEGAPROMPT BRANCH STYLES ---
    if (data.type === NodeType.STORY_NODE) return {
       container: 'bg-white ring-1 ring-orange-200 shadow-lg shadow-orange-500/10',
       header: 'bg-orange-50/50 border-b border-orange-100 text-orange-800',
       text: 'text-slate-900',
       accent: 'text-orange-600',
       iconBg: 'bg-orange-100',
       handle: 'bg-orange-400'
    };
    if (data.type === NodeType.BIG_IDEA_NODE) return {
        container: 'bg-white ring-1 ring-yellow-200 shadow-lg shadow-yellow-500/10',
        header: 'bg-yellow-50/50 border-b border-yellow-100 text-yellow-800',
        text: 'text-slate-900',
        accent: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        handle: 'bg-yellow-400'
     };
    if (data.type === NodeType.MECHANISM_NODE) return {
        container: 'bg-white ring-1 ring-cyan-200 shadow-lg shadow-cyan-500/10',
        header: 'bg-cyan-50/50 border-b border-cyan-100 text-cyan-800',
        text: 'text-slate-900',
        accent: 'text-cyan-600',
        iconBg: 'bg-cyan-100',
        handle: 'bg-cyan-400'
     };
    if (data.type === NodeType.HOOK_NODE) return {
        container: 'bg-white ring-1 ring-pink-200 shadow-lg shadow-pink-500/10',
        header: 'bg-pink-50/50 border-b border-pink-100 text-pink-800',
        text: 'text-slate-900',
        accent: 'text-pink-600',
        iconBg: 'bg-pink-100',
        handle: 'bg-pink-400'
     };
    if (data.type === NodeType.SALES_LETTER) return {
        container: 'bg-white ring-1 ring-emerald-200 shadow-lg shadow-emerald-500/10',
        header: 'bg-emerald-50/50 border-b border-emerald-100 text-emerald-800',
        text: 'text-slate-900',
        accent: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        handle: 'bg-emerald-400'
     };
    if (data.type === NodeType.HVCO_NODE) return {
        container: 'bg-white ring-1 ring-teal-200 shadow-lg shadow-teal-500/10',
        header: 'bg-teal-50/50 border-b border-teal-100 text-teal-800',
        text: 'text-slate-900',
        accent: 'text-teal-600',
        iconBg: 'bg-teal-100',
        handle: 'bg-teal-400'
     };

    return {
      container: 'bg-white ring-1 ring-slate-200 shadow-md hover:shadow-xl', 
      header: 'bg-slate-50/50 border-b border-slate-100 text-slate-500',
      text: 'text-slate-800',
      accent: 'text-slate-500',
      iconBg: 'bg-slate-100',
      handle: 'bg-slate-300'
    };
  };

  const styles = getStatusStyles();

  const getIcon = () => {
    if (isGhost) return <Ghost className={`w-3.5 h-3.5 ${styles.accent}`} />;
    if (isScaling) return <Award className={`w-3.5 h-3.5 ${styles.accent}`} />;
    switch (data.type) {
      case NodeType.ROOT: return <Zap className="w-3.5 h-3.5 text-purple-600" />;
      case NodeType.PERSONA: return <User className="w-3.5 h-3.5 text-teal-600" />;
      case NodeType.ANGLE: return <Target className="w-3.5 h-3.5 text-pink-600" />;
      case NodeType.CREATIVE: return <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />;
      case NodeType.STORY_NODE: return <MessageCircle className="w-3.5 h-3.5 text-orange-600" />;
      case NodeType.BIG_IDEA_NODE: return <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />;
      case NodeType.MECHANISM_NODE: return <Cpu className="w-3.5 h-3.5 text-cyan-600" />;
      case NodeType.HOOK_NODE: return <Sparkles className="w-3.5 h-3.5 text-pink-500" />;
      case NodeType.SALES_LETTER: return <BookOpen className="w-3.5 h-3.5 text-emerald-600" />;
      case NodeType.HVCO_NODE: return <Magnet className="w-3.5 h-3.5 text-teal-600" />;
      default: return <Zap className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const formatTokens = (input: number = 0, output: number = 0) => {
    const total = input + output;
    if (total > 1000) return `${(total / 1000).toFixed(1)}k`;
    return total;
  };

  const containerClass = isGridView 
    ? `relative w-full h-full flex flex-col rounded-xl border-0 transition-all duration-300 ${styles.container} ${selected ? 'ring-2 ring-amber-400' : ''}`
    : `absolute w-[360px] rounded-xl border-0 node-interactive node-enter flex flex-col ${styles.container} ${selected ? 'z-50 scale-[1.02]' : 'z-10'}`;

  const styleProp = isGridView ? {} : { left: data.x, top: data.y, transition: 'box-shadow 0.2s, transform 0.2s' };

  return (
    <div
      onClick={onClick}
      className={containerClass}
      style={styleProp}
      data-id={data.id} 
    >
      {!isGridView && !isGhost && (
        <>
          {hasParent && (
            <div className="absolute left-0 top-[50px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center z-[-1]">
                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm node-handle ${styles.handle}`}></div>
            </div>
          )}
          {showOutputHandle && (
            <div className="absolute right-0 top-[50px] translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center z-[-1]">
                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm node-handle ${styles.handle}`}></div>
            </div>
          )}
        </>
      )}

      <div className={`h-10 flex items-center justify-between px-4 rounded-t-xl ${styles.header}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded-md ${styles.iconBg}`}>
             {getIcon()}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono opacity-80">
             {isGhost ? 'ARCHIVED' : (isScaling ? 'VAULT ASSET' : data.type.replace('_NODE', ' '))}
          </span>
        </div>
        <div className="flex items-center gap-2">
            {data.isLoading && <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
            
            {/* Tokens Cost */}
            {(data.inputTokens !== undefined || data.outputTokens !== undefined) && !data.prediction && (
                 <div className="flex items-center gap-1 bg-slate-200/50 px-1.5 py-0.5 rounded border border-slate-300/50" title={`Input: ${data.inputTokens} | Output: ${data.outputTokens}`}>
                    <Cpu className="w-2.5 h-2.5 text-slate-500" />
                    <span className="text-[9px] font-mono text-slate-700 font-bold">{formatTokens(data.inputTokens, data.outputTokens)}</span>
                 </div>
            )}
            
            {data.audioBase64 && <div className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center"><Mic className="w-2.5 h-2.5 text-pink-600" /></div>}
            {isCarousel && <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center" title="Carousel Format"><Layers className="w-2.5 h-2.5 text-blue-600" /></div>}
            {isVideo && <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center" title="Video Asset"><Video className="w-2.5 h-2.5 text-purple-600" /></div>}
        </div>
      </div>

      <div className={`p-4 flex flex-col gap-3 bg-white/50 rounded-b-xl flex-1 ${isGhost ? 'opacity-50' : ''}`}>
        
        {data.type === NodeType.CREATIVE && data.imageUrl && (
           <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-100 group shadow-sm bg-slate-50 select-none pointer-events-none">
             <img src={data.imageUrl} alt="Creative" className="w-full h-full object-cover mix-blend-multiply" />
             
             {isCarousel && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-1 rounded-md">
                    <Layers className="w-3 h-3" />
                </div>
             )}
             
             {isVideo && (
                <div className="absolute top-2 right-2 bg-purple-600/90 backdrop-blur-md text-white p-1 rounded-md animate-pulse">
                    <Video className="w-3 h-3" />
                </div>
             )}

             <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                <span className="inline-block px-2 py-1 bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm rounded text-[10px] text-slate-800 font-medium truncate max-w-[180px]">
                    {data.format}
                </span>
             </div>
           </div>
        )}

        <div>
          <h3 className={`text-sm font-display font-semibold leading-snug ${styles.text}`}>
            {data.title}
          </h3>
          {data.description && !isGridView && (
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-light border-l-2 border-slate-100 pl-2 line-clamp-2">
              {data.description}
            </p>
          )}

          {/* VISCERAL SYMPTOMS DIAGNOSIS (Persona Node Only) */}
          {data.type === NodeType.PERSONA && data.meta?.visceralSymptoms && (
            <div className="mt-2 space-y-1">
                {data.meta.visceralSymptoms.map((symptom: string, i: number) => (
                    <div key={i} className="text-[10px] text-slate-600 bg-red-50/50 p-1.5 rounded border border-red-100 flex items-start gap-1.5">
                        <Activity className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{symptom}</span>
                    </div>
                ))}
            </div>
          )}
        </div>
        
        {/* STORY NODE */}
        {data.type === NodeType.STORY_NODE && data.storyData && (
             <div className="mt-1">
                 <div className="text-[10px] text-slate-500 italic bg-orange-50 p-2 rounded border border-orange-100 mb-2">"{data.storyData.narrative}"</div>
                 <div className="flex gap-1"><span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">{data.storyData.emotionalTheme}</span></div>
             </div>
        )}

        {/* BIG IDEA NODE */}
        {data.type === NodeType.BIG_IDEA_NODE && data.bigIdeaData && (
             <div className="mt-1">
                 <div className="text-[10px] text-slate-600 mb-1"><b>Concept:</b> {data.bigIdeaData.concept}</div>
                 <div className="text-[10px] text-yellow-700 bg-yellow-50 p-1.5 rounded border border-yellow-100"><b>Shift:</b> {data.bigIdeaData.targetBelief}</div>
             </div>
        )}

        {/* MECHANISM NODE */}
        {data.type === NodeType.MECHANISM_NODE && data.mechanismData && (
             <div className="mt-1 grid grid-cols-1 gap-1.5">
                 <div className="text-[9px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100"><b>UMP (Enemy):</b> {data.mechanismData.ump}</div>
                 <div className="text-[9px] text-emerald-600 bg-emerald-50 p-1.5 rounded border border-emerald-100"><b>UMS (Solution):</b> {data.mechanismData.ums}</div>
             </div>
        )}

        {/* HOOK NODE */}
        {data.type === NodeType.HOOK_NODE && data.hookData && (
             <div className="mt-1 p-2 bg-pink-50 border border-pink-100 rounded text-pink-900 text-[11px] font-medium italic">
                 "{data.hookData}"
             </div>
        )}
        
        {/* HVCO NODE */}
        {data.type === NodeType.HVCO_NODE && data.hvcoData && (
             <div className="mt-1 space-y-2">
                 <div className="flex gap-2">
                    <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold uppercase">{data.hvcoData.format}</span>
                 </div>
                 <p className="text-[10px] text-slate-500 italic">"{data.hvcoData.hook}"</p>
             </div>
        )}
        
        {/* SALES LETTER DISPLAY */}
        {data.type === NodeType.SALES_LETTER && data.fullSalesLetter && (
            <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg max-h-[200px] overflow-y-auto">
                <p className="text-[10px] text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{data.fullSalesLetter}</p>
            </div>
        )}

        {/* QUALITATIVE PREDICTION SCORE (Real Metric Replacement) */}
        {data.prediction && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mt-auto">
                <div className="flex items-center justify-between p-2 bg-white border-b border-slate-100">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">AI Prediction Score</span>
                     <div className={`px-2 py-0.5 rounded text-[11px] font-bold ${data.prediction.score > 80 ? 'bg-emerald-100 text-emerald-700' : data.prediction.score > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                         {data.prediction.score}/100
                     </div>
                </div>
                <div className="p-2 grid grid-cols-2 gap-1.5">
                    <div className="text-[9px] text-slate-500 bg-slate-100/50 p-1 rounded">Hook: <b className="text-slate-700">{data.prediction.hookStrength}</b></div>
                    <div className="text-[9px] text-slate-500 bg-slate-100/50 p-1 rounded">Emotion: <b className="text-slate-700">{data.prediction.emotionalResonance}</b></div>
                </div>
            </div>
        )}
      </div>

      <div className="p-1.5 bg-slate-50/80 border-t border-slate-100 rounded-b-xl">
        {!isGridView && !data.prediction && !isGhost && (
            <>
            {data.type === NodeType.ROOT && (
                <div className="flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction('expand_personas', data.id); }}
                        className="flex-1 py-2 bg-white hover:bg-blue-50 hover:border-blue-200 text-blue-600 text-xs font-medium rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <User className="w-3 h-3" /> Standard Flow
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction('start_story_flow', data.id); }}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <BookOpen className="w-3 h-3" /> Story Lead
                    </button>
                </div>
            )}
            
            {data.type === NodeType.PERSONA && (
                <div className="flex flex-col gap-1">
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('expand_angles', data.id); }}
                    className="w-full py-2 bg-white hover:bg-pink-50 hover:border-pink-200 text-pink-600 text-xs font-medium rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                    <Target className="w-3 h-3" /> Expand Angles
                    </button>
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('generate_hvco', data.id); }}
                    className="w-full py-2 bg-white hover:bg-teal-50 hover:border-teal-200 text-teal-600 text-xs font-medium rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                    <Magnet className="w-3 h-3" /> Generate Lead Magnets
                    </button>
                </div>
            )}
            
            {data.type === NodeType.ANGLE && (
                <button 
                onClick={(e) => { e.stopPropagation(); onAction('generate_creatives', data.id); }}
                className="w-full py-2 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600 text-xs font-medium rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                <Sparkles className="w-3 h-3" /> Generate Formats
                </button>
            )}

            {/* --- MEGAPROMPT BRANCHING ACTIONS --- */}
            
            {data.type === NodeType.STORY_NODE && (
                <div className="flex flex-col gap-1">
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('generate_big_ideas', data.id); }}
                    className="w-full py-2 bg-white hover:bg-yellow-50 hover:border-yellow-200 text-yellow-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                    <Lightbulb className="w-3 h-3" /> Generate Big Ideas
                    </button>
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('open_format_selector', data.id); }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                    <ImageIcon className="w-3 h-3" /> Create Now (Shortcut)
                    </button>
                </div>
            )}
            
            {data.type === NodeType.BIG_IDEA_NODE && (
                <div className="flex flex-col gap-1">
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('generate_mechanisms', data.id); }}
                    className="w-full py-2 bg-white hover:bg-cyan-50 hover:border-cyan-200 text-cyan-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                    <Cpu className="w-3 h-3" /> Define Mechanisms
                    </button>
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('open_format_selector', data.id); }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                    <ImageIcon className="w-3 h-3" /> Create Now (Shortcut)
                    </button>
                </div>
            )}

            {data.type === NodeType.MECHANISM_NODE && (
                <div className="flex flex-col gap-1">
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('generate_hooks', data.id); }}
                    className="w-full py-2 bg-white hover:bg-pink-50 hover:border-pink-200 text-pink-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                    <Sparkles className="w-3 h-3" /> Generate Hooks
                    </button>
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('open_format_selector', data.id); }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                    <ImageIcon className="w-3 h-3" /> Create Now (Shortcut)
                    </button>
                </div>
            )}
            
            {data.type === NodeType.HOOK_NODE && (
                <button 
                onClick={(e) => { e.stopPropagation(); onAction('open_format_selector', data.id); }}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                <ImageIcon className="w-3 h-3" /> Generate Creative
                </button>
            )}

            {data.type === NodeType.HVCO_NODE && (
                <div className="flex flex-col gap-1">
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('open_format_selector', data.id); }}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                    <ImageIcon className="w-3 h-3" /> Generate HVCO Ads
                    </button>
                </div>
            )}

            </>
        )}
        
        {/* MANUAL PROMOTION ALLOWED FOR ALL CREATIVES */}
        {!isGridView && data.type === NodeType.CREATIVE && !isScaling && !isGhost && (
            <button 
            onClick={(e) => { e.stopPropagation(); onAction('promote_creative', data.id); }}
            className={`w-full py-2 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 ${
                data.isWinning 
                    ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-amber-200' // Gold for Winners
                    : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600'
            }`}
            >
            <Archive className="w-3 h-3" /> Promote to Vault
            </button>
        )}
      </div>
    </div>
  );
};

export default Node;
