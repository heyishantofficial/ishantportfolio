import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OfficeCoutureFolder from './components/OfficeCoutureFolder';
import ProjectModal from './components/ProjectModal';
import NexusCyberdeckPlayer from './components/NexusCyberdeckPlayer';
import MacDock from './components/MacDock';

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
      <ProjectModal 
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* macOS Sequoia Glassmorphism Dock */}
      <MacDock />

      {/* Nexus Cyberdeck iPod Type Music Player Overlay */}
      <AnimatePresence>
        {showCyberdeck && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <NexusCyberdeckPlayer 
              onClose={() => setShowCyberdeck(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
