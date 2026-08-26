import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  AlertTriangle, FileText, Image as ImageIcon, 
  Mail, Trash2, Layers, CheckCircle2, Send, RefreshCw, Sparkles, ExternalLink
} from 'lucide-react';

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

// Wrapper for all macOS Window Modals
function MacWindow({ title, icon: IconComponent, onClose, children }) {
  return (
    <div className="mac-window-overlay" onClick={onClose}>
      <div className="mac-window" onClick={(e) => e.stopPropagation()}>
        <div className="mac-window-titlebar">
          <div className="mac-window-controls">
            <button className="mac-btn-close" onClick={onClose} title="Close">×</button>
            <button className="mac-btn-minimize" title="Minimize">–</button>
            <button className="mac-btn-expand" title="Expand">+</button>
          </div>
          <div className="mac-window-title">
            {IconComponent && <IconComponent className="w-4 h-4 text-slate-600" />}
            <span>{title}</span>
          </div>
          <div className="w-12"></div>
        </div>
        <div className="mac-window-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// 1. Creative Studio Modal (Ae, Ps, Ai)
export function CreativeStudioModal({ activeApp, onClose }) {
  const [activeTab, setActiveTab] = useState(activeApp || 'ae');

  const contentMap = {
    ae: {
      name: 'Adobe After Effects',
      tag: 'Motion & Visual FX',
      color: 'bg-indigo-900 text-indigo-200',
      projects: [
        { title: 'Cyberpunk UI HUD Motion', time: '0:15 Loop', desc: 'Complex 3D camera tracker with node-based glow shaders.' },
        { title: '3D Kinetic Typography Showcase', time: '0:30 Reel', desc: 'Custom motion curves & expression-driven text animations.' }
      ]
    },
    ps: {
      name: 'Adobe Photoshop',
      tag: 'Digital Compositing & Retouching',
      color: 'bg-sky-950 text-sky-200',
      projects: [
        { title: 'Surrealist Key Art Poster', time: '300 DPI', desc: 'Multi-layer composite with atmospheric color grading.' },
        { title: 'Tactile UI Mockup Assets', time: 'Vector Mask', desc: 'High-precision neumorphic and skeuomorphic texture maps.' }
      ]
    },
    ai: {
      name: 'Adobe Illustrator',
      tag: 'Vector Graphics & Branding',
      color: 'bg-amber-950 text-amber-200',
      projects: [
        { title: 'Vibecode Brand Identity Suite', time: 'SVG Export', desc: 'Modular geometric logo system with dark/light variants.' },
        { title: 'Custom App Iconset Pack', time: 'Grid Aligned', desc: 'Precision pixel-grid app icons crafted for macOS Sequoia.' }
      ]
    }
  };

  const current = contentMap[activeTab] || contentMap.ae;

  return (
    <MacWindow title={`${current.name} Showcase`} icon={Layers} onClose={onClose}>
      {/* App Switcher Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-lg mb-6 border border-slate-200">
        <button 
          onClick={() => setActiveTab('ae')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'ae' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          After Effects (Ae)
        </button>
        <button 
          onClick={() => setActiveTab('ps')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'ps' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Photoshop (Ps)
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'ai' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Illustrator (Ai)
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{current.name}</h3>
            <p className="text-xs text-slate-500">{current.tag}</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Creative Cloud 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {current.projects.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {item.time}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MacWindow>
  );
}

// 2. System Diagnostics Warning Modal
export function DiagnosticsModal({ onClose }) {
  const [cleared, setCleared] = useState(false);

  return (
    <MacWindow title="System Health & Diagnostics" icon={AlertTriangle} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">System Warning Advisory</h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              {cleared 
                ? 'All diagnostic alerts have been resolved. System running smoothly at 60 FPS.' 
                : '1 non-critical memory advisory detected in cache pool. High GPU acceleration active.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">FPS Performance</div>
            <div className="text-lg font-bold text-emerald-600 mt-1">60.0 FPS</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Memory Usage</div>
            <div className="text-lg font-bold text-blue-600 mt-1">1.2 / 8 GB</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Glass Blur Status</div>
            <div className="text-lg font-bold text-purple-600 mt-1">Active</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          {!cleared ? (
            <button 
              onClick={() => setCleared(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Resolve Diagnostics
            </button>
          ) : (
            <button 
              onClick={() => setCleared(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Re-run Scan
            </button>
          )}
        </div>
      </div>
    </MacWindow>
  );
}

// 3. Quick Note Modal (Notes App)
export function QuickNotesModal({ onClose }) {
  const [noteText, setNoteText] = useState(
    "💡 Ideas & Portfolio Scratchpad:\n- Implement macOS Sequoia glassmorphism Dock\n- Add fluid magnification physics\n- Connect trash emptying sound effect\n- Polish responsive tactile components"
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <MacWindow title="Quick Note — Scratchpad" icon={FileText} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-amber-100/70 p-2 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>macOS Quick Note</span>
          </div>
          <button 
            onClick={handleSave}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            {saved ? 'Saved' : 'Save Note'}
          </button>
        </div>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={8}
          className="w-full p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
          placeholder="Write your thoughts..."
        />
      </div>
    </MacWindow>
  );
}

// 4. Photos Gallery Modal
export function PhotosModal({ onClose }) {
  const samplePhotos = [
    { title: 'Glassmorphism Concept', category: 'UI Design', color: 'from-blue-500 to-indigo-600' },
    { title: 'Motion Graphic Art', category: '3D Render', color: 'from-purple-500 to-pink-600' },
    { title: 'Tokyo Night Lights', category: 'Photography', color: 'from-cyan-500 to-emerald-600' },
    { title: 'Vector Branding', category: 'Illustrator', color: 'from-amber-500 to-rose-600' }
  ];

  return (
    <MacWindow title="Photos Library" icon={ImageIcon} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">Recent Portfolio Shots</h3>
          <span className="text-xs text-slate-500">{samplePhotos.length} Items</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {samplePhotos.map((photo, i) => (
            <div 
              key={i} 
              className={`h-36 rounded-xl bg-gradient-to-br ${photo.color} p-4 flex flex-col justify-end text-white shadow-md hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="relative z-10">
                <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">{photo.category}</span>
                <h4 className="font-bold text-sm">{photo.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MacWindow>
  );
}

// 5. Instagram Social Modal
export function InstagramModal({ onClose }) {
  return (
    <MacWindow title="Instagram Profile" icon={InstagramIcon} onClose={onClose}>
      <div className="text-center space-y-4 py-2">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">@ishantvibecode</h3>
          <p className="text-xs text-slate-500">Creative Technologist & UI Engineer</p>
        </div>
        <div className="flex justify-center gap-6 py-2 border-y border-slate-100 text-xs">
          <div><span className="font-bold text-slate-800">142</span> <span className="text-slate-500">posts</span></div>
          <div><span className="font-bold text-slate-800">4.8k</span> <span className="text-slate-500">followers</span></div>
          <div><span className="font-bold text-slate-800">320</span> <span className="text-slate-500">following</span></div>
        </div>
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs rounded-xl shadow-md hover:opacity-95 transition-opacity"
        >
          <span>Visit Instagram Profile</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </MacWindow>
  );
}

// 6. Mail Contact Modal
export function MailModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <MacWindow title="New Message — macOS Mail" icon={Mail} onClose={onClose}>
      {submitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Message Sent Successfully!</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Thank you for reaching out. Your message has been dispatched via Apple Mail.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">To:</label>
            <input 
              type="text" 
              readOnly 
              value="ishantchauhan@vibecode.dev" 
              className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Subject:</label>
            <input 
              type="text" 
              required
              placeholder="Collaboration Opportunity / Project Inquiry"
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Message:</label>
            <textarea 
              rows={4}
              required
              placeholder="Hi Ishant, I love your portfolio dock implementation..."
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send Message
            </button>
          </div>
        </form>
      )}
    </MacWindow>
  );
}

// 7. Trash Inspector Modal
export function TrashModal({ itemsInTrash, onEmptyTrash, onClose }) {
  const handleEmpty = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.8 }
    });
    onEmptyTrash();
  };

  return (
    <MacWindow title="Trash — Discarded Drafts" icon={Trash2} onClose={onClose}>
      <div className="space-y-4">
        {itemsInTrash > 0 ? (
          <>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{itemsInTrash} Temporary Items in Trash</h4>
                <p className="text-[11px] text-slate-500">Crumpled draft files & temporary visual renders.</p>
              </div>
              <button 
                onClick={handleEmpty}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Empty Trash
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-100/60 rounded-lg border border-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="truncate text-slate-700 font-mono">old_dock_draft_v1.js</span>
              </div>
              <div className="p-3 bg-slate-100/60 rounded-lg border border-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="truncate text-slate-700 font-mono">discarded_icon_render.png</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center space-y-2">
            <Trash2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Trash is Empty</h3>
            <p className="text-xs text-slate-400">No discarded items currently in the bin.</p>
          </div>
        )}
      </div>
    </MacWindow>
  );
}
