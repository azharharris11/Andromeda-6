
import React, { useState, useRef } from 'react';
import { Globe, ImageIcon, Upload, X, Target, ChevronDown, MessageSquare } from 'lucide-react';
import { ProjectContext, MarketAwareness, FunnelStage, CopyFramework } from '../types';
import { analyzeImageContext, analyzeLandingPageContext } from '../services/geminiService';
import { scrapeLandingPage } from '../services/firecrawlService';

// UI Component for Editable Dropdowns (Local to ConfigModal now)
const EditableSelect = ({ label, value, onChange, options, placeholder }: { label: string, value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative group">
      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{label}</label>
      <div className="relative">
        <input 
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isOpen && options && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-50 last:border-0 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); 
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectContext;
    onUpdateProject: (updates: Partial<ProjectContext>) => void;
    onContextAnalyzed: (context: ProjectContext) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, project, onUpdateProject, onContextAnalyzed }) => {
    const [landingPageUrl, setLandingPageUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const productRefInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleAwarenessChange = (awareness: MarketAwareness) => {
        let derivedFunnelStage = FunnelStage.TOF;
        switch (awareness) {
          case MarketAwareness.UNAWARE:
          case MarketAwareness.PROBLEM_AWARE:
            derivedFunnelStage = FunnelStage.TOF;
            break;
          case MarketAwareness.SOLUTION_AWARE:
            derivedFunnelStage = FunnelStage.MOF;
            break;
          case MarketAwareness.PRODUCT_AWARE:
          case MarketAwareness.MOST_AWARE:
            derivedFunnelStage = FunnelStage.BOF;
            break;
        }
        onUpdateProject({
          marketAwareness: awareness,
          funnelStage: derivedFunnelStage
        });
    };

    const handleAnalyzeUrl = async () => {
        if (!landingPageUrl) return;
        setIsAnalyzing(true);
        try {
            const scrapeResult = await scrapeLandingPage(landingPageUrl);
            if (!scrapeResult.success || !scrapeResult.markdown) {
                alert("Failed to read the website. Please enter details manually.");
                setIsAnalyzing(false);
                return;
            }
            const context = await analyzeLandingPageContext(scrapeResult.markdown);
            onContextAnalyzed({ ...context, landingPageUrl });
        } catch (e) {
            console.error(e);
            alert("Analysis failed.");
        }
        setIsAnalyzing(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzingImage(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                const context = await analyzeImageContext(base64);
                onContextAnalyzed(context);
            } catch (error) {
                console.error(error);
                alert("Could not analyze image.");
            }
            setIsAnalyzingImage(false);
        };
        reader.readAsDataURL(file);
    };

    const handleProductRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            onUpdateProject({ productReferenceImage: base64 });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex overflow-hidden max-h-[90vh]">
             <div className="w-1/3 bg-slate-50 p-8 border-r border-slate-200 overflow-y-auto">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Import Context</h3>
                 <div className="space-y-6">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Landing Page URL</label>
                        <div className="flex gap-2">
                            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" placeholder="https://..." value={landingPageUrl} onChange={(e) => setLandingPageUrl(e.target.value)} />
                        </div>
                        <button onClick={handleAnalyzeUrl} disabled={isAnalyzing} className="mt-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors">
                            {isAnalyzing ? "Scanning..." : "Analyze Site"}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[10px] text-slate-400 font-bold">OR</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative group">
                        <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5" /> Product Image Analysis</label>
                        <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                            {isAnalyzingImage ? (
                                <div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div><span className="text-xs text-blue-600 font-medium">Analyzing...</span></div>
                            ) : (
                                <><Upload className="w-6 h-6 text-slate-400 mb-2" /><span className="text-xs text-slate-500">Drop or Click to Upload</span></>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                 </div>
             </div>
             <div className="w-2/3 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div><h2 className="text-2xl font-display font-bold text-slate-900">Project Brief</h2><p className="text-sm text-slate-500">Define the core strategy. AI will adhere to this.</p></div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Product Name</label>
                        <input className="w-full text-lg font-bold text-slate-900 border-b-2 border-slate-100 focus:border-blue-500 outline-none py-2 transition-colors" value={project.productName} onChange={e => onUpdateProject({ productName: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Value Proposition (Description)</label>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none" rows={2} value={project.productDescription} onChange={e => onUpdateProject({ productDescription: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Audience</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={project.targetAudience} onChange={e => onUpdateProject({ targetAudience: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Country</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm" value={project.targetCountry || ''} onChange={e => onUpdateProject({ targetCountry: e.target.value })} placeholder="e.g. Indonesia" />
                        </div>
                    </div>
                </div>
                <div className="h-px bg-slate-100 my-8"></div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-pink-500"/> Strategic Direction</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <EditableSelect 
                            label="Brand Voice" 
                            value={project.brandVoice || ''} 
                            onChange={(val) => onUpdateProject({ brandVoice: val })} 
                            options={project.brandVoiceOptions || []} 
                            placeholder="e.g. Witty, Gen-Z" 
                        />
                    </div>
                    <div>
                        <EditableSelect 
                            label="The Offer" 
                            value={project.offer || ''} 
                            onChange={(val) => onUpdateProject({ offer: val })} 
                            options={project.offerOptions || []} 
                            placeholder="e.g. 50% Off" 
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Tone Calibration (Few-Shot Examples)</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-mono text-slate-600" 
                            rows={3} 
                            value={project.brandCopyExamples || ''} 
                            onChange={e => onUpdateProject({ brandCopyExamples: e.target.value })}
                            placeholder="Paste 1-3 examples of your best performing ads here. The AI will mimic this exact style." 
                        />
                        <p className="text-[10px] text-slate-400 mt-1"><b>Pro Tip:</b> Paste your "Winning Ads" here to prevent the AI from sounding robotic.</p>
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Market Awareness</label>
                            <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-blue-300 transition-colors" value={project.marketAwareness} onChange={(e) => handleAwarenessChange(e.target.value as MarketAwareness)}>
                                {Object.values(MarketAwareness).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">Determines strategy.<br/><b>Unaware/Problem</b> = Top of Funnel.<br/><b>Solution</b> = Middle of Funnel.<br/><b>Product/Most</b> = Bottom of Funnel.</p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Copy Framework</label>
                             <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-blue-300 transition-colors" value={project.copyFramework} onChange={(e) => onUpdateProject({ copyFramework: e.target.value as CopyFramework })}>
                                {Object.values(CopyFramework).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-slate-100 my-8"></div>
                <div className="mb-8">
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5" /> Product Reference Image (Optional)</label>
                     <div className="flex items-center gap-4">
                         <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors relative overflow-hidden" onClick={() => productRefInputRef.current?.click()}>
                            {project.productReferenceImage ? (<img src={project.productReferenceImage} className="w-full h-full object-cover" />) : <Upload className="w-6 h-6 text-slate-300" />}
                         </div>
                         <div className="flex-1"><p className="text-xs text-slate-500 leading-relaxed">Upload a clear photo of your product. The AI will try to include this product in the generated visuals.</p></div>
                     </div>
                     <input type="file" ref={productRefInputRef} className="hidden" accept="image/*" onChange={handleProductRefUpload}/>
                </div>
                <button onClick={onClose} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.01]">Save Strategy & Enter Lab</button>
             </div>
          </div>
        </div>
    );
};

export default ConfigModal;
