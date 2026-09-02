import React from 'react';
import { FileText, Sparkles, Mail, Link2 } from 'lucide-react';

/**
 * One icon renderer for every place a filesystem node is shown — Finder,
 * the desktop, Spotlight and the command palette — so a node looks the same
 * wherever the visitor runs into it.
 *
 * Folders use the real macOS folder artwork; files get a paper-sheet tile so
 * they read as documents rather than as more folders.
 */
export default function NodeIcon({ node, size = 48, className = '' }) {
  const px = `${size}px`;

  if (node.kind === 'folder') {
    return (
      <img
        src="/icons/Folder.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: px, height: px }}
        className={`object-contain drop-shadow-md select-none pointer-events-none ${className}`}
      />
    );
  }

  if (node.kind === 'pdf') {
    return (
      <span
        style={{ width: px, height: px }}
        aria-hidden="true"
        className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex flex-col items-center justify-center overflow-hidden ${className}`}
      >
        <FileText style={{ width: size * 0.4, height: size * 0.4 }} className="text-[#c0392b]" />
        {size > 32 && <span className="text-[7px] font-black tracking-wider text-[#c0392b] mt-0.5">PDF</span>}
      </span>
    );
  }

  const Glyph = node.kind === 'project' ? Sparkles : node.kind === 'mail' ? Mail : node.kind === 'link' ? Link2 : FileText;

  // Case studies borrow their own accent so a folder of projects reads as a
  // set of distinct things rather than a wall of identical sheets.
  const tint = node.kind === 'project' ? (node.project?.accent || '#c0392b') : '#64748b';

  return (
    <span
      style={{ width: px, height: px }}
      aria-hidden="true"
      className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex items-center justify-center ${className}`}
    >
      <Glyph style={{ width: size * 0.44, height: size * 0.44, color: tint }} />
    </span>
  );
}
