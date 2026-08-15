import React, { useState } from 'react';
import { LayoutGrid, List, ArrowUpRight, Play, ExternalLink, Sparkles } from 'lucide-react';
import { PROJECTS_DATA } from '../data/projectsData';

const CATEGORIES = [
  { id: 'all', label: 'All Projects', count: PROJECTS_DATA.length },
  { id: 'vibecoded-apps', label: 'Vibecoded Apps', count: PROJECTS_DATA.filter(p => p.category === 'vibecoded-apps').length },
  { id: 'content-systems', label: 'Content Systems', count: PROJECTS_DATA.filter(p => p.category === 'content-systems').length },
  { id: 'brand-storytelling', label: 'Brand Storytelling', count: PROJECTS_DATA.filter(p => p.category === 'brand-storytelling').length },
];

export default function WorkVault({ onOpenProjectModal }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' (Adrien Lamy style) | 'grid' (Supersolid style)

  const filteredProjects = PROJECTS_DATA.filter(p => 
    activeCategory === 'all' ? true : p.category === activeCategory
  );

  return (
    <section id="work" className="py-24 border-t border-white/5 bg-[#0a0b0e] relative">
      <div className="container">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="font-mono text-xs font-bold text-[#ff007a] uppercase tracking-widest block mb-3">
              // FEATURED ARCHIVE & PRODUCT PLAYGROUND
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              THE WORK <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#e5f935]">VAULT.</span>
            </h2>
          </div>

          {/* View Mode Switcher (List vs Grid) */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#141720] border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-[#00f0ff] text-black shadow-md' : 'text-[#a0a5b5] hover:text-white'
              }`}
              title="Adrien Lamy Leader Line List Mode"
            >
              <List className="w-3.5 h-3.5" />
              <span>List View (Adrien Style)</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-[#e5f935] text-black shadow-md' : 'text-[#a0a5b5] hover:text-white'
              }`}
              title="Supersolid Asymmetrical Grid Mode"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View (Supersolid)</span>
            </button>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-12 border-b border-white/10 pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'bg-[#141720] text-[#a0a5b5] hover:text-white hover:bg-[#1a1d26] border border-white/5'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* ==========================================================================
            VIEW MODE 1: ADRIEN LAMY LEADER LINE LIST VIEW
            ========================================================================== */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-4">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id}
                onClick={() => onOpenProjectModal(project)}
                className="group relative p-6 rounded-2xl bg-[#12141a]/90 border border-white/10 hover:border-[#00f0ff]/50 transition-all duration-300 hover:bg-[#1a1d26] flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Index + Title + Tagline */}
                <div className="flex items-center gap-6 min-w-[320px]">
                  <span className="font-mono text-sm font-bold text-[#62687a] group-hover:text-[#00f0ff] transition-colors">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-xl text-white group-hover:text-[#00f0ff] transition-colors tracking-tight">
                        {project.title}
                      </h3>
                      {project.badge && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border"
                          style={{ borderColor: project.badgeColor, color: project.badgeColor }}
                        >
                          {project.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#a0a5b5] line-clamp-1">
                      {project.tagline}
                    </p>
                  </div>
                </div>

                {/* Middle: Dotted Leader Line (Adrien Lamy Signature) */}
                <div className="hidden md:block leader-line opacity-40 group-hover:opacity-100 transition-opacity" />

                {/* Right: Tags + Action Button */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-2">
                    {project.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-md bg-[#181b24] font-mono text-[11px] text-[#a0a5b5]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1d26] group-hover:bg-[#00f0ff] text-white group-hover:text-black font-mono text-xs font-bold transition-all duration-300"
                  >
                    <span>► {project.actionType}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==========================================================================
            VIEW MODE 2: SUPERSOLID ASYMMETRICAL MASONRY GRID VIEW
            ========================================================================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, idx) => {
              // Alternate aspect ratios for asymmetrical editorial brutalism
              const aspectRatios = ['aspect-video', 'aspect-[4/5]', 'aspect-square'];
              const currentAspect = aspectRatios[idx % aspectRatios.length];

              return (
                <div
                  key={project.id}
                  onClick={() => onOpenProjectModal(project)}
                  className="group relative rounded-3xl bg-[#12141a] border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden flex flex-col justify-between cursor-pointer"
                >
                  {/* Visual Cover Stage */}
                  <div className={`relative w-full ${currentAspect} bg-gradient-to-br from-[#1a1d26] to-[#0d0f14] p-6 flex flex-col justify-between overflow-hidden border-b border-white/5`}>
                    
                    {/* Top Row: Year & Badge */}
                    <div className="flex items-center justify-between z-10">
                      <span className="font-mono text-xs text-[#a0a5b5] font-bold">
                        {project.year}
                      </span>
                      {project.badge && (
                        <span 
                          className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md"
                          style={{ backgroundColor: `${project.badgeColor}20`, color: project.badgeColor, border: `1px solid ${project.badgeColor}` }}
                        >
                          {project.badge}
                        </span>
                      )}
                    </div>

                    {/* Middle: Title & Impact Statement */}
                    <div className="z-10 mt-auto">
                      <h3 className="font-display font-extrabold text-2xl text-white mb-2 tracking-tight group-hover:text-[#e5f935] transition-colors">
                        {project.title}
                      </h3>
                      <p className="font-body text-xs text-[#a0a5b5] line-clamp-2 leading-relaxed">
                        {project.summary}
                      </p>
                    </div>

                    {/* Subtle Hover Gradient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#ff007a]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>

                  {/* Card Footer: Metrics & Action */}
                  <div className="p-6 bg-[#12141a] flex items-center justify-between gap-4">
                    <span className="font-mono text-[11px] text-[#00f0ff] font-bold truncate">
                      ⚡ {project.metrics}
                    </span>

                    <button
                      className="p-2.5 rounded-full bg-[#1a1d26] group-hover:bg-[#e5f935] text-white group-hover:text-black transition-colors"
                      title={project.actionType}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
