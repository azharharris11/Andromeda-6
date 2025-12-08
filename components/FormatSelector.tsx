
import React from 'react';
import { Smartphone, Layers, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { CreativeFormat } from '../types';

interface FormatSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormats: Set<CreativeFormat>;
  onSelectFormat: (fmt: CreativeFormat) => void;
  onConfirm: () => void;
  formatGroups: Record<string, CreativeFormat[]>;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ isOpen, onClose, selectedFormats, onSelectFormat, onConfirm, formatGroups }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
              <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div><h2 className="text-xl font-display font-bold text-slate-900">Select Creative Formats</h2><p className="text-sm text-slate-500">Choose formats based on your strategy.</p></div>
                      <div className="flex gap-3">
                          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg font-bold text-sm">Cancel</button>
                          <button onClick={onConfirm} disabled={selectedFormats.size === 0} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">Generate {selectedFormats.size} Creatives</button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                      <div className="grid grid-cols-3 gap-6">
                          {Object.entries(formatGroups).map(([group, formats]) => {
                              // Style Logic based on Group Name
                              let headerStyle = "text-slate-500";
                              let bgStyle = "bg-white";
                              let borderStyle = "border-slate-200";
                              let icon = <Layers className="w-4 h-4"/>;
                              let desc = "";

                              if (group.includes("🔵")) { 
                                  headerStyle = "text-blue-600"; 
                                  bgStyle = "bg-blue-50/30"; 
                                  borderStyle = "border-blue-100";
                                  icon = <Zap className="w-4 h-4"/>;
                                  desc = "Target 60% Unaware. Stop scroll. Viral & Relatable.";
                              }
                              else if (group.includes("🟠")) { 
                                  headerStyle = "text-orange-600"; 
                                  bgStyle = "bg-orange-50/30"; 
                                  borderStyle = "border-orange-100";
                                  icon = <AlertCircle className="w-4 h-4"/>;
                                  desc = "Target 20% Problem Aware. Educate & Build Trust.";
                              }
                              else if (group.includes("🔴")) { 
                                  headerStyle = "text-red-600"; 
                                  bgStyle = "bg-red-50/30"; 
                                  borderStyle = "border-red-100";
                                  icon = <TrendingUp className="w-4 h-4"/>;
                                  desc = "Target 3% Ready to Buy. Hard Offer & Scarcity.";
                              }

                              return (
                                <div key={group} className={`p-5 rounded-xl border shadow-sm flex flex-col h-full ${bgStyle} ${borderStyle}`}>
                                    <div className="mb-4">
                                        <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${headerStyle}`}>
                                           {icon} {group}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 mt-1 italic">{desc}</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 flex-1 content-start">
                                        {(formats as CreativeFormat[]).map(fmt => (
                                            <button 
                                                key={fmt} 
                                                onClick={() => onSelectFormat(fmt)} 
                                                className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                                                    selectedFormats.has(fmt) 
                                                    ? 'bg-white border-blue-500 text-blue-700 shadow-md ring-1 ring-blue-200' 
                                                    : 'bg-white/60 border-transparent hover:bg-white hover:border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          </div>
    );
}

export default FormatSelector;
