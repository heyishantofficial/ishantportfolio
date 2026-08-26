import React, { useState } from 'react';
import OfficeCoutureFolder from './components/OfficeCoutureFolder';
import MouseReactiveHeader from './components/MouseReactiveHeader';
import ProjectModal from './components/ProjectModal';
import BetterHalfAssistant from './components/BetterHalfAssistant';
import NexusCyberdeckPlayer from './components/NexusCyberdeckPlayer';
import { Lock, Sparkles, Check } from 'lucide-react';

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCyberdeck, setShowCyberdeck] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeUser, setActiveUser] = useState('');

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-slate-900 font-sans selection:bg-slate-900 selection:text-white relative">
      
      {/* 
        GATED LOCK SCREEN OVERLAY
        Renders when isUnlocked === false. 
        Will ONLY unlock when text is entered into "Enter Your Name..." AND "Click to Unlock 🔒" is clicked.
      */}
      {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl my-auto">
            <MouseReactiveHeader 
              onUnlock={(name) => {
                setActiveUser(name);
                setIsUnlocked(true);
              }}
            />
          </div>
        </div>
      )}

      {/* MAIN PORTFOLIO APPLICATION (Blurred & hidden when locked) */}
      <div className={`p-4 sm:p-8 flex flex-col items-center gap-6 transition-all duration-500 ${!isUnlocked ? 'filter blur-md pointer-events-none select-none h-screen overflow-hidden opacity-30' : 'opacity-100'}`}>
        
        {/* Top Header Bar displaying unlocked user status */}
        {isUnlocked && (
          <header className="w-full max-w-5xl flex items-center justify-between p-4 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-slate-200 font-mono text-xs z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-extrabold text-slate-900 text-sm">Welcome, {activeUser}!</span>
              <span className="text-slate-500 font-medium">// Session Unlocked</span>
            </div>

            <button
              onClick={() => setIsUnlocked(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white font-mono text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Lock Screen"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Lock Screen 🔒</span>
            </button>
          </header>
        )}

        {/* 1 Sky Blue Desktop Folder matching "The Office Couture" style 1:1 */}
        <div className="w-full">
          <OfficeCoutureFolder 
            onSelectProject={(project) => setSelectedProject(project)}
          />
        </div>

        {/* Project Detail Modal Overlay */}
        {selectedProject && (
          <ProjectModal 
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}

        {/* AI Portfolio Co-pilot Assistant */}
        <BetterHalfAssistant 
          onSelectProject={(project) => setSelectedProject(project)}
        />

        {/* Dedicated Nexus Cyberdeck iPod Type Music Player Overlay */}
        {showCyberdeck && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <NexusCyberdeckPlayer 
              onClose={() => setShowCyberdeck(false)}
            />
          </div>
        )}

      </div>

    </div>
  );
}
