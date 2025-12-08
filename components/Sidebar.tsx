
import React from 'react';
import { Microscope, Package, Settings } from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  onOpenConfig: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenConfig }) => {
  return (
    <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 z-20 shadow-sm">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20">
            <span className="text-white font-display font-bold text-xl">A</span>
        </div>
        <div className="flex flex-col gap-6 w-full">
            <button onClick={() => setActiveView('LAB')} className={`w-full relative py-3 flex justify-center transition-all ${activeView === 'LAB' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <Microscope className="w-6 h-6" />
                {activeView === 'LAB' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full" />}
            </button>
            <button onClick={() => setActiveView('VAULT')} className={`w-full relative py-3 flex justify-center transition-all ${activeView === 'VAULT' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
                <Package className="w-6 h-6" />
                {activeView === 'VAULT' && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-l-full" />}
            </button>
        </div>
        <div className="mt-auto flex flex-col gap-6 mb-4">
             <button onClick={onOpenConfig} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                 <Settings className="w-5 h-5" />
             </button>
        </div>
    </div>
  );
};

export default Sidebar;
