
import React from 'react';
import { Microscope, Package, Activity, BrainCircuit } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
    activeView: ViewMode;
    labNodesCount: number;
    vaultNodesCount: number;
    simulating: boolean;
    onRunSimulation: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, labNodesCount, vaultNodesCount, simulating, onRunSimulation }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 z-10">
            <div>
                <h1 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {activeView === 'LAB' ? <><Microscope className="w-4 h-4"/> Testing Lab</> : <><Package className="w-4 h-4 text-amber-500"/> Creative Vault</>}
                </h1>
                <p className="text-xs text-slate-400 font-mono">{activeView === 'LAB' ? `${labNodesCount} Assets Active` : `${vaultNodesCount} Winning Assets`}</p>
            </div>
            <div className="flex items-center gap-4">
                 {activeView === 'LAB' && (
                     <button onClick={onRunSimulation} disabled={simulating} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                        <BrainCircuit className={`w-4 h-4 ${simulating ? 'animate-pulse text-indigo-500' : 'text-indigo-500'}`} />
                        {simulating ? 'Auditing Assets...' : 'Run Global Audit'}
                     </button>
                 )}
            </div>
        </div>
    );
};
export default Header;
