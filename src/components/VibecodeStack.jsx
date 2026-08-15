import React from 'react';
import { Cpu, Terminal, Zap, Code2, Bot, Layers, Workflow, Database } from 'lucide-react';

const STACK_GROUPS = [
  {
    category: 'VIBECODING & AI STACK',
    color: '#00f0ff',
    items: [
      { name: 'Cursor IDE', desc: 'AI-First Code Generation & Iteration' },
      { name: 'Claude 3.7 / Gemini 3.6', desc: 'System Architecture & Script Prompts' },
      { name: 'Antigravity SDK', desc: 'Autonomous Agent Orchestration' },
      { name: 'v0 & Bolt.new', desc: 'Rapid UI Wireframing & Prototyping' }
    ]
  },
  {
    category: 'FRONTEND & APPS',
    color: '#ff007a',
    items: [
      { name: 'React & Vite', desc: 'Ultra-fast Single Page Web Applications' },
      { name: 'SwiftUI (macOS)', desc: 'Native Desktop Utilities & Status Bar Apps' },
      { name: 'Vanilla CSS3 & Modern Web APIs', desc: 'Custom Animations & Audio Transcriptions' },
      { name: 'Chrome Extension API', desc: 'Manifest V3 Creator Scrapers' }
    ]
  },
  {
    category: 'CONTENT & SYSTEMS',
    color: '#e5f935',
    items: [
      { name: 'Multi-Channel Media Pipelines', desc: '1 Video → 10 Modular Content Assets' },
      { name: 'Notion & Airtable Workspaces', desc: 'Editorial Kanban & Content Vaults' },
      { name: 'Make.com & Webhooks', desc: 'Automated Publishing & Social Distribution' },
      { name: 'Brand Storytelling Decks', desc: 'Executive Identity & Hook Frameworks' }
    ]
  }
];

export default function VibecodeStack() {
  return (
    <section id="stack" className="py-24 border-t border-white/5 bg-[#0b0c10] relative">
      <div className="container">
        
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="font-mono text-xs font-bold text-[#e5f935] uppercase tracking-widest block mb-3">
            // HOW I BUILD & SHIP
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-4">
            THE VIBECODE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff007a]">STACK.</span>
          </h2>
          <p className="font-body text-sm sm:text-base text-[#a0a5b5]">
            Combining high-speed AI code generation with strategic content engineering to ship tools and media systems in record time.
          </p>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {STACK_GROUPS.map((group) => (
            <div
              key={group.category}
              className="p-8 rounded-3xl bg-[#12141a] border border-white/10 flex flex-col justify-between"
            >
              <div>
                <h3 
                  className="font-mono text-xs font-bold tracking-widest mb-6 pb-3 border-b border-white/5 flex items-center justify-between"
                  style={{ color: group.color }}
                >
                  <span>{group.category}</span>
                  <Terminal className="w-4 h-4" />
                </h3>

                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.name} className="group p-3 rounded-xl bg-[#1a1d26]/60 border border-white/5 hover:border-white/20 transition-colors">
                      <h4 className="font-display font-bold text-sm text-white group-hover:text-[#00f0ff] transition-colors mb-0.5">
                        {item.name}
                      </h4>
                      <p className="font-mono text-[11px] text-[#a0a5b5]">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
