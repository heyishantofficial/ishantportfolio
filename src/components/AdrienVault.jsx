import React from 'react';
import { PROJECTS_DATA, PROFILE_INFO } from '../data/projectsData';

export default function AdrienVault({ onSelectProject }) {
  return (
    <div className="w-full max-w-4xl bg-[#111216] border-4 border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative text-white">
      
      {/* Decorative Stick Figure Doodle on Right Margin */}
      <div className="absolute right-4 top-12 hidden lg:block opacity-60 pointer-events-none">
        <svg width="48" height="120" viewBox="0 0 50 120" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
          {/* Stick Head */}
          <circle cx="25" cy="20" r="12" />
          {/* Body */}
          <line x1="25" y1="32" x2="25" y2="75" />
          {/* Arms */}
          <line x1="25" y1="45" x2="5" y2="25" />
          <line x1="25" y1="45" x2="45" y2="25" />
          {/* Legs */}
          <line x1="25" y1="75" x2="10" y2="110" />
          <line x1="25" y1="75" x2="40" y2="110" />
        </svg>
      </div>

      {/* Header Quick Contact Links (Adrien Lamy Style) */}
      <div className="mb-10 pb-6 border-b border-white/15">
        <div className="flex flex-col gap-2 font-mono text-xs sm:text-sm font-bold tracking-wider uppercase">
          <a
            href={PROFILE_INFO.socials.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hover:text-yellow-300 transition-colors inline-flex items-center gap-2"
          >
            <span>► LINKEDIN</span>
          </a>
          <a
            href={PROFILE_INFO.socials.twitter}
            target="_blank"
            rel="noreferrer"
            className="hover:text-yellow-300 transition-colors inline-flex items-center gap-2"
          >
            <span>► PORTFOLIO / X (TWITTER)</span>
          </a>
          <a
            href={`mailto:${PROFILE_INFO.email}`}
            className="hover:text-yellow-300 transition-colors inline-flex items-center gap-2 text-yellow-400"
          >
            <span>► HEY@{PROFILE_INFO.email.toUpperCase()}</span>
          </a>
        </div>
      </div>

      {/* Bio Statement */}
      <div className="mb-10">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2 tracking-tight">
          ISHANT CHAUHAN :D
        </h2>
        <p className="font-mono text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xl">
          Content Producer & Strategist based in India. I build content systems, craft brand storytelling, and vibecode daily life tools.
        </p>
      </div>

      {/* Project Rows List (Adrien Lamy Signature Leader Lines) */}
      <div className="space-y-6">
        <h3 className="font-mono text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-white/10 pb-2">
          // SELECTED WORK & VIBECODED APPS ({PROJECTS_DATA.length})
        </h3>

        {PROJECTS_DATA.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="adrien-row group flex items-baseline justify-between cursor-pointer py-1 text-xs sm:text-sm font-mono tracking-wider"
          >
            {/* Title & Category Info */}
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-extrabold uppercase group-hover:text-yellow-300 transition-colors text-white">
                {project.title}
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">
                ({project.category.replace('-', ' ').toUpperCase()})
              </span>
            </div>

            {/* Dashed Leader Line */}
            <div className="adrien-leader-line" />

            {/* Action Trigger Button */}
            <button
              className="shrink-0 font-extrabold text-white group-hover:text-yellow-300 transition-colors flex items-center gap-1"
            >
              <span>► {project.actionType}</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
