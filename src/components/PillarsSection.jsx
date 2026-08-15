import React from 'react';
import { Cpu, Sparkles, Code2, ArrowUpRight } from 'lucide-react';
import { PROFILE_INFO } from '../data/projectsData';

const ICON_MAP = {
  Cpu: Cpu,
  Sparkles: Sparkles,
  Code2: Code2
};

export default function PillarsSection({ onSelectPillar }) {
  return (
    <section id="pillars" className="py-24 border-t border-white/5 bg-[#0b0c10] relative">
      <div className="container">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-widest block mb-3">
              // CORE CAPABILITIES & METHODOLOGY
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              THE 3 PILLARS OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007a] to-[#e5f935]">BUILDING.</span>
            </h2>
          </div>
          <p className="font-body text-sm sm:text-base text-[#a0a5b5] max-w-md">
            Connecting narrative craft with architectural media distribution and rapid AI software development.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROFILE_INFO.pillars.map((pillar, index) => {
            const IconComponent = ICON_MAP[pillar.iconName] || Sparkles;
            const accentColors = ['#00f0ff', '#ff007a', '#e5f935'];
            const currentColor = accentColors[index % accentColors.length];

            return (
              <div
                key={pillar.number}
                className="group relative p-8 rounded-3xl bg-[#12141a] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                {/* Glow Backdrop Accent */}
                <div 
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500"
                  style={{ backgroundColor: currentColor }}
                />

                <div>
                  {/* Top Bar: Number & Icon */}
                  <div className="flex items-center justify-between mb-8">
                    <span 
                      className="font-mono text-2xl font-extrabold"
                      style={{ color: currentColor }}
                    >
                      {pillar.number}
                    </span>
                    <div 
                      className="p-3 rounded-2xl bg-[#1a1d26] border border-white/10 text-white transition-transform duration-300 group-hover:scale-110"
                    >
                      <IconComponent className="w-6 h-6" style={{ color: currentColor }} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-bold text-2xl text-white mb-4 tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="font-body text-sm text-[#a0a5b5] leading-relaxed mb-6">
                    {pillar.description}
                  </p>
                </div>

                {/* Bottom Trigger */}
                <button
                  onClick={() => onSelectPillar(pillar.title)}
                  className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-white group-hover:text-[#e5f935] transition-colors"
                >
                  <span>EXPLORE {pillar.title}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
