import React, { useState } from 'react';
import OfficeCoutureFolder from './components/OfficeCoutureFolder';
import ProjectModal from './components/ProjectModal';
import NexusCyberdeckPlayer from './components/NexusCyberdeckPlayer';

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCyberdeck, setShowCyberdeck] = useState(true);

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-slate-900 font-sans selection:bg-slate-900 selection:text-white relative">
      
      {/* Sky Blue Desktop Folder matching "The Office Couture" style */}
      <OfficeCoutureFolder 
        onSelectProject={(project) => setSelectedProject(project)}
      />

      {/* Project Detail Modal Overlay */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Nexus Cyberdeck iPod Type Music Player Overlay */}
      {showCyberdeck && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <NexusCyberdeckPlayer 
            onClose={() => setShowCyberdeck(false)}
          />
        </div>
      )}

    </div>
  );
}
