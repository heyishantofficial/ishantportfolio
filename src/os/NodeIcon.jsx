import React, { useState } from 'react';
import { FileText, Sparkles, Mail, Link2, Image as ImageIcon, Film, Music, File } from 'lucide-react';

/**
 * One icon renderer for every place a filesystem node is shown — Finder,
 * the desktop, Spotlight and the command palette — so a node looks the same
 * wherever the visitor runs into it.
 *
 * Folders use the real macOS folder artwork; files get a paper-sheet tile so
 * they read as documents rather than as more folders.
 */
export default function NodeIcon({ node, size = 48, className = '' }) {
  const [imgError, setImgError] = useState(false);
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

  if (node.kind === 'image' && (node.preview || node.dataUrl) && !imgError) {
    return (
      <span
        style={{ width: px, height: px }}
        aria-hidden="true"
        className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex items-center justify-center overflow-hidden p-0.5 ${className}`}
      >
        <img
          src={node.preview || node.dataUrl}
          alt={node.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-[14%]"
        />
      </span>
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

  let Glyph = FileText;
  let tint = '#64748b';

  if (node.kind === 'project') {
    Glyph = Sparkles;
    tint = node.project?.accent || '#c0392b';
  } else if (node.kind === 'mail') {
    Glyph = Mail;
    tint = '#3b82f6';
  } else if (node.kind === 'link') {
    Glyph = Link2;
    tint = '#10b981';
  } else if (node.kind === 'image') {
    Glyph = ImageIcon;
    tint = '#8b5cf6';
  } else if (node.kind === 'video') {
    Glyph = Film;
    tint = '#ec4899';
  } else if (node.kind === 'audio') {
    Glyph = Music;
    tint = '#f59e0b';
  } else if (node.kind === 'file') {
    Glyph = File;
    tint = '#64748b';
  }

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

