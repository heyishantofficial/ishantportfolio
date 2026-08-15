import React, { useState } from 'react';
import OfficeCoutureFolder from './components/OfficeCoutureFolder';
import ProjectModal from './components/ProjectModal';
import BetterHalfAssistant from './components/BetterHalfAssistant';
import ElectricGazeView from './components/ElectricGazeView';
import NexusCyberdeckPlayer from './components/NexusCyberdeckPlayer';
import { Eye, Zap, Disc3, Cpu } from 'lucide-react';

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showElectricGaze, setShowElectricGaze] = useState(false);
  const [showCyberdeck, setShowCyberdeck] = useState(true); // Default open so user sees it right away!

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-slate-900 font-sans selection:bg-slate-900 selection:text-white relative">
      
      {/* Top Floating Launcher Banner */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={() => setShowElectricGaze(true)}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-slate-950 text-white rounded-2xl border border-cyan-500/50 shadow-2xl hover:scale-105 transition-all font-mono text-xs font-bold"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <Eye className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span>ELECTRIC GAZE ASCII</span>
        </button>
      </div>

      {/* 1 Sky Blue Desktop Folder matching "The Office Couture" style 1:1 */}
      <OfficeCoutureFolder 
        onSelectProject={(project) => setSelectedProject(project)}
      />

      {/* Project Detail Modal Overlay */}
      {selectedProject && selectedProject.id !== 'electric-gaze-ascii' && (
        <ProjectModal 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Better Half Virtual Girlfriend AI Assistant */}
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

      {/* "Electric Gaze" Canvas2D ASCII-Art & Speech Avatar Engine Modal */}
      {(showElectricGaze || selectedProject?.id === 'electric-gaze-ascii') && (
        <ElectricGazeView 
          onClose={() => {
            setShowElectricGaze(false);
            if (selectedProject?.id === 'electric-gaze-ascii') setSelectedProject(null);
          }}
        />
      )}

    </div>
  );
}

