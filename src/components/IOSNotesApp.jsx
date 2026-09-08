import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Download, Maximize2, FileText, 
  Check, Save, ShieldCheck, X, Sparkles, Lightbulb, Cpu
} from 'lucide-react';
import { useAdminAuth } from '../utils/useAdminAuth';
import AdminAuthModal from './AdminAuthModal';

const DEFAULT_QUICK_NOTES = {
  career: "I am starting a new internship soon, I wonder if I have what it takes or if I just got really lucky? Leadership and 10 things failure taught me.\n\nKey takeaways:\n1. Execution beats pure theory every single time.\n2. Good creative systems let great work happen consistently instead of accidentally.\n3. The best creators understand distribution as deeply as production.",
  ai: "I wonder if there is a future of AI identities - login with openai lol... wait this is gonna be real and then all the context and personalization.\n\nWhen models have persistent memory across apps, the interface becomes dynamic and ambient. Vibecoding is just the beginning of agentic creation.",
  tech: "Nintendo design philosophy teaches us that fun, playful design in itself is another strength. In an age where everything is minimal, there will be a resurgence of tactile, physical, delightful tech interfaces.\n\nTangible physics, responsive motion, and micro-delights turn software into an emotional experience."
};

const NOTE_TABS = [
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'career', label: 'Career', icon: Lightbulb },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'tech', label: 'Tech', icon: Cpu }
];

export default function IOSNotesApp({ onClose }) {
  const { isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('quick_notes_store');
      if (saved) return { ...DEFAULT_QUICK_NOTES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_QUICK_NOTES;
  });

  const handleDownloadResume = () => {
    const link = document.createElement('a');
    link.href = '/resume.pdf';
    link.download = 'Ishant_Chauhan_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNoteChange = (text) => {
    setNotes((prev) => ({ ...prev, [activeTab]: text }));
  };

  const handleSaveNote = () => {
    if (!isAdmin) {
      setShowAuthModal(true);
      return;
    }
    try {
      localStorage.setItem('quick_notes_store', JSON.stringify(notes));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* 1. Sleek iOS Navigation Header */}
      <div className="w-full pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#121214]/90 backdrop-blur-md">
        
        {/* Left Back Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-amber-400 active:opacity-70 transition-opacity font-medium text-sm"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 -ml-1" />
          <span>Notes</span>
        </button>

        {/* Center Title */}
        <h1 className="font-semibold text-sm text-white tracking-tight text-center">
          {activeTab === 'resume' ? 'Official Resume' :
           activeTab === 'career' ? 'Career Notes' :
           activeTab === 'ai' ? 'AI Thinking' : 'Tech Philosophy'}
        </h1>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'resume' ? (
            <button
              onClick={handleDownloadResume}
              className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>PDF</span>
            </button>
          ) : isAdmin ? (
            <button
              onClick={handleSaveNote}
              className="px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow active:scale-95 cursor-pointer"
            >
              {isSaved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          ) : null}

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>

      {/* 2. iOS Segmented Control Tab Bar */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="w-full p-1 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center gap-1 shadow-inner">
          {NOTE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-16">
        
        {/* TAB 1: Official Resume Document */}
        {activeTab === 'resume' && (
          <div className="space-y-3">
            
            {/* Action & Info Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-neutral-300 font-medium">Official Document (2027)</span>
              </div>
              <button
                onClick={() => setIsZoomed(true)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 active:opacity-75"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>

            {/* Resume Image Card */}
            <div 
              onClick={() => setIsZoomed(true)}
              className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/40 group cursor-pointer active:scale-[0.99] transition-transform"
            >
              <img
                src="/resume.jpg"
                alt="Ishant Chauhan Official Resume"
                className="w-full h-auto object-contain select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-lg">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tap to expand full document</span>
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2, 3, 4: Career, AI & Tech Thought Notes */}
        {activeTab !== 'resume' && (
          <div className="space-y-4">
            
            {/* Note Meta Header */}
            <div className="border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                {activeTab === 'career' ? 'Career & Leadership' :
                 activeTab === 'ai' ? 'AI & Digital Identity' : 'Design Philosophy'}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeTab === 'career' ? 'Design Career: 10 Things Failure Taught Me' :
                 activeTab === 'ai' ? 'AI Thinking & The Future of Identity' : 'Fun Tech & The Return of Play'}
              </h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400 font-mono">
                <span>{(notes[activeTab] || '').length} characters</span>
                <span>•</span>
                <span>{isAdmin ? 'Admin Mode Active' : 'Read Only'}</span>
              </div>
            </div>

            {/* Note Body */}
            {isAdmin ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Editor enabled — edits will be saved</span>
                </div>
                <textarea
                  value={notes[activeTab] || ''}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full min-h-[300px] bg-[#1c1c1e] border border-white/15 rounded-2xl p-4 text-sm font-sans leading-relaxed text-white placeholder-neutral-500 outline-none focus:border-amber-400 resize-none"
                />
              </div>
            ) : (
              <div 
                onClick={() => setShowAuthModal(true)}
                className="p-4 rounded-2xl bg-[#1c1c1e] border border-white/10 text-sm leading-relaxed text-neutral-200 font-sans shadow-sm cursor-pointer active:bg-white/5 transition-colors"
                title="Tap to unlock admin edit"
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {notes[activeTab]}
                </p>
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Ishant's Personal Notes</span>
                  <span className="text-amber-400/80">Tap to edit (Admin)</span>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        initialPrompt="Enter administrator password to edit and save notes."
      />

      {/* Lightbox Modal for Fullscreen Resume */}
      <AnimatePresence>
        {isZoomed && (
          <div 
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-fadeIn select-none"
            onClick={() => setIsZoomed(false)}
          >
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pt-safe pb-2 z-10" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs font-semibold text-neutral-300">Resume Lightbox</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadResume}
                  className="px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable / Zoomable Resume Viewport */}
            <div className="flex-1 overflow-auto flex items-center justify-center py-2" onClick={(e) => e.stopPropagation()}>
              <img
                src="/resume.jpg"
                alt="Ishant Chauhan Official Resume Fullscreen"
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
