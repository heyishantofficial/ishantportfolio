import React from 'react';
import { PROJECTS_DATA, PROFILE_INFO } from '../data/projectsData';

export default function AdrienVaultPanel({ onSelectProject }) {
  return (
    <div className="relative w-full max-w-3xl bg-[#181818] rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/10 text-white font-mono">
      
      {/* Dangling Stick Figure on the Right (Adrien Lamy Screenshot #3) */}
      <div className="absolute right-6 top-8 hidden md:block opacity-80 pointer-events-none">
        <svg width="40" height="150" viewBox="0 0 40 150" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          {/* Hanging Rope */}
          <line x1="20" y1="0" x2="20" y2="40" strokeDasharray="3 3" />
          {/* Stick Head */}
          <circle cx="20" cy="50" r="10" />
          {/* Eyes */}
          <circle cx="17" cy="48" r="1" fill="white" />
          <circle cx="23" cy="48" r="1" fill="white" />
          {/* Mouth */}
          <path d="M 17 54 Q 20 57 23 54" stroke="white" strokeWidth="1.5" />
          {/* Body */}
          <line x1="20" y1="60" x2="20" y2="100" />
          {/* Arms holding the rope overhead */}
          <line x1="20" y1="70" x2="20" y2="38" />
          {/* Legs */}
          <line x1="20" y1="100" x2="10" y2="135" />
          <line x1="20" y1="100" x2="30" y2="135" />
        </svg>
      </div>

      {/* Intro Bio Text (Adrien Lamy Screenshot #3 Style) */}
      <div className="mb-8 max-w-xl">
        <h2 className="font-mono font-extrabold text-lg sm:text-xl text-white mb-4 leading-tight uppercase tracking-wide">
          SUP, I'M ISHANT CHAUHAN.<br />
          CONTENT PRODUCER, STRATEGIST & VIBECODER<br />
          BASED IN INDIA
        </h2>

        <p className="font-mono text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 uppercase">
          I BUILD CONTENT SYSTEMS, CRAFT BRAND STORYTELLING, AND VIBECODE APPS THAT SOLVE DAILY LIFE.
        </p>

        <p className="font-mono text-xs sm:text-sm text-gray-400 leading-relaxed mb-4 uppercase">
          PASSIONATE ABOUT AUDIO-VISUAL MEDIA, AI AUTOMATION, AND RAPID PRODUCT DEVELOPMENT. I WORK WITH BRANDS, FOUNDERS, AND CREATORS TO BRING IDEAS TO LIFE IN THE MOST CREATIVE WAYS POSSIBLE.
        </p>

        <p className="font-mono text-xs text-gray-500 uppercase">
          I ALSO EXPERIMENT WITH AUDIO SYNTHESIS & INDIE TOOLS IN MY FREE TIME.
        </p>
      </div>

      {/* Links Row */}
      <div className="mb-10 flex flex-col gap-2 font-mono text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase">
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
          <span>► PORTFOLIO / TWITTER</span>
        </a>
        <a
          href={`mailto:${PROFILE_INFO.email}`}
          className="hover:text-yellow-300 transition-colors inline-flex items-center gap-2 text-yellow-300"
        >
          <span>► HEY@{PROFILE_INFO.email.toUpperCase()}</span>
        </a>
      </div>

      {/* Projects List with dashed leader lines */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        {PROJECTS_DATA.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="adrien-item group flex items-baseline justify-between cursor-pointer py-1 font-mono text-xs sm:text-sm tracking-wider uppercase"
          >
            {/* Title & Tagline snippet */}
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-extrabold text-white group-hover:text-yellow-300 transition-colors">
                {project.title}
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">
                ({project.category.replace('-', ' ')})
              </span>
            </div>

            {/* Dashed Leader Line */}
            <div className="adrien-line" />

            {/* Action Trigger Button */}
            <button className="shrink-0 font-extrabold text-white group-hover:text-yellow-300 transition-colors flex items-center gap-1">
              <span>► {project.actionType}</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
